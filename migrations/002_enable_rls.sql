-- Enable RLS on contact_management tables
ALTER TABLE contact_management.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_management.notes ENABLE ROW LEVEL SECURITY;

-- Example policy: allow authenticated users to manage their own contacts
CREATE POLICY contact_ownership ON contact_management.contacts
  FOR ALL TO PUBLIC
  USING (owner_id = app.current_user_id::bigint);

-- Example policy: allow authenticated users to manage their own notes
CREATE POLICY note_ownership ON contact_management.notes
  FOR ALL TO PUBLIC
  USING (owner_id = app.current_user_id::bigint);
