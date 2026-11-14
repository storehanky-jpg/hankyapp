/*
# Ajout de la colonne advance_paid à la table labor_costs

1. Table modifiée
- `labor_costs` (coûts de main-d'œuvre) : ajout d'une colonne `advance_paid`
  de type numeric, NON NULLE, avec la valeur par défaut 0.
  Elle permettra d'enregistrer l'avance déjà payée à l'employé.
  Les lignes existantes recevront automatiquement la valeur 0 :
  aucune donnée existante n'est modifiée autrement.

2. Sécurité
- Aucun changement : RLS et les politiques existantes de la table restent inchangées,
  et la nouvelle colonne est couverte par les privilèges déjà accordés au niveau table.

3. Notes
- Migration idempotente : si la colonne existe déjà, rien ne se passe.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'labor_costs'
      AND column_name = 'advance_paid'
  ) THEN
    ALTER TABLE labor_costs ADD COLUMN advance_paid numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
