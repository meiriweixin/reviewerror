-- Direct GRANT statement to allow authenticator to use anon role

GRANT anon TO authenticator;

-- Verify it worked
SELECT
    r.rolname as role,
    m.rolname as member_of
FROM pg_roles r
LEFT JOIN pg_auth_members am ON r.oid = am.member
LEFT JOIN pg_roles m ON am.roleid = m.oid
WHERE r.rolname = 'anon';

-- Success
SELECT 'anon role granted to authenticator!' as message;
