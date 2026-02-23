-- =========================================
-- SQL Schema: Party Fee Payment Tracking
-- Run this in Supabase SQL Editor
-- =========================================

-- 1. Table: party_members (danh sách đảng viên)
CREATE TABLE IF NOT EXISTS party_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stt INTEGER NOT NULL,
    ho_ten TEXT NOT NULL DEFAULT '',
    chuc_vu TEXT DEFAULT '',
    ngay_vao_dang TEXT DEFAULT '',
    member_type TEXT NOT NULL DEFAULT 'bhxh',
    salary NUMERIC DEFAULT 0,
    region TEXT DEFAULT 'Vùng I',
    fee_amount NUMERIC DEFAULT 0,
    note TEXT DEFAULT '',
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table: party_payments (lịch sử thanh toán)
CREATE TABLE IF NOT EXISTS party_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES party_members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    payment_method TEXT DEFAULT 'manual',
    transaction_ref TEXT,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: saved_documents (văn bản đã soạn thảo)
CREATE TABLE IF NOT EXISTS saved_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT '',
    doc_type TEXT NOT NULL DEFAULT '',
    doc_level TEXT DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    raw_input TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_payments_member_month ON party_payments(member_id, month, year);
CREATE INDEX IF NOT EXISTS idx_members_stt ON party_members(stt);

-- 5. Enable RLS
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_documents ENABLE ROW LEVEL SECURITY;

-- 6. Policies (drop first to avoid duplicate errors)
DROP POLICY IF EXISTS "Allow all for anon" ON party_members;
CREATE POLICY "Allow all for anon" ON party_members
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON party_payments;
CREATE POLICY "Allow all for anon" ON party_payments
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON saved_documents;
CREATE POLICY "Allow all for anon" ON saved_documents
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON party_members;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON party_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_docs ON saved_documents;
CREATE TRIGGER set_updated_at_docs
    BEFORE UPDATE ON saved_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
