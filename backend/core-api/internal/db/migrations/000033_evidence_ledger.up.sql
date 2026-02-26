-- Phase 28: Immutable Evidence Ledger (Simulated Blockchain)

CREATE TABLE IF NOT EXISTS evidence_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL DEFAULT 'GENESIS',
    recorded_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_ledger_entity ON evidence_ledger (entity_type, entity_id);
CREATE INDEX idx_evidence_ledger_hash ON evidence_ledger (content_hash);

COMMENT ON TABLE evidence_ledger IS 'Append-only chain-linked evidence hashes for tamper-proof audit trail';
