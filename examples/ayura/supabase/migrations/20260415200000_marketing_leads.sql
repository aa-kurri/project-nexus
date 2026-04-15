-- ─── S-SAAS-1: Marketing Leads ───────────────────────────────────────────────
-- Stores inbound demo requests captured on the public landing page.
-- tenant_id is a soft reference to the provisioned tenant once the lead
-- converts; pre-conversion rows use a well-known sentinel UUID so RLS can
-- still satisfy the NOT NULL constraint via the service-role insert.

CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  hospital_name text        NOT NULL,
  contact_name  text        NOT NULL,
  email         text        NOT NULL,
  phone         text,
  bed_count     text,
  message       text,
  source        text        NOT NULL DEFAULT 'landing_page',
  -- lifecycle
  status        text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'converted', 'lost')),
  converted_at  timestamptz,
  -- audit
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS marketing_leads_tenant_id_idx ON public.marketing_leads (tenant_id);
CREATE INDEX IF NOT EXISTS marketing_leads_email_idx      ON public.marketing_leads (email);
CREATE INDEX IF NOT EXISTS marketing_leads_status_idx     ON public.marketing_leads (status);

-- ── Updated-at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- Internal staff (authenticated, same tenant) can read their own leads.
CREATE POLICY "tenant_select_leads"
  ON public.marketing_leads
  FOR SELECT
  USING (tenant_id = public.jwt_tenant());

-- Internal staff can update lead status / notes.
CREATE POLICY "tenant_update_leads"
  ON public.marketing_leads
  FOR UPDATE
  USING (tenant_id = public.jwt_tenant())
  WITH CHECK (tenant_id = public.jwt_tenant());

-- Public (anon) inserts are intentionally handled via service-role in the
-- server action; no anon INSERT policy is granted here.
