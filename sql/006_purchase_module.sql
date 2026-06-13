-- ERP-Nexus Database Schema — Purchase Module Extensions
-- Component 6: Database tables aligned with Prisma ORM models.
-- (Triggers and business logic moved to Node.js application layer).

-- 1. Add reorder_level column to the existing products table (if not already present)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS reorder_level DECIMAL(12, 3) DEFAULT 0.000 NOT NULL CHECK (reorder_level >= 0);

-- 2. Goods Receipts Table
CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delivery_note_ref VARCHAR(100),
    received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Goods Receipt Lines Table
CREATE TABLE goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    qty_received DECIMAL(12, 3) NOT NULL CHECK (qty_received > 0),
    remarks TEXT
);

-- 4. Vendor Bills Table
CREATE TABLE vendor_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(12, 2) DEFAULT 0.00 NOT NULL CHECK (tax >= 0),
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) DEFAULT 'pending_payment' NOT NULL CHECK (
        status IN ('pending_payment', 'approved_for_payment', 'paid', 'void')
    ),
    attachment_url TEXT,
    paid_at TIMESTAMPTZ,
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Procurement Suggestions Table
CREATE TABLE procurement_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    suggested_qty DECIMAL(12, 3) NOT NULL CHECK (suggested_qty > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CHECK (
        status IN ('pending', 'po_created', 'ignored')
    ),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- OPTIMIZATION INDEXES
-- =========================================================================

-- Goods Receipt indexes
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po ON goods_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_lines_receipt ON goods_receipt_lines(receipt_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_lines_product ON goods_receipt_lines(product_id);

-- Vendor Bills indexes
CREATE INDEX IF NOT EXISTS idx_vendor_bills_po ON vendor_bills(po_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor ON vendor_bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_status ON vendor_bills(status);

-- Procurement Suggestions indexes
CREATE INDEX IF NOT EXISTS idx_procurement_suggestions_product ON procurement_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_procurement_suggestions_status ON procurement_suggestions(status);
