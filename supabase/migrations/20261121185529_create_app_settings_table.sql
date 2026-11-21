/*
# Création de la table app_settings (réglages de l'application)

1. Nouvelle table
- `app_settings` : stocke les réglages de l'application sous forme de paires clé/valeur.
- `key` (text, clé primaire) : nom du réglage
- `value` (jsonb, nullable) : valeur du réglage (n'importe quel contenu JSON)
- `updated_at` (timestamptz, par défaut now()) : date de dernière modification

2. Sécurité
- RLS activé sur `app_settings`.
- Trois politiques pour les utilisateurs connectés uniquement (`authenticated`),
  sans suppression, conformément à la demande :
  - authenticated_select_app_settings (SELECT, USING true)
  - authenticated_insert_app_settings (INSERT, WITH CHECK true)
  - authenticated_update_app_settings (UPDATE, USING true / WITH CHECK true)
- GRANT SELECT, INSERT, UPDATE à `authenticated` pour l'accès via l'API de données.
  Aucun droit pour `anon` (les visiteurs non connectés ne peuvent ni lire ni écrire).

3. Notes
- Migration idempotente : la table n'est créée que si elle n'existe pas,
  et les politiques sont recréées sans erreur si elles existent déjà.
- Aucune politique de suppression : les réglages ne peuvent pas être effacés
  depuis l'application.
*/

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON app_settings TO authenticated;

DROP POLICY IF EXISTS "authenticated_select_app_settings" ON app_settings;
CREATE POLICY "authenticated_select_app_settings" ON app_settings FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_app_settings" ON app_settings;
CREATE POLICY "authenticated_insert_app_settings" ON app_settings FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_app_settings" ON app_settings;
CREATE POLICY "authenticated_update_app_settings" ON app_settings FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);
