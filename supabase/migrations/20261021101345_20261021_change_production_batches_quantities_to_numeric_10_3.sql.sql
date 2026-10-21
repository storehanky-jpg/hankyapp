ALTER TABLE production_batches
  ALTER COLUMN planned_quantity TYPE numeric(10, 3),
  ALTER COLUMN produced_quantity TYPE numeric(10, 3),
  ALTER COLUMN lost_quantity TYPE numeric(10, 3),
  ALTER COLUMN lost_quantity SET DEFAULT 0;