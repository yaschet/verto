-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
-- Copyright (c) 2026 Yassine Chettouch

CREATE SCHEMA IF NOT EXISTS extensions;
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_timestamps() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.created_at IS NULL THEN
            NEW.created_at = timezone('utc', now());
        END IF;
        NEW.updated_at = timezone('utc', now());
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at = timezone('utc', now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_storage_object_metadata(p_bucket_id text, p_name text) RETURNS jsonb
    LANGUAGE sql SECURITY INVOKER SET search_path = public, storage, pg_temp AS $$
  SELECT metadata FROM storage.objects WHERE bucket_id = p_bucket_id AND name = p_name LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_storage_object_metadata(text, text) TO authenticated, service_role;

CREATE TYPE public.app_role AS ENUM ('ADMIN', 'USER');

CREATE TYPE public.profile_status AS ENUM ('ONLINE', 'OFFLINE', 'SUSPENDED');

CREATE TYPE public.account_status AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TYPE public.translation_status AS ENUM (
    'draft',
    'pending_payment',
    'paid',
    'in_progress',
    'review',
    'completed',
    'cancelled',
    'refunded',
    'queued',
    'processing',
    'translating',
    'polishing',
    'ready',
    'generating',
    'retrying',
    'failed'
);

CREATE TYPE public.notification_type AS ENUM (
    'translation_complete',
    'translation_failed',
    'translation_review',
    'credit_low',
    'credit_added',
    'payment_success',
    'payment_failed',
    'product_update',
    'system_alert'
);

CREATE TYPE public.subscription_status AS ENUM ('subscribed', 'unsubscribed');
CREATE TYPE public.subscription_source AS ENUM (
    'coming_soon',
    'website_footer',
    'blog_post',
    'social_media',
    'paid_ads',
    'landing_page',
    'referral',
    'webinar',
    'event',
    'email_campaign',
    'direct'
);

CREATE TYPE public.user_activity_type AS ENUM (
    'sign_in',
    'sign_out',
    'heartbeat',
    'enabled_mfa',
    'disabled_mfa',
    'changed_email',
    'changed_password',
    'closed_account',
    'updated_profile',
    'created_customer',
    'updated_customer',
    'deleted_customer',
    'created_translation',
    'deleted_translation',
    'assigned_customer_to_translation',
    'initiated_checkout',
    'completed_checkout',
    'failed_checkout',
    'opened_billing_portal',
    'customer_deleted',
    'accessed_signed_url'
);

CREATE TYPE public.content_type AS ENUM ('text', 'table');

CREATE TYPE public.template_status AS ENUM ('draft', 'active', 'inactive', 'deleted', 'archived', 'locked', 'updated', 'outdated', 'upcoming');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email TEXT NOT NULL CHECK (email <> '') DEFAULT 'sample@example.com',
    avatar_url TEXT,
    date_of_birth DATE,
    status public.profile_status NOT NULL DEFAULT 'OFFLINE',
    account_status public.account_status NOT NULL DEFAULT 'ACTIVE',

    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    company_name TEXT,

    specializations JSONB DEFAULT '[]'::jsonb,
    qualifications JSONB DEFAULT '[]'::jsonb,
    professional_affiliations JSONB DEFAULT '[]'::jsonb,
    translation_experience TEXT DEFAULT 'Beginner',
    source_language VARCHAR(4) NOT NULL DEFAULT 'auto',
    target_language VARCHAR(4) NOT NULL DEFAULT 'fr',
    is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,

    stripe_customer_id TEXT,

    doc_branding_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    doc_logo_url TEXT,
    doc_company_name TEXT,
    doc_header_text TEXT,
    doc_footer_text TEXT DEFAULT 'Certified Translation',
    doc_show_page_numbers BOOLEAN NOT NULL DEFAULT TRUE,
    doc_show_certification_stamp BOOLEAN NOT NULL DEFAULT FALSE,
    doc_certification_number TEXT,
    doc_watermark_text TEXT,
    doc_watermark_preset TEXT NOT NULL DEFAULT 'light',
    doc_certification_stamp_url TEXT,
    doc_certification_stamp_placement TEXT NOT NULL DEFAULT 'page_bottom_right_margin',
    doc_certification_stamp_size TEXT NOT NULL DEFAULT 'md',

    notification_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notification_translation_complete BOOLEAN NOT NULL DEFAULT TRUE,
    notification_translation_failed BOOLEAN NOT NULL DEFAULT TRUE,
    notification_translation_review BOOLEAN NOT NULL DEFAULT TRUE,
    notification_credit_low BOOLEAN NOT NULL DEFAULT TRUE,
    notification_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    notification_product_updates BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_timestamps_on_profiles
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX idx_profiles_full_name ON public.profiles(full_name);

CREATE TABLE public.newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    status public.subscription_status NOT NULL DEFAULT 'subscribed',
    source public.subscription_source DEFAULT 'coming_soon',
    subscription_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.templates_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE CHECK (name <> ''),
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    cover_image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.templates_collections(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    label TEXT,
    slug TEXT NOT NULL UNIQUE,
    content_type public.content_type[] DEFAULT '{text}'::public.content_type[], 
    preview_image_url TEXT,
    file_url TEXT, 
    category TEXT,
    tags TEXT[],
    content_details JSONB DEFAULT '{}'::jsonb,
    is_premium BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    status public.template_status DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_timestamps_on_templates
    BEFORE INSERT OR UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
    display_name TEXT NOT NULL, 
    email TEXT,
    phone TEXT,
    company_name TEXT,
    notes TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    is_vip BOOLEAN DEFAULT FALSE,
    total_translations INTEGER DEFAULT 0,
    last_translation_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_timestamps_on_customers
    BEFORE INSERT OR UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX idx_customers_profile_id ON public.customers(profile_id);

CREATE TABLE public.translations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE DEFAULT auth.uid(),
    customer_id     UUID REFERENCES customers (id) ON DELETE SET NULL,
    template_id     UUID NOT NULL REFERENCES templates (id) ON DELETE SET NULL,
    display_name    TEXT NOT NULL,
    description     TEXT,
    source_language TEXT NOT NULL DEFAULT 'auto',
    target_language TEXT NOT NULL DEFAULT 'en',
    file_url        TEXT NOT NULL,
    status          public.translation_status NOT NULL DEFAULT 'draft',
    progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at      TIMESTAMPTZ DEFAULT NULL,
    completed_at    TIMESTAMPTZ DEFAULT NULL,
    details         JSONB DEFAULT '{}'::jsonb,
    export_status   JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TRIGGER set_timestamps_on_translations
    BEFORE INSERT OR UPDATE ON public.translations
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX idx_translations_profile_progress ON public.translations(progress);
CREATE INDEX idx_translations_status ON public.translations(status);
CREATE INDEX idx_translations_export_status ON public.translations USING GIN (export_status);

CREATE TABLE public.translation_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    translation_id UUID NOT NULL REFERENCES public.translations(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('docx', 'pdf', 'html')),
    storage_provider TEXT NOT NULL CHECK (storage_provider IN ('supabase', 'drive')),
    storage_path TEXT NOT NULL,
    file_id TEXT, -- Google Drive ID
    file_size_bytes BIGINT,
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(translation_id, format)
);

CREATE TRIGGER set_timestamps_on_exports
    BEFORE UPDATE ON public.translation_exports
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE TABLE public.credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    lifetime_purchased INTEGER NOT NULL DEFAULT 0,
    lifetime_used INTEGER NOT NULL DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    last_usage_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_timestamps_on_credits
    BEFORE INSERT OR UPDATE ON public.credits
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE TABLE public.credits_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    translation_id UUID REFERENCES public.translations(id) ON DELETE SET NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    type VARCHAR(50) NOT NULL, 
    description TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce duplicate delivery checks at the database boundary.
CREATE UNIQUE INDEX credits_transactions_purchase_session_unique
ON public.credits_transactions ((details ->> 'session_id'))
WHERE type = 'purchase' AND details ->> 'session_id' IS NOT NULL;
CREATE UNIQUE INDEX credits_transactions_refund_translation_unique
ON public.credits_transactions (translation_id)
WHERE type = 'refund' AND translation_id IS NOT NULL;

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, 
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER set_timestamps_on_notifications
    BEFORE INSERT OR UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE TABLE public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.user_activity_type NOT NULL DEFAULT 'heartbeat',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX idx_user_activity_profile_id ON public.user_activity(profile_id);
CREATE INDEX idx_user_activity_type ON public.user_activity(type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at);

CREATE TABLE public.active_users (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_active TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE public.user_roles (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.translations;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE
  user_role public.app_role;
BEGIN

  IF (auth.jwt() ->> 'user_role')::public.app_role = 'ADMIN'::public.app_role THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'ADMIN'::public.app_role
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth, extensions, pg_temp;

CREATE OR REPLACE FUNCTION verify_user_password(current_plain_password varchar) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions, pg_temp AS $$
DECLARE
    user_id uuid := auth.uid();
BEGIN
    IF exists(select 1 from auth.users where id = user_id and encrypted_password = crypt(current_plain_password::text, auth.users.encrypted_password)) THEN
        RETURN json_build_object('success', TRUE, 'status', 200);
    ELSE
        RETURN json_build_object('error', TRUE, 'message', 'Incorrect password', 'status', 401);
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION check_user_has_password(user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions, pg_temp AS $$
DECLARE
    has_password boolean;
BEGIN
    IF (auth.jwt() ->> 'role') IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Password status is unavailable for this account.';
    END IF;
    SELECT CASE WHEN encrypted_password IS NULL OR encrypted_password = '' THEN FALSE ELSE TRUE END INTO has_password
    FROM auth.users WHERE id = user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', TRUE, 'code', 'USER_NOT_FOUND', 'status', 404);
    END IF;

    IF has_password THEN
        RETURN json_build_object('success', TRUE, 'code', 'HAS_PASSWORD', 'status', 200);
    ELSE
        RETURN json_build_object('error', FALSE, 'code', 'NO_PASSWORD', 'status', 200);
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION create_credits_on_profile_insert() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.credits (profile_id, amount) VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_credits() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type IN ('purchase', 'bonus', 'refund') THEN
        UPDATE public.credits SET amount = amount + NEW.credits WHERE profile_id = NEW.profile_id;
    ELSIF NEW.type IN ('penalty', 'consumption') THEN
        UPDATE public.credits SET amount = amount - NEW.credits WHERE profile_id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_credits_transaction() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.type IN ('purchase', 'bonus', 'refund') THEN
        UPDATE public.credits SET amount = amount - OLD.credits WHERE profile_id = OLD.profile_id;
    ELSIF OLD.type IN ('penalty', 'consumption') THEN
        UPDATE public.credits SET amount = amount + OLD.credits WHERE profile_id = OLD.profile_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_credits_for_translation(
  p_user_id UUID,
  p_translation_id UUID,
  p_credits_required INTEGER,
  p_document_name TEXT,
  p_page_count INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  IF (auth.jwt() ->> 'role') IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only deduct your own credits.';
  END IF;

  IF p_credits_required IS NULL OR p_page_count IS NULL OR p_credits_required <= 0 OR p_page_count <= 0 THEN
    RAISE EXCEPTION 'Credit and page counts must be positive.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.translations WHERE id = p_translation_id AND profile_id = p_user_id) THEN
    RAISE EXCEPTION 'Translation is unavailable for this account.';
  END IF;

  SELECT amount INTO v_current_balance FROM public.credits WHERE profile_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Credits record not found'; END IF;
  IF v_current_balance < p_credits_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  INSERT INTO public.credits_transactions (
    profile_id, translation_id, credits, type, description, details
  ) VALUES (
    p_user_id, p_translation_id, p_credits_required, 'consumption', 
    'Translation: ' || p_document_name, jsonb_build_object('page_count', p_page_count)
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object('success', true, 'new_balance', v_current_balance - p_credits_required, 'transaction_id', v_transaction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions, pg_temp;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions, pg_temp AS $$
DECLARE
    first_name_part text;
    last_name_part  text;
    is_complete     boolean;
BEGIN
    first_name_part := COALESCE(NEW.raw_user_meta_data ->> 'first_name', regexp_replace(NEW.raw_user_meta_data ->> 'full_name', '(.+)\s\S+$', '\1'));
    last_name_part := COALESCE(NEW.raw_user_meta_data ->> 'last_name', regexp_replace(NEW.raw_user_meta_data ->> 'full_name', '.+\s', ''));
    
    is_complete := first_name_part IS NOT NULL AND last_name_part IS NOT NULL AND NEW.email IS NOT NULL;

    INSERT INTO public.profiles (
        id, first_name, last_name, email, avatar_url, date_of_birth, phone,
        address, city, state, zip_code, country, company_name,
        specializations, qualifications, professional_affiliations,
        translation_experience, source_language, target_language, is_profile_complete
    ) VALUES (
        NEW.id, first_name_part, last_name_part, COALESCE(NEW.email, 'sample@example.com'), 
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'date_of_birth', NULL)::date,
        COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'address', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'city', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'state', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'zip_code', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'country', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'company_name', NULL),
        COALESCE((NEW.raw_user_meta_data ->> 'specializations')::jsonb, '[]'::jsonb),
        COALESCE((NEW.raw_user_meta_data ->> 'qualifications')::jsonb, '[]'::jsonb),
        COALESCE((NEW.raw_user_meta_data ->> 'professional_affiliations')::jsonb, '[]'::jsonb),
        COALESCE(NEW.raw_user_meta_data ->> 'translation_experience', 'Beginner'),
        COALESCE(NEW.raw_user_meta_data ->> 'source_language', 'auto')::varchar(4),
        COALESCE(NEW.raw_user_meta_data ->> 'target_language', 'fr')::varchar(4),
        is_complete
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_user_update() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions, pg_temp AS $$
BEGIN
    UPDATE profiles
    SET first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', regexp_replace(NEW.raw_user_meta_data ->> 'full_name', '(.+)\s\S+$', '\1'), first_name),
        last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', regexp_replace(NEW.raw_user_meta_data ->> 'full_name', '.+\s', ''), last_name),
        phone = COALESCE(NEW.raw_user_meta_data ->> 'phone', phone)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_user_role_on_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'USER')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.manage_active_users_public() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.profile_id IS NULL THEN RETURN NEW; END IF;
    IF NEW.type IN ('heartbeat', 'sign_in') THEN
        INSERT INTO public.active_users (profile_id, last_active, created_at)
        VALUES (NEW.profile_id, NEW.created_at, timezone('utc', now()))
        ON CONFLICT (profile_id) DO UPDATE SET last_active = EXCLUDED.last_active;
        UPDATE public.profiles SET status = 'ONLINE' WHERE id = NEW.profile_id;
    ELSIF NEW.type = 'sign_out' THEN
        DELETE FROM public.active_users WHERE profile_id = NEW.profile_id;
        UPDATE public.profiles SET status = 'OFFLINE' WHERE id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.cleanup_inactive_users() RETURNS VOID AS $$
BEGIN
    WITH deleted AS (
        DELETE FROM public.active_users
        WHERE last_active < timezone('utc', now()) - INTERVAL '5 minutes'
        RETURNING profile_id
    )
    UPDATE public.profiles SET status = 'OFFLINE' WHERE id IN (SELECT profile_id FROM deleted);
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('cleanup_inactive_users', '*/1 * * * *', 'SELECT public.cleanup_inactive_users()');

CREATE OR REPLACE FUNCTION public.log_user_activity_action(
    action_type public.user_activity_type,
    profile_id UUID,
    details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_activity (profile_id, type, details, created_at)
    VALUES (profile_id, action_type, COALESCE(details, '{}'), timezone('utc', now()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_temp;

CREATE OR REPLACE FUNCTION public.log_user_activity_trigger_auth() RETURNS TRIGGER AS $$
DECLARE
    event_type public.user_activity_type;
    user_id UUID;
    payload JSONB := row_to_json(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END)::jsonb;
BEGIN
    event_type := TG_ARGV[0]::public.user_activity_type;

    user_id := COALESCE((payload->>'user_id')::UUID, (payload->>'id')::UUID);
    
    IF user_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        PERFORM public.log_user_activity_action(event_type, user_id, jsonb_build_object('operation', TG_OP));
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.log_user_activity_trigger_public() RETURNS TRIGGER AS $$
DECLARE
    event_type public.user_activity_type;
    payload JSONB := row_to_json(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END)::jsonb;
    pid UUID := COALESCE(CASE WHEN TG_OP = 'DELETE' THEN OLD.profile_id ELSE NEW.profile_id END, NULL)::UUID;
BEGIN
    event_type := TG_ARGV[0]::public.user_activity_type;
    IF pid IS NOT NULL THEN PERFORM public.log_user_activity_action(event_type, pid, jsonb_build_object('operation', TG_OP, 'entity_id', payload->>'id')); END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB) RETURNS JSONB
    LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth, extensions, pg_temp AS $$
DECLARE
    claims JSONB;
    user_role public.app_role;
BEGIN
    SELECT role INTO user_role FROM public.user_roles WHERE user_id = (event ->> 'user_id')::UUID;
    claims := event -> 'claims';
    IF user_role IS NOT NULL THEN claims := JSONB_SET(claims, '{user_role}', TO_JSONB(user_role));
    ELSE claims := JSONB_SET(claims, '{user_role}', 'null'); END IF;
    event := JSONB_SET(event, '{claims}', claims);
    RETURN event;
END;
$$;

CREATE TRIGGER trigger_create_credits_on_profile_insert AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION create_credits_on_profile_insert();
CREATE TRIGGER trigger_sync_credits AFTER INSERT ON public.credits_transactions FOR EACH ROW EXECUTE FUNCTION sync_credits();
CREATE TRIGGER trigger_delete_credits_transaction BEFORE DELETE ON public.credits_transactions FOR EACH ROW EXECUTE FUNCTION delete_credits_transaction();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
CREATE TRIGGER on_auth_user_updated AFTER UPDATE OF raw_user_meta_data ON auth.users FOR EACH ROW EXECUTE PROCEDURE handle_user_update();
CREATE TRIGGER create_user_role_on_new_user AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION create_user_role_on_new_user();
CREATE TRIGGER trg_manage_active_users_public AFTER INSERT ON public.user_activity FOR EACH ROW WHEN (NEW.profile_id IS NOT NULL) EXECUTE FUNCTION public.manage_active_users_public();

CREATE TRIGGER trigger_log_sign_in AFTER INSERT ON auth.sessions FOR EACH ROW EXECUTE FUNCTION public.log_user_activity_trigger_auth('sign_in');
CREATE TRIGGER trigger_log_sign_out AFTER DELETE ON auth.sessions FOR EACH ROW EXECUTE FUNCTION public.log_user_activity_trigger_auth('sign_out');
CREATE TRIGGER trigger_log_email_change AFTER UPDATE ON auth.users FOR EACH ROW WHEN (OLD.email <> NEW.email) EXECUTE FUNCTION public.log_user_activity_trigger_auth('changed_email');

CREATE TRIGGER trigger_log_customer_creation AFTER INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.log_user_activity_trigger_public('created_customer');
CREATE TRIGGER trigger_log_translation_creation AFTER INSERT ON public.translations FOR EACH ROW EXECUTE FUNCTION public.log_user_activity_trigger_public('created_translation');

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION custom_access_token_hook FROM authenticated, anon, public;
GRANT ALL ON TABLE user_roles TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_roles TO authenticated; 
GRANT SELECT ON TABLE user_roles TO service_role;

CREATE POLICY "Admin Full Access Profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Templates" ON public.templates FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Collections" ON public.templates_collections FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Credits" ON public.credits FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Transactions" ON public.credits_transactions FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Customers" ON public.customers FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Translations" ON public.translations FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Exports" ON public.translation_exports FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Notifications" ON public.notifications FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Newsletter" ON public.newsletter_subscriptions FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access UserRoles" ON public.user_roles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access UserActivity" ON public.user_activity FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access ActiveUsers" ON public.active_users FOR ALL USING (public.is_admin());

CREATE POLICY "Service Role Full Access Exports" ON public.translation_exports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "User View Own Profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public Read Templates" ON public.templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Collections" ON public.templates_collections FOR SELECT TO authenticated USING (true);

CREATE POLICY "User Insert Own Activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User View Own Activity" ON public.user_activity FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated View Active Users" ON public.active_users FOR SELECT TO authenticated USING (true);

CREATE POLICY "User Manage Own Customers" ON public.customers FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User Manage Own Translations" ON public.translations FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User View Own Exports" ON public.translation_exports FOR SELECT USING (EXISTS (SELECT 1 FROM public.translations t WHERE t.id = translation_id AND t.profile_id = auth.uid()));
CREATE POLICY "User Read Own Credits" ON public.credits FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "User Read Own Transactions" ON public.credits_transactions FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "User Read Own Notifications" ON public.notifications FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "User Update Own Notifications" ON public.notifications FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "User Delete Own Notifications" ON public.notifications FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Public Subscribe" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "User View Own Subscription" ON public.newsletter_subscriptions FOR SELECT USING (email = (auth.jwt() ->> 'email'));

GRANT EXECUTE ON FUNCTION deduct_credits_for_translation(UUID, UUID, INTEGER, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_user_has_password(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION verify_user_password(varchar) TO authenticated, service_role;

CREATE FOREIGN DATA WRAPPER stripe_wrapper
    HANDLER extensions.stripe_fdw_handler
    VALIDATOR extensions.stripe_fdw_validator;

CREATE SERVER stripe_server
    FOREIGN DATA WRAPPER stripe_wrapper
    OPTIONS (
        api_key_id 'placeholder',
        api_url 'https://api.stripe.com/v1/',
        api_version '2024-06-20'
    );

CREATE SCHEMA IF NOT EXISTS stripe;
CREATE FOREIGN TABLE stripe.balance (
    balance_type text, amount bigint, currency text, attrs jsonb
) SERVER stripe_server OPTIONS (object 'balance');

CREATE FOREIGN TABLE stripe.balance_transactions (
    id text, amount bigint, currency text, description text, fee bigint, net bigint, status text, type text, created timestamp, attrs jsonb
) SERVER stripe_server OPTIONS (object 'balance_transactions');

CREATE PROCEDURE install_stripe_secret() AS $$
DECLARE
    vault_key_id TEXT;
BEGIN
    SELECT key_id::TEXT FROM vault.secrets WHERE name='STRIPE_SECRET_KEY' INTO vault_key_id;
    IF vault_key_id IS NOT NULL THEN
        EXECUTE 'ALTER SERVER stripe_server OPTIONS (SET api_key_id ' || quote_literal(vault_key_id) || ')';
    END IF;
END
$$ LANGUAGE plpgsql;

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('document_logos', 'document_logos', true, 1048576, ARRAY['image/png', 'image/jpeg', 'image/svg+xml']) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('document_stamps', 'document_stamps', true, 2097152, ARRAY['image/png']) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('translations', 'translations', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('exports', 'exports', false, 52428800, ARRAY['application/pdf', 'text/html', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'application/rtf', 'application/vnd.oasis.opendocument.text', 'application/epub+zip']) ON CONFLICT DO NOTHING;

CREATE POLICY "User Manage Own Avatars" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'avatars' AND owner = auth.uid()) 
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Public View Avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "User Manage Own Logos" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'document_logos' AND (storage.foldername(name))[1] = auth.uid()::text) 
WITH CHECK (bucket_id = 'document_logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public View Logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'document_logos');

CREATE POLICY "User Manage Own Stamps" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'document_stamps' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public View Stamps" ON storage.objects FOR SELECT TO public USING (bucket_id = 'document_stamps');

CREATE POLICY "User Manage Own Translations" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'translations' AND owner = auth.uid()); 

CREATE POLICY "User Manage Own Files" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "User View Own Exports" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = 'translations' AND EXISTS (
    SELECT 1 FROM public.translations t 
    WHERE t.id::text = (storage.foldername(name))[2] AND t.profile_id = auth.uid()
));

CREATE POLICY "Service Role Full Storage" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE VIEW public.stripe_balance WITH (security_invoker = true) AS SELECT * FROM stripe.balance;
CREATE VIEW public.stripe_balance_transactions WITH (security_invoker = true) AS SELECT * FROM stripe.balance_transactions;

CREATE VIEW public.extended_customer_view WITH (security_invoker = true) AS 
SELECT c.*,
       COALESCE(COUNT(t.id), 0) AS number_of_translations
FROM public.customers c 
LEFT JOIN public.translations t ON c.id = t.customer_id
GROUP BY c.id;

CREATE VIEW public.extended_translation_view WITH (security_invoker = true) AS
SELECT t.*,
       c.display_name AS customer_name,
       c.email        AS customer_email,
       tmpl.name      AS template_name,
       CASE
           WHEN t.status IN ('queued', 'retrying') THEN 1
           WHEN t.status = 'processing' THEN 2
           WHEN t.status = 'translating' THEN 3
           WHEN t.status = 'polishing' THEN 4
           WHEN t.status = 'ready' THEN 5
           WHEN t.status = 'generating' THEN 6
           WHEN t.status = 'completed' THEN 7
           WHEN t.status IN ('failed', 'cancelled') THEN 8
           ELSE 9
       END AS status_order
FROM public.translations t
LEFT JOIN public.customers c ON t.customer_id = c.id
LEFT JOIN public.templates tmpl ON t.template_id = tmpl.id;

GRANT SELECT ON public.stripe_balance TO authenticated, service_role;
GRANT SELECT ON public.stripe_balance_transactions TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_credits_transactions_profile_id 
ON credits_transactions (profile_id);

CREATE INDEX IF NOT EXISTS idx_credits_transactions_profile_created 
ON credits_transactions (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_translations_profile_id 
ON translations (profile_id);

CREATE INDEX IF NOT EXISTS idx_translations_profile_created 
ON translations (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_id 
ON notifications (profile_id);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_read 
ON notifications (profile_id, read);

-- Expose only the RPCs used by the application; trigger helpers stay private.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_password(varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_has_password(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits_for_translation(uuid, uuid, integer, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_storage_object_metadata(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE ALL ON PROCEDURE public.install_stripe_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON PROCEDURE public.install_stripe_secret() TO service_role;
