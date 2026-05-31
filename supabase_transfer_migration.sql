-- ================================================================
-- STORE TRANSFER RPC
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
BEGIN
    -- 1. Get the current authenticated user
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Verify the caller owns the store
    SELECT owner_id, state_json INTO store_owner_id, current_state_json
    FROM public.stores
    WHERE id = store_id_param;

    IF store_owner_id IS NULL THEN
        RAISE EXCEPTION 'Store not found';
    END IF;

    IF store_owner_id != current_uid THEN
        RAISE EXCEPTION 'You do not have permission to transfer this store';
    END IF;

    -- 3. Find the target user by email in auth.users
    SELECT id INTO target_uid
    FROM auth.users
    WHERE email = target_email
    LIMIT 1;

    IF target_uid IS NULL THEN
        RAISE EXCEPTION 'User with this email not found on SwiftLink Pro. They must sign up first.';
    END IF;

    -- 4. Prevent transferring to self
    IF target_uid = current_uid THEN
        RAISE EXCEPTION 'You already own this store';
    END IF;

    -- 5. Update the owner_id and state_json
    -- We use jsonb_set to replace the ownerId inside state_json
    UPDATE public.stores
    SET 
        owner_id = target_uid,
        state_json = jsonb_set(current_state_json, '{ownerId}', to_jsonb(target_uid::text))
    WHERE id = store_id_param;

    RETURN true;
END;
$$;
