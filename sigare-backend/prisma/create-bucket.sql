INSERT INTO storage.buckets (id, name, public)
VALUES ('sigare', 'sigare', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'sigare');

CREATE POLICY "Upload autenticado" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sigare');
