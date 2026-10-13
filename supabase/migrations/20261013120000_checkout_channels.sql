-- Multi-channel checkout: WhatsApp, Instagram, Facebook and TikTok.
--
-- Everything here exists so a single question has an answer: *which channel did
-- this order come from, and what did the buyer actually ask for?*
--
-- Three gaps this closes, all on `inquiries`:
--
-- 1. `source` was constrained to ('whatsapp', 'instagram', 'tiktok', 'direct',
--    'other'). Facebook was missing, so an order that arrived from a Facebook
--    link could only be filed as `other` — recorded, but invisible in any
--    per-channel report, which is exactly what the merchant is trying to read.
--
-- 2. The prefilled order text was never stored. `inquiries` knew the product and
--    the price but not one word the buyer actually sent, so the dashboard could
--    not answer "what did they ask for?" once the chat scrolled away.
--
-- 3. There was no way to tie the lines of one order together (each product in a
--    cart is its own inquiry row), and no place to keep a discount code, so
--    redemptions could not be counted or attributed.

-- 1. Widen the source vocabulary.
--
--    The original CHECK was declared inline, so Postgres named it for us
--    (`inquiries_source_check`) and the name is not guaranteed across the repair
--    runs this table has been through. Drop whatever check constraint mentions
--    `source` instead of guessing the name; the whole block is safe to re-run.
DO $$
DECLARE
  existing_constraint RECORD;
BEGIN
  FOR existing_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.inquiries'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%source%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.inquiries DROP CONSTRAINT %I',
      existing_constraint.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_source_check
    CHECK (source IN ('whatsapp', 'instagram', 'facebook', 'tiktok', 'direct', 'other'));

-- 2. Order identity, discount and message.
--
--    Every column is nullable on purpose: rows written before this migration
--    have none of it, and a missing value must never block an order from being
--    recorded. `order_ref` is the human-readable reference the buyer sees in the
--    message (e.g. `SL-4F2A`) — the cart writes one row per product, and this is
--    what groups them back into one order.
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS order_ref TEXT,
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_minor INTEGER;

COMMENT ON COLUMN public.inquiries.message IS
  'The prefilled order text the buyer was handed for the channel they chose, stored verbatim.';
COMMENT ON COLUMN public.inquiries.order_ref IS
  'Reference shown to the buyer (SL-XXXX). One per cart order; each product line repeats it.';
COMMENT ON COLUMN public.inquiries.discount_minor IS
  'Discount applied to this order in integer minor units, as shown to the buyer.';

-- 3. Indexes the dashboards read through: per-store per-channel, and
--    per-store per-code for redemption counts.
CREATE INDEX IF NOT EXISTS inquiries_store_source_idx
  ON public.inquiries (store_id, source);

CREATE INDEX IF NOT EXISTS inquiries_store_order_ref_idx
  ON public.inquiries (store_id, order_ref)
  WHERE order_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS inquiries_store_discount_code_idx
  ON public.inquiries (store_id, discount_code)
  WHERE discount_code IS NOT NULL;

-- 4. Teach the dedupe RPC the new fields.
--
--    `CREATE OR REPLACE` cannot change a parameter list — it would add an
--    overload and leave the 10-argument version callable (and ambiguous for
--    PostgREST named arguments). Drop the exact old signature first.
DROP FUNCTION IF EXISTS public.create_or_update_inquiry(
  UUID, BIGINT, TEXT, CHAR(3), INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.create_or_update_inquiry(
  p_store_id UUID,
  p_product_id BIGINT,
  p_product_name TEXT,
  p_currency CHAR(3),
  p_product_price_minor INTEGER,
  p_selected_option TEXT,
  p_buyer_name TEXT,
  p_buyer_phone TEXT,
  p_device_hash TEXT,
  p_source TEXT,
  p_message TEXT DEFAULT NULL,
  p_order_ref TEXT DEFAULT NULL,
  p_discount_code TEXT DEFAULT NULL,
  p_discount_minor INTEGER DEFAULT NULL
)
RETURNS public.inquiries AS $$
DECLARE
  v_lock_key BIGINT;
  v_existing public.inquiries%ROWTYPE;
  v_result public.inquiries%ROWTYPE;
BEGIN
  -- 1. Compute deterministic 64-bit integer hash for transaction-level advisory lock
  v_lock_key := ('x' || substr(md5(p_store_id::text || ':' || p_product_id::text || ':' || coalesce(p_device_hash, 'none')), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 2. Look for open inquiry (status in 'new' or 'chatting') within the past 24 hours
  SELECT * INTO v_existing
  FROM public.inquiries
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND (p_device_hash IS NOT NULL AND device_hash = p_device_hash)
    AND status IN ('new', 'chatting')
    AND created_at > (timezone('utc'::text, now()) - interval '24 hours')
  ORDER BY created_at DESC
  LIMIT 1;

  -- 3. If open inquiry exists, update it rather than duplicating.
  --    `source` follows the newest tap: a buyer who tapped WhatsApp and then came
  --    back through Instagram is an Instagram order, and attributing it to the
  --    first channel would quietly overstate WhatsApp forever.
  IF FOUND THEN
    UPDATE public.inquiries
    SET
      buyer_name = COALESCE(NULLIF(p_buyer_name, ''), v_existing.buyer_name),
      buyer_phone = COALESCE(NULLIF(p_buyer_phone, ''), v_existing.buyer_phone),
      selected_option = COALESCE(NULLIF(p_selected_option, ''), v_existing.selected_option),
      source = COALESCE(NULLIF(p_source, ''), v_existing.source),
      message = COALESCE(NULLIF(p_message, ''), v_existing.message),
      order_ref = COALESCE(NULLIF(p_order_ref, ''), v_existing.order_ref),
      discount_code = COALESCE(NULLIF(p_discount_code, ''), v_existing.discount_code),
      discount_minor = COALESCE(p_discount_minor, v_existing.discount_minor),
      updated_at = timezone('utc'::text, now())
    WHERE id = v_existing.id
    RETURNING * INTO v_result;

    RETURN v_result;
  END IF;

  -- 4. Otherwise insert a brand new inquiry row
  INSERT INTO public.inquiries (
    store_id,
    product_id,
    product_name,
    currency,
    product_price_minor,
    selected_option,
    buyer_name,
    buyer_phone,
    device_hash,
    status,
    source,
    message,
    order_ref,
    discount_code,
    discount_minor
  )
  VALUES (
    p_store_id,
    p_product_id,
    p_product_name,
    p_currency,
    p_product_price_minor,
    p_selected_option,
    NULLIF(p_buyer_name, ''),
    NULLIF(p_buyer_phone, ''),
    p_device_hash,
    'new',
    COALESCE(p_source, 'direct'),
    NULLIF(p_message, ''),
    NULLIF(p_order_ref, ''),
    NULLIF(p_discount_code, ''),
    p_discount_minor
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
