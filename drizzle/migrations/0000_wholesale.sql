ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wholesale';

CREATE TABLE public.wholesale_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  owner_name text NOT NULL,
  national_id text,
  phone text NOT NULL,
  province text NOT NULL,
  city text NOT NULL,
  address text NOT NULL DEFAULT '',
  social_link text,
  description text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wholesale_applications TO authenticated;
GRANT ALL ON public.wholesale_applications TO service_role;
ALTER TABLE public.wholesale_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY wa_select ON public.wholesale_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY wa_insert ON public.wholesale_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND admin_note IS NULL);
CREATE POLICY wa_update_own_rejected ON public.wholesale_applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'rejected')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY wa_update_admin ON public.wholesale_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER wholesale_applications_updated_at BEFORE UPDATE ON public.wholesale_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_wholesale (
  product_id text PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  pack_price integer NOT NULL,
  pack_size integer NOT NULL DEFAULT 6,
  min_packs integer NOT NULL DEFAULT 1,
  pack_description text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_wholesale TO authenticated;
GRANT ALL ON public.product_wholesale TO service_role;
ALTER TABLE public.product_wholesale ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_wholesale_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('wholesale','admin'))
$$;

CREATE POLICY pw_read ON public.product_wholesale FOR SELECT TO authenticated
  USING (public.is_wholesale_or_admin(auth.uid()));
CREATE POLICY pw_admin ON public.product_wholesale FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_wholesale boolean NOT NULL DEFAULT false;