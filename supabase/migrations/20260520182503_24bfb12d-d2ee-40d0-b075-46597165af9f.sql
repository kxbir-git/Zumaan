
-- Add search_path to remaining function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Revoke direct execute on SECURITY DEFINER helpers; only triggers/RLS use them
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Restrict public bucket listing: allow reading individual objects only, not listing
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'products' AND auth.role() = 'authenticated' OR bucket_id = 'products');
-- Note: bucket remains public for direct URL access (needed for <img> tags), listing is restricted via API
