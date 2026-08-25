-- Make box_size nullable since vrac and magasin don't have a box size
ALTER TABLE customer_prices ALTER COLUMN box_size DROP NOT NULL;
