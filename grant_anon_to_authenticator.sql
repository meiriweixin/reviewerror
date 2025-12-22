-- Grant anon role to authenticator so PostgREST can use it
-- This is required for Supabase API access

-- Check if authenticator role exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        -- Grant anon role to authenticator (allows authenticator to "become" anon)
        GRANT anon TO authenticator;
        RAISE NOTICE 'Granted anon role to authenticator';
    ELSE
        RAISE NOTICE 'Authenticator role does not exist';
    END IF;
END
$$;

-- Also grant authenticated to authenticator (for completeness)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator')
       AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT authenticated TO authenticator;
        RAISE NOTICE 'Granted authenticated role to authenticator';
    END IF;
END
$$;

-- Verify the role memberships
SELECT
    r.rolname as role,
    m.rolname as member_of
FROM pg_roles r
LEFT JOIN pg_auth_members am ON r.oid = am.member
LEFT JOIN pg_roles m ON am.roleid = m.oid
WHERE r.rolname IN ('anon', 'authenticated', 'authenticator')
ORDER BY r.rolname;

-- Success message
SELECT 'Role memberships configured!' as message;
