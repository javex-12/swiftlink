-- ============================================================================
-- Step 0: Inquiries, Customers, Multi-Currency, Analytics, and Store Hardening
-- ============================================================================

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Stores Table Extensions: Currency, Settings, Onboarding Progress
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS ask_buyer_details BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 5;

-- Backfill all existing stores to 'NGN' and completed onboarding (step 5)
UPDATE public.stores
SET currency = 'NGN'
WHERE currency IS NULL OR currency = '';

UPDATE public.stores
SET onboarding_step = 5
WHERE onboarding_step IS NULL OR onboarding_step < 5;

-- Set default for new draft stores created during signup to step 1
ALTER TABLE public.stores
  ALTER COLUMN onboarding_step SET DEFAULT 1;

-- Currency CHECK constraint (enforcing supported ISO codes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_stores_supported_currency'
  ) THEN
    ALTER TABLE public.stores
      ADD CONSTRAINT chk_stores_supported_currency
      CHECK (currency IN ('NGN', 'GHS', 'KES', 'ZAR', 'GBP', 'USD', 'EUR', 'CAD'));
  END IF;
END $$;

-- Block changing currency once the store has any inquiries
CREATE OR REPLACE FUNCTION public.chk_store_currency_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.currency IS DISTINCT FROM NEW.currency THEN
    IF EXISTS (SELECT 1 FROM public.inquiries WHERE store_id = NEW.id LIMIT 1) THEN
      RAISE EXCEPTION 'Cannot change store currency after inquiries have been recorded for this store.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_store_currency_lock ON public.stores;
CREATE TRIGGER trg_store_currency_lock
  BEFORE UPDATE OF currency ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.chk_store_currency_lock();

-- Case-insensitive uniqueness index for store_username
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_unique_lower_username
  ON public.stores (lower(store_username))
  WHERE store_username IS NOT NULL AND store_username <> '';

-- Handle format and reserved words: Enforced on INSERT/UPDATE of store_username via trigger
CREATE OR REPLACE FUNCTION public.validate_store_username_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.store_username IS NOT NULL AND NEW.store_username <> '' THEN
    IF NEW.store_username !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
      RAISE EXCEPTION 'Store link must contain only lowercase letters, numbers, and hyphens without consecutive or trailing hyphens.';
    END IF;
    IF length(NEW.store_username) < 3 OR length(NEW.store_username) > 32 THEN
      RAISE EXCEPTION 'Store link must be between 3 and 32 characters.';
    END IF;
    IF lower(NEW.store_username) IN (
      'admin', 'api', 'login', 'signup', 'dashboard', 'pro', 'business',
      'account', 'cart', 'dev', 'terms', 'privacy', 'banned', 'reset-password',
      'store', 'help', 'support', 'settings', 'analytics', 'inquiries',
      'customers', 'checkout', 'pay', 'app', 'auth', 'root', 'billing', 'order'
    ) THEN
      RAISE EXCEPTION 'Store link "%" is reserved. Please choose a different link.', NEW.store_username;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_store_username ON public.stores;
CREATE TRIGGER trg_validate_store_username
  BEFORE INSERT OR UPDATE OF store_username ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_store_username_trigger();

-- 3. Public Read View for Storefront
-- Explicit WHITELIST projection of state_json using jsonb_build_object.
-- Excludes owner_id, plan, credentials, and merchant notifications.
CREATE OR REPLACE VIEW public.public_stores AS
SELECT
  id,
  biz_name,
  store_username,
  phone,
  currency,
  ask_buyer_details,
  jsonb_build_object(
    'bizName', state_json->'bizName',
    'bizImage', state_json->'bizImage',
    'storeUsername', state_json->'storeUsername',
    'phone', state_json->'phone',
    'currency', state_json->'currency',
    'products', COALESCE(state_json->'products', '[]'::jsonb),
    'tagline', state_json->'tagline',
    'aboutUs', state_json->'aboutUs',
    'isLive', state_json->'isLive',
    'websiteTemplateId', state_json->'websiteTemplateId',
    'storeHours', state_json->'storeHours',
    'sections', state_json->'sections',
    'accentColor', state_json->'accentColor',
    'bgColor', state_json->'bgColor',
    'textColor', state_json->'textColor',
    'surfaceColor', state_json->'surfaceColor',
    'buttonColor', state_json->'buttonColor',
    'fontStyle', state_json->'fontStyle',
    'buttonRadius', state_json->'buttonRadius',
    'orderMethod', state_json->'orderMethod',
    'waTemplate', state_json->'waTemplate',
    'minOrder', state_json->'minOrder',
    'outOfStockDisplay', state_json->'outOfStockDisplay',
    'socials', state_json->'socials',
    'location', state_json->'location',
    'deliveryAreas', state_json->'deliveryAreas',
    'deliveryFee', state_json->'deliveryFee',
    'returnPolicy', state_json->'returnPolicy',
    'categories', state_json->'categories',
    'testimonials', state_json->'testimonials',
    'storefrontTheme', state_json->'storefrontTheme',
    'heroImage', state_json->'heroImage',
    'heroTitle', state_json->'heroTitle',
    'heroSubtitle', state_json->'heroSubtitle',
    'heroButtonText', state_json->'heroButtonText',
    'seoTitle', state_json->'seoTitle',
    'ogDescription', state_json->'ogDescription',
    'ogImage', state_json->'ogImage'
  ) AS state_json
