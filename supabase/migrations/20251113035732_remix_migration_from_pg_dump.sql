--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: company_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_profiles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_name text NOT NULL,
    description text,
    target_audience text,
    keywords text[],
    brand_colors text[],
    logo_url text,
    website_url text,
    instagram_handle text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text,
    bio text,
    default_tone text DEFAULT 'professional'::text,
    max_hashtags integer DEFAULT 10,
    instagram_access_token text,
    instagram_user_id text
);


--
-- Name: generated_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_posts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_profile_id uuid,
    post_type text NOT NULL,
    variant text NOT NULL,
    objective text NOT NULL,
    theme text NOT NULL,
    caption text NOT NULL,
    hashtags text[] NOT NULL,
    image_prompt text NOT NULL,
    image_url text,
    alt_text text,
    rationale text,
    tone text,
    style text,
    cta text,
    requires_review boolean DEFAULT false,
    review_reason text,
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT generated_posts_post_type_check CHECK ((post_type = ANY (ARRAY['feed'::text, 'story'::text]))),
    CONSTRAINT generated_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT generated_posts_variant_check CHECK ((variant = ANY (ARRAY['A'::text, 'B'::text])))
);


--
-- Name: scheduled_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_posts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    generated_post_id uuid,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone NOT NULL,
    timezone text DEFAULT 'America/Sao_Paulo'::text,
    status text DEFAULT 'scheduled'::text,
    instagram_media_id text,
    published_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scheduled_posts_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'publishing'::text, 'published'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: company_profiles company_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_profiles
    ADD CONSTRAINT company_profiles_pkey PRIMARY KEY (id);


--
-- Name: generated_posts generated_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_posts
    ADD CONSTRAINT generated_posts_pkey PRIMARY KEY (id);


--
-- Name: scheduled_posts scheduled_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_pkey PRIMARY KEY (id);


--
-- Name: idx_company_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_profiles_user_id ON public.company_profiles USING btree (user_id);


--
-- Name: idx_generated_posts_company_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_posts_company_profile_id ON public.generated_posts USING btree (company_profile_id);


--
-- Name: idx_generated_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_posts_user_id ON public.generated_posts USING btree (user_id);


--
-- Name: idx_scheduled_posts_scheduled_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_posts_scheduled_date ON public.scheduled_posts USING btree (scheduled_date);


--
-- Name: idx_scheduled_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts USING btree (status);


--
-- Name: idx_scheduled_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_posts_user_id ON public.scheduled_posts USING btree (user_id);


--
-- Name: company_profiles update_company_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON public.company_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: generated_posts update_generated_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_generated_posts_updated_at BEFORE UPDATE ON public.generated_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: scheduled_posts update_scheduled_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON public.scheduled_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: generated_posts generated_posts_company_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_posts
    ADD CONSTRAINT generated_posts_company_profile_id_fkey FOREIGN KEY (company_profile_id) REFERENCES public.company_profiles(id) ON DELETE CASCADE;


--
-- Name: scheduled_posts scheduled_posts_generated_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_generated_post_id_fkey FOREIGN KEY (generated_post_id) REFERENCES public.generated_posts(id) ON DELETE CASCADE;


--
-- Name: company_profiles Users can create their own company profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own company profiles" ON public.company_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_posts Users can create their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own posts" ON public.generated_posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scheduled_posts Users can create their own scheduled posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scheduled posts" ON public.scheduled_posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: company_profiles Users can delete their own company profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own company profiles" ON public.company_profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.generated_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scheduled_posts Users can delete their own scheduled posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scheduled posts" ON public.scheduled_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: company_profiles Users can update their own company profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own company profiles" ON public.company_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: generated_posts Users can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own posts" ON public.generated_posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: scheduled_posts Users can update their own scheduled posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own scheduled posts" ON public.scheduled_posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: company_profiles Users can view their own company profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own company profiles" ON public.company_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_posts Users can view their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own posts" ON public.generated_posts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scheduled_posts Users can view their own scheduled posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scheduled posts" ON public.scheduled_posts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: company_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


