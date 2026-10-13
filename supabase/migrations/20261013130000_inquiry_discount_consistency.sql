-- Keep an inquiry's message and its discount consistent.
--
-- Found by driving the real checkout: a buyer who taps WhatsApp with a code
-- applied and then, within the 24-hour dedupe window, comes back for the same
-- product on another channel leaves one folded inquiry. The message column was
-- replaced (it coalesced to the newest text) while `discount_code` and
-- `discount_minor` kept the *earlier* order's values — so the dashboard showed a
-- discount that the stored order text does not mention.
--
-- The fix ties them together: the order text and its discount are written as one
-- unit. Whichever order wrote the text last owns the discount fields too, even
-- when that order had no code (in which case they are cleared rather than kept).
--
-- Rows without a message — every product line after the first in a cart, and
-- every row written before migration 20261013120000 — are untouched by this and
-- keep the previous COALESCE behaviour.

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
  v_has_message BOOLEAN;
BEGIN
  v_lock_key := ('x' || substr(md5(p_store_id::text || ':' || p_product_id::text || ':' || coalesce(p_device_hash, 'none')), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT * INTO v_existing
  FROM public.inquiries
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND (p_device_hash IS NOT NULL AND device_hash = p_device_hash)
    AND status IN ('new', 'chatting')
    AND created_at > (timezone('utc'::text, now()) - interval '24 hours')
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_has_message := NULLIF(p_message, '') IS NOT NULL;

    UPDATE public.inquiries
    SET
      buyer_name = COALESCE(NULLIF(p_buyer_name, ''), v_existing.buyer_name),
      buyer_phone = COALESCE(NULLIF(p_buyer_phone, ''), v_existing.buyer_phone),
      selected_option = COALESCE(NULLIF(p_selected_option, ''), v_existing.selected_option),
      source = COALESCE(NULLIF(p_source, ''), v_existing.source),
      order_ref = COALESCE(NULLIF(p_order_ref, ''), v_existing.order_ref),
      message = COALESCE(NULLIF(p_message, ''), v_existing.message),
      -- The text and its discount move together, or the dashboard reports a
      -- discount the order never had.
      discount_code = CASE
        WHEN v_has_message THEN NULLIF(p_discount_code, '')
        ELSE COALESCE(NULLIF(p_discount_code, ''), v_existing.discount_code)
      END,
      discount_minor = CASE
        WHEN v_has_message THEN p_discount_minor
        ELSE COALESCE(p_discount_minor, v_existing.discount_minor)
      END,
      updated_at = timezone('utc'::text, now())
    WHERE id = v_existing.id
    RETURNING * INTO v_result;

    RETURN v_result;
  END IF;

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