FROM public.stores
WHERE onboarding_step >= 5;

-- NOTE (recon 04): this view originally also projected `stores.created_at`, which
-- does not exist on the live table (`stores` has id, biz_name, store_username,
-- phone, state_json, updated_at, owner_id, sections, plan, account_status), so the
-- whole migration aborted on `column "created_at" does not exist`. Add the column
-- deliberately before projecting it, rather than inventing timestamps here.

-- The projection above is additive. The revoke that used to sit here is NOT:
--
--   REVOKE SELECT ON public.stores FROM anon;   -- <-- deliberately removed
--
-- The app still reads `stores` directly with the anon key (the customer storefront
-- has no server data layer yet), so revoking SELECT from `anon` in this migration
-- would take every live storefront offline before the read path moves to the view.
-- The revoke must land in the same change that switches the storefront to
-- `public_stores`, so there is no deploy window where neither is readable
-- (docs/05-IMPROVEMENT-PLAN.md R-09 / §3.3). Granting the view now is harmless.
GRANT SELECT ON public.public_stores TO anon, authenticated;

-- 4. Inquiries Table (Integer Minor Units for Money)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  product_name TEXT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  product_price_minor INTEGER NOT NULL,     -- Price in integer minor units (kobo, cents, pence)
  selected_option TEXT,
  final_amount_minor INTEGER,               -- Editable on sale confirmation (minor units)
  sold_at TIMESTAMPTZ,                      -- Timestamp when marked sold
  buyer_name TEXT,
  buyer_phone TEXT,                         -- Normalized E.164 phone
  device_hash TEXT,                         -- Anonymous visitor fingerprint/cookie hash
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'chatting', 'sold', 'lost')),
  source TEXT NOT NULL DEFAULT 'direct'
    CHECK (source IN ('whatsapp', 'instagram', 'tiktok', 'direct', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_inquiries_sold_requires_amount_and_date
    CHECK (status <> 'sold' OR (final_amount_minor IS NOT NULL AND sold_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_inquiries_open_device
  ON public.inquiries (store_id, product_id, device_hash, created_at DESC)
  WHERE status IN ('new', 'chatting');

CREATE INDEX IF NOT EXISTS idx_inquiries_store_status ON public.inquiries (store_id, status);
CREATE INDEX IF NOT EXISTS idx_inquiries_store_created ON public.inquiries (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_store_sold_at ON public.inquiries (store_id, sold_at DESC) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS idx_inquiries_store_buyer_phone ON public.inquiries (store_id, buyer_phone) WHERE buyer_phone IS NOT NULL;

DROP TRIGGER IF EXISTS trg_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Deduplication: Transactional Advisory Lock Function (called by server route)
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
  p_source TEXT
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

  -- 3. If open inquiry exists, update it rather than duplicating
  IF FOUND THEN
    UPDATE public.inquiries
    SET
      buyer_name = COALESCE(NULLIF(p_buyer_name, ''), v_existing.buyer_name),
      buyer_phone = COALESCE(NULLIF(p_buyer_phone, ''), v_existing.buyer_phone),
      selected_option = COALESCE(NULLIF(p_selected_option, ''), v_existing.selected_option),
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
    source
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
    COALESCE(p_source, 'direct')
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,                     -- Normalized E.164 phone
  name TEXT,                               -- Latest customer name provided
  notes TEXT,                              -- Merchant notes
  chats_count INTEGER NOT NULL DEFAULT 1,
  sold_count INTEGER NOT NULL DEFAULT 0,
  last_chat_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_customers_store_phone UNIQUE (store_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_store_last_chat ON public.customers (store_id, last_chat_at DESC);

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 6. Customer Sync Triggers from Inquiries
CREATE OR REPLACE FUNCTION public.sync_customer_on_inquiry_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.buyer_phone IS NOT NULL AND NEW.buyer_phone <> '' THEN
    INSERT INTO public.customers (
      store_id,
      phone,
      name,
      chats_count,
      sold_count,
      last_chat_at
    )
    VALUES (
      NEW.store_id,
      NEW.buyer_phone,
      NULLIF(NEW.buyer_name, ''),
      1,
      CASE WHEN NEW.status = 'sold' THEN 1 ELSE 0 END,
      NEW.created_at
    )
    ON CONFLICT (store_id, phone) DO UPDATE SET
      chats_count = public.customers.chats_count + 1,
      sold_count = public.customers.sold_count + (CASE WHEN EXCLUDED.sold_count > 0 THEN 1 ELSE 0 END),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), public.customers.name),
      last_chat_at = EXCLUDED.last_chat_at,
      updated_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_inquiry_sync_customer_insert ON public.inquiries;
CREATE TRIGGER trg_inquiry_sync_customer_insert
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_on_inquiry_insert();

CREATE OR REPLACE FUNCTION public.sync_customer_on_inquiry_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.buyer_phone IS NOT NULL AND NEW.buyer_phone <> '' THEN
    IF OLD.status <> 'sold' AND NEW.status = 'sold' THEN
      UPDATE public.customers
      SET sold_count = sold_count + 1,
          updated_at = timezone('utc'::text, now())
      WHERE store_id = NEW.store_id AND phone = NEW.buyer_phone;
    ELSIF OLD.status = 'sold' AND NEW.status <> 'sold' THEN
      UPDATE public.customers
      SET sold_count = GREATEST(0, sold_count - 1),
          updated_at = timezone('utc'::text, now())
      WHERE store_id = NEW.store_id AND phone = NEW.buyer_phone;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_inquiry_sync_customer_status ON public.inquiries;
CREATE TRIGGER trg_inquiry_sync_customer_status
  AFTER UPDATE OF status ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_on_inquiry_status_change();

-- 7. Analytics Daily Counters
CREATE TABLE IF NOT EXISTS public.store_daily_stats (
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  product_taps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (store_id, day, source)
);

CREATE TABLE IF NOT EXISTS public.product_daily_stats (
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  taps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (store_id, product_id, day)
);

CREATE INDEX IF NOT EXISTS idx_store_daily_stats_lookup ON public.store_daily_stats (store_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_product_daily_stats_lookup ON public.product_daily_stats (store_id, day DESC);

-- 7b. Analytics rollup writer.
-- Without this, the two daily-stat tables above are never written by anything and
-- every analytics screen is structurally stuck at zero (docs/05-IMPROVEMENT-PLAN.md
-- R-05). A recorded inquiry IS the product-tap signal: one buyer tapping "Order on
-- WhatsApp" for a product increments that product's taps for the day, and the
-- store's taps for the same day and channel. Defined as SECURITY DEFINER because
-- section 10 revokes INSERT on both stat tables from authenticated and anon.
CREATE OR REPLACE FUNCTION public.rollup_inquiry_into_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.store_daily_stats (store_id, day, source, product_taps)
  VALUES (NEW.store_id, (NEW.created_at AT TIME ZONE 'UTC')::date, NEW.source, 1)
  ON CONFLICT (store_id, day, source) DO UPDATE SET
    product_taps = public.store_daily_stats.product_taps + 1,
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.product_daily_stats (store_id, product_id, day, taps)
  VALUES (NEW.store_id, NEW.product_id, (NEW.created_at AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT (store_id, product_id, day) DO UPDATE SET
    taps = public.product_daily_stats.taps + 1,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_inquiry_rollup_daily_stats ON public.inquiries;
CREATE TRIGGER trg_inquiry_rollup_daily_stats
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.rollup_inquiry_into_daily_stats();

-- 8. Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_daily_stats ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies
DROP POLICY IF EXISTS "Vendors can view own store inquiries" ON public.inquiries;
CREATE POLICY "Vendors can view own store inquiries"
  ON public.inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = inquiries.store_id
      AND public.stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can update own store inquiries" ON public.inquiries;
CREATE POLICY "Vendors can update own store inquiries"
  ON public.inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = inquiries.store_id
      AND public.stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = inquiries.store_id
      AND public.stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can view own customers" ON public.customers;
CREATE POLICY "Vendors can view own customers"
  ON public.customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = customers.store_id
      AND public.stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can update own customers" ON public.customers;
CREATE POLICY "Vendors can update own customers"
  ON public.customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = customers.store_id
      AND public.stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = customers.store_id
      AND public.stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can view own store daily stats" ON public.store_daily_stats;
CREATE POLICY "Vendors can view own store daily stats"
  ON public.store_daily_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = store_daily_stats.store_id
      AND public.stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can view own product daily stats" ON public.product_daily_stats;
CREATE POLICY "Vendors can view own product daily stats"
  ON public.product_daily_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = product_daily_stats.store_id
      AND public.stores.owner_id = auth.uid()
    )
  );

-- 10. Column-Level Security Grants
REVOKE INSERT, DELETE ON public.inquiries FROM authenticated, anon;
REVOKE INSERT, DELETE ON public.customers FROM authenticated, anon;

REVOKE UPDATE ON public.inquiries FROM authenticated;
GRANT UPDATE (status, final_amount_minor, sold_at) ON public.inquiries TO authenticated;

REVOKE UPDATE ON public.customers FROM authenticated;
GRANT UPDATE (name, notes) ON public.customers TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.store_daily_stats FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.product_daily_stats FROM authenticated, anon;
