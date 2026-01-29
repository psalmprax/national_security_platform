-- Migration: Add auth and status fields to users
-- Statuses: 'ACTIVE', 'PENDING', 'REJECTED'

ALTER TABLE users ADD COLUMN IF NOT EXISTS status STRING NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash STRING;

-- Update existing users to have a default password hash (bcrypt: "password")
UPDATE users SET password_hash = '$2a$10$LFMT3Xz5w7EdAe1/MmNhpuNCbET5kb58aIx27jfXIpss8XS9DKmqW' WHERE password_hash IS NULL OR password_hash = '$2a$10$8K1p/a0dL1qX8v8h.G.uG.O1f9hS9D.XJ/0rK/u3O3/X1b.L.L.L.';
