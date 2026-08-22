ALTER TABLE recipe_items ADD COLUMN IF NOT EXISTS recipe_type text NOT NULL DEFAULT 'coque' CHECK (recipe_type IN ('coque', 'ganache'));
