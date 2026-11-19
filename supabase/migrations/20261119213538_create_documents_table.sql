/*
# Création de la table documents (factures et bons)

1. Nouvelle table
- `documents` : stocke les documents générés par l'application (factures et bons).
- `id` (uuid, clé primaire, généré automatiquement)
- `doc_type` (text, non nul) : type de document, « facture » ou « bon »
- `number` (integer, non nul) : numéro du document
- `doc_date` (date, non nul) : date du document
- `customer_id` (text, nullable) : identifiant du client, si connu
- `customer_name` (text, nullable) : nom du client
- `period_from` (date, nullable) : début de période
- `period_to` (date, nullable) : fin de période
- `total` (numeric, nullable) : montant total du document
- `html` (text, nullable) : contenu HTML du document
- `created_at` (timestamptz, par défaut now())

2. Sécurité
- RLS activé sur `documents`.
- Quatre politiques identiques à celles de la table `orders`, ouvertes à
  `anon` et `authenticated` (application mono-utilisateur sans cloisonnement
  par propriétaire, comme `orders`) :
  - anon_select_documents (SELECT, USING true)
  - anon_insert_documents (INSERT, WITH CHECK true)
  - anon_update_documents (UPDATE, USING true / WITH CHECK true)
  - anon_delete_documents (DELETE, USING true)
- GRANT SELECT, INSERT, UPDATE, DELETE à anon et authenticated pour l'accès
  via l'API de données.

3. Notes
- Migration idempotente : la table n'est créée que si elle n'existe pas,
  et les politiques sont recréées sans erreur si elles existent déjà.
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type text NOT NULL,
  number integer NOT NULL,
  doc_date date NOT NULL,
  customer_id text,
  customer_name text,
  period_from date,
  period_to date,
  total numeric,
  html text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_documents" ON documents;
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE
TO anon, authenticated USING (true);
