-- ================================================================
-- STORE TRANSFER RPC (ROBUST VERSION)
-- Run this in your Supabase SQL editor
-- ================================================================

CREATE OR REPLACE FUNCTION transfer_store_by_email(store_id_param uuid, target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the definer (postgres role) to allow querying auth.users
SET search_path = public
AS $$
DECLARE
    current_uid uuid;
    target_uid uuid;
    store_owner_id uuid;
    current_state_json jsonb;
    clean_email text;
BEGIN
    -- 1. Get the current authenticated user
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Clean input
    clean_email := LOWER(TRIM(target_email));

    -- 3. Verify the caller owns the store
    SELECT owner_id, state_json INTO store_owner_id, current_state_json
    FROM public.stores
    WHERE id = store_id_param;

    IF store_owner_id IS NULL THEN
        RAISE EXCEPTION 'Store not found';
    END IF;

    IF store_owner_id != current_uid THEN
        RAISE EXCEPTION 'You do not have permission to transfer this store';
    END IF;

    -- 4. Find the target user by email in auth.users (Case-Insensitive)
    SELECT id INTO target_uid
    FROM auth.users
    WHERE LOWER(email) = clean_email
    LIMIT 1;

    IF target_uid IS NULL THEN
        RAISE EXCEPTION 'User with email % not found on SwiftLink Pro. They must sign up first.', target_email;
    END IF;

    -- 5. Prevent transferring to self
    IF target_uid = current_uid THEN
        RAISE EXCEPTION 'You already own this store';
    END IF;

    -- 6. Update the owner_id and state_json
    UPDATE public.stores
    SET 
        owner_id = target_uid,
        state_json = jsonb_set(current_state_json, '{ownerId}', to_jsonb(target_uid::text))
    WHERE id = store_id_param;

    -- 7. Log the transfer (optional, but good for tracking)
    INSERT INTO public.store_events (store_id, event_type, metadata)
    VALUES (store_id_param, 'store_transferred', jsonb_build_object('from', current_uid, 'to', target_uid, 'email', clean_email));

    RETURN true;
END;
$$;