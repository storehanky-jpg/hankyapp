-- Add payment_status to sales (paid / unpaid / partial)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;

-- Add purchase_group_id to material_purchases for multi-line grouping
ALTER TABLE material_purchases ADD COLUMN IF NOT EXISTS purchase_group_id text;
