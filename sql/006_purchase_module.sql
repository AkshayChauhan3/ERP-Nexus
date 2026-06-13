-- ERP-Nexus Database Schema — Purchase Module
-- Component 6: Vendors, Materials, Purchase Orders, Receipts, Invoices, and Inventory

-- 1. Vendors Table
CREATE TABLE vendors (
    vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Raw Materials / Purchase Items Catalog
CREATE TABLE raw_materials (
    material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(20) NOT NULL,
    unit_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (unit_price >= 0),
    reorder_level NUMERIC(12, 3) DEFAULT 0.000 NOT NULL CHECK (reorder_level >= 0),
    current_stock NUMERIC(12, 3) DEFAULT 0.000 NOT NULL CHECK (current_stock >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Purchase Orders Table
CREATE TABLE purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'DRAFT' NOT NULL CHECK (
        status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED')
    ),
    total_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (total_amount >= 0),
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    expected_delivery DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Purchase Order Line Items
CREATE TABLE purchase_order_items (
    po_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES raw_materials(material_id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(12, 3) NOT NULL CHECK (quantity_ordered > 0),
    quantity_received NUMERIC(12, 3) DEFAULT 0.000 NOT NULL CHECK (quantity_received >= 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    CONSTRAINT check_received_qty CHECK (quantity_received <= quantity_ordered),
    UNIQUE (po_id, material_id)
);

-- 5. Goods Receipts (GRN) Table
CREATE TABLE goods_receipts (
    receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    po_id UUID NOT NULL REFERENCES purchase_orders(po_id) ON DELETE RESTRICT,
    received_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delivery_note_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Goods Receipt Line Items
CREATE TABLE goods_receipt_items (
    receipt_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES goods_receipts(receipt_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES raw_materials(material_id) ON DELETE RESTRICT,
    quantity_received NUMERIC(12, 3) NOT NULL CHECK (quantity_received > 0),
    remarks TEXT
);

-- 7. Vendor Bills (Invoices) Table
CREATE TABLE vendor_bills (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    po_id UUID NOT NULL REFERENCES purchase_orders(po_id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (tax >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) DEFAULT 'PENDING_PAYMENT' NOT NULL CHECK (
        status IN ('PENDING_PAYMENT', 'APPROVED_FOR_PAYMENT', 'PAID', 'VOID')
    ),
    attachment_url TEXT,
    paid_at TIMESTAMPTZ,
    paid_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    payment_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Stock Ledger Table
CREATE TABLE stock_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES raw_materials(material_id) ON DELETE RESTRICT,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('RECEIPT', 'ISSUE', 'ADJUSTMENT')),
    reference_id UUID NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    balance_stock NUMERIC(12, 3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL
);

-- 9. Procurement Suggestions Table
CREATE TABLE procurement_suggestions (
    suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES raw_materials(material_id) ON DELETE CASCADE,
    suggested_qty NUMERIC(12, 3) NOT NULL CHECK (suggested_qty > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'PO_CREATED', 'IGNORED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- =========================================================================
-- TRIGGERS & AUTOMATION FUNCTIONS
-- =========================================================================

-- A. Auto-update timestamps triggers
CREATE TRIGGER trigger_update_vendors_timestamp
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_materials_timestamp
    BEFORE UPDATE ON raw_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_pos_timestamp
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_bills_timestamp
    BEFORE UPDATE ON vendor_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_suggestions_timestamp
    BEFORE UPDATE ON procurement_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();


-- B. Goods Receipt Trigger Function
-- Automatically updates: stock level, stock ledger, PO item received quantity, PO header status.
CREATE OR REPLACE FUNCTION process_goods_receipt()
RETURNS TRIGGER AS $$
DECLARE
    v_po_id UUID;
    v_received_by UUID;
    v_new_stock NUMERIC(12, 3);
    v_total_items INT;
    v_fully_received_items INT;
    v_any_received INT;
BEGIN
    -- 1. Get PO reference and recipient user ID from parent goods_receipts header
    SELECT po_id, received_by INTO v_po_id, v_received_by
    FROM goods_receipts
    WHERE receipt_id = NEW.receipt_id;

    -- 2. Increment stock in raw_materials
    UPDATE raw_materials
    SET current_stock = current_stock + NEW.quantity_received
    WHERE material_id = NEW.material_id;

    -- Get new running stock level
    SELECT current_stock INTO v_new_stock
    FROM raw_materials
    WHERE material_id = NEW.material_id;

    -- 3. Log transaction in stock_ledger
    INSERT INTO stock_ledger (material_id, transaction_type, reference_id, quantity, balance_stock, created_by)
    VALUES (NEW.material_id, 'RECEIPT', NEW.receipt_id, NEW.quantity_received, v_new_stock, v_received_by);

    -- 4. Update the PO item quantity_received
    UPDATE purchase_order_items
    SET quantity_received = quantity_received + NEW.quantity_received
    WHERE po_id = v_po_id AND material_id = NEW.material_id;

    -- 5. Calculate PO receipt progress
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE quantity_received >= quantity_ordered),
        COUNT(*) FILTER (WHERE quantity_received > 0)
    INTO v_total_items, v_fully_received_items, v_any_received
    FROM purchase_order_items
    WHERE po_id = v_po_id;

    -- 6. Dynamically update PO header status based on progress
    IF v_fully_received_items = v_total_items THEN
        UPDATE purchase_orders SET status = 'FULLY_RECEIVED' WHERE po_id = v_po_id;
    ELSIF v_any_received > 0 THEN
        UPDATE purchase_orders SET status = 'PARTIALLY_RECEIVED' WHERE po_id = v_po_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_goods_receipt
    AFTER INSERT ON goods_receipt_items
    FOR EACH ROW
    EXECUTE FUNCTION process_goods_receipt();


-- C. Low Stock Alert Trigger Function
-- Automatically creates procurement suggestions when current stock drops below reorder level.
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_pending_exists BOOLEAN;
BEGIN
    -- Check if we are inserting or updating the stock level
    IF (TG_OP = 'INSERT' AND NEW.current_stock < NEW.reorder_level) OR 
       (TG_OP = 'UPDATE' AND NEW.current_stock < NEW.reorder_level AND NEW.current_stock IS DISTINCT FROM OLD.current_stock) THEN
        
        -- Check if there is already a pending suggestion for this material
        SELECT EXISTS (
            SELECT 1 FROM procurement_suggestions
            WHERE material_id = NEW.material_id AND status = 'PENDING'
        ) INTO v_pending_exists;

        -- Create suggestion if none exists
        IF NOT v_pending_exists THEN
            INSERT INTO procurement_suggestions (material_id, suggested_qty, reason, status)
            VALUES (
                NEW.material_id,
                (NEW.reorder_level - NEW.current_stock),
                'Current stock (' || NEW.current_stock || ' ' || NEW.unit_of_measure || ') fell below reorder level (' || NEW.reorder_level || ' ' || NEW.unit_of_measure || ').',
                'PENDING'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_low_stock
    AFTER INSERT OR UPDATE ON raw_materials
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();


-- =========================================================================
-- OPTIMIZATION INDEXES
-- =========================================================================

-- Purchase Orders and Items indexes
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_po_items_material ON purchase_order_items(material_id);

-- Goods Receipt indexes
CREATE INDEX idx_goods_receipts_po ON goods_receipts(po_id);
CREATE INDEX idx_receipt_items_receipt ON goods_receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_material ON goods_receipt_items(material_id);

-- Vendor Bills indexes
CREATE INDEX idx_vendor_bills_po ON vendor_bills(po_id);
CREATE INDEX idx_vendor_bills_vendor ON vendor_bills(vendor_id);
CREATE INDEX idx_vendor_bills_status ON vendor_bills(status);

-- Stock Ledger indexes
CREATE INDEX idx_stock_ledger_material ON stock_ledger(material_id);
CREATE INDEX idx_stock_ledger_created_at ON stock_ledger(created_at DESC);

-- Procurement Suggestions indexes
CREATE INDEX idx_procurement_suggestions_material ON procurement_suggestions(material_id);
CREATE INDEX idx_procurement_suggestions_status ON procurement_suggestions(status);
