-- Classified/Redacted Alerts for Testing Redaction Feature
-- These alerts will trigger redaction based on [REDACTED] marker in content

-- 1. Alert with [REDACTED] marker - INSUFFICIENT CLEARANCE
INSERT INTO alerts (
    id, 
    user_id, 
    alert_type, 
    priority_class, 
    content_text, 
    location,
    status
) 
SELECT 
    'a1b2c3d4-1111-4222-8333-444455556666'::uuid,
    u.id,
    'KIDNAPPING',
    'CRITICAL',
    '[REDACTED - INSUFFICIENT CLEARANCE] High-value target extraction in progress. Operatives deployed. Coordinates classified.',
    ST_GeomFromText('POINT(13.1500 11.4409)', 4326),
    'PENDING'
FROM users u WHERE u.phone_number = '+2348000000001' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    content_text = EXCLUDED.content_text,
    priority_class = EXCLUDED.priority_class;

-- 2. Alert with [REDACTED] marker - ENCRYPTED
INSERT INTO alerts (
    id, 
    user_id, 
    alert_type, 
    priority_class, 
    content_text, 
    location,
    status
) 
SELECT 
    'b2c3d4e5-2222-4333-8444-555566667777'::uuid,
    u.id,
    'TERRORISM',
    'CRITICAL',
    '[REDACTED - ENCRYPTED] Suspected insurgent movement detected near border checkpoint. Multiple armed individuals observed.',
    ST_GeomFromText('POINT(13.4200 11.6700)', 4326),
    'PENDING'
FROM users u WHERE u.phone_number = '+2348000000002' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    content_text = EXCLUDED.content_text,
    priority_class = EXCLUDED.priority_class;

-- 3. Alert with [REDACTED] marker - DURESS PROTOCOL
INSERT INTO alerts (
    id, 
    user_id, 
    alert_type, 
    priority_class, 
    content_text, 
    location,
    status
) 
SELECT 
    'c3d4e5f6-3333-4444-8555-666677778888'::uuid,
    u.id,
    'ARMED_ROBBERY',
    'HIGH',
    '[REDACTED - DURESS PROTOCOL] Armed robbery in progress at market square. Multiple casualties reported. User may be under coercion.',
    ST_GeomFromText('POINT(8.5300 12.0100)', 4326),
    'PENDING'
FROM users u WHERE u.phone_number = '+2348000000001' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    content_text = EXCLUDED.content_text,
    priority_class = EXCLUDED.priority_class;

-- 4. Alert with [REDACTED] marker - TOP SECRET
INSERT INTO alerts (
    id, 
    user_id, 
    alert_type, 
    priority_class, 
    content_text, 
    location,
    status
) 
SELECT 
    'd4e5f6a7-4444-4555-8666-777788889999'::uuid,
    u.id,
    'TERRORISM',
    'CRITICAL',
    '[REDACTED - TOP SECRET] Intelligence indicates imminent threat. Asset triangulation in progress. Clearance level ALPHA required.',
    ST_GeomFromText('POINT(13.1500 11.8333)', 4326),
    'PENDING'
FROM users u WHERE u.phone_number = '+2348000000002' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    content_text = EXCLUDED.content_text,
    priority_class = EXCLUDED.priority_class;

-- 5. Normal alert (NOT redacted - for comparison)
INSERT INTO alerts (
    id, 
    user_id, 
    alert_type, 
    priority_class, 
    content_text, 
    location,
    status
) 
SELECT 
    'e5f6a7b8-5555-4666-8777-888899990000'::uuid,
    u.id,
    'SUSPICIOUS_ACTIVITY',
    'MEDIUM',
    'Suspicious individuals loitering near government building. No immediate threat detected. Local authorities notified.',
    ST_GeomFromText('POINT(3.3600 6.6100)', 4326),
    'PENDING'
FROM users u WHERE u.phone_number = '+2348000000001' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    content_text = EXCLUDED.content_text,
    priority_class = EXCLUDED.priority_class;

-- 6. Alert with [REDACTED] marker - CLASSIFIED
INSERT INTO alerts (
    id, 
    user_id, 
    alert_type, 
    priority_class, 
    content_text, 
    location,
    status
) 
SELECT 
    'f6a7b8c9-6666-4777-8888-999900001111'::uuid,
    u.id,
    'KIDNAPPING',
    'CRITICAL',
    '[REDACTED - CLASSIFIED] VIP convoy ambushed. Security detail compromised. Immediate response required. Coordinates withheld.',
    ST_GeomFromText('POINT(7.5000 9.0500)', 4326),
    'PENDING'
FROM users u WHERE u.phone_number = '+2348000000002' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    content_text = EXCLUDED.content_text,
    priority_class = EXCLUDED.priority_class;

-- 7. Alert with [REDACTED] marker - SECRET
INSERT INTO alerts (
    id, 
    user_id, 
    alert_type, 
    priority_class, 
    content_text, 
    location,
    status
) 
SELECT 
    'a7b8c9d0-7777-4888-8999-000011112222'::uuid,
    u.id,
    'TERRORISM',
    'CRITICAL',
    '[REDACTED - SECRET] Cross-border infiltration detected. Multiple hostiles engaged. Tactical units deployed.',
    ST_GeomFromText('POINT(13.2000 11.9000)', 4326),
    'PENDING'
FROM users u WHERE u.phone_number = '+2348000000001' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    content_text = EXCLUDED.content_text,
    priority_class = EXCLUDED.priority_class;
