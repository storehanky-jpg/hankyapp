ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS bon_livraison_number text,
  ADD COLUMN IF NOT EXISTS facture_number text;
