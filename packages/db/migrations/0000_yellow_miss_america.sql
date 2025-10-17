-- Create a custom ENUM type for token status
CREATE TYPE public.token_status AS ENUM('active', 'expired', 'revoked');

-- Table for users
CREATE TABLE public.users (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

-- Table for services that can have tokens
CREATE TABLE public.services (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "services_name_unique" UNIQUE("name")
);

-- Table for user- or service-specific access tokens
CREATE TABLE public.access_tokens (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" public.token_status NOT NULL,
	"service_id" uuid NOT NULL,
	"user_id" uuid,
	"notified" boolean DEFAULT false,
	"expires_at" timestamp with time zone NOT NULL,
	"renewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone
);

-- Table for one-time password (OTP) codes
CREATE TABLE public.otp_codes (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(6) NOT NULL,
	"user_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone
);

-- Foreign Key Constraints
ALTER TABLE public.access_tokens ADD CONSTRAINT "access_tokens_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES public.services("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE public.access_tokens ADD CONSTRAINT "access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES public.users("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE public.otp_codes ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES public.users("id") ON DELETE cascade ON UPDATE no action;

-- Indexes for performance
CREATE INDEX "token_service_idx" ON public.access_tokens USING btree ("service_id","status");
CREATE INDEX "token_expiry_idx" ON public.access_tokens USING btree ("expires_at");
CREATE INDEX "token_user_idx" ON public.access_tokens USING btree ("user_id");

CREATE INDEX "active_codes_idx" ON public.otp_codes USING btree ("is_active","expires_at") WHERE deleted_at IS NULL;
CREATE INDEX "user_codes_idx" ON public.otp_codes USING btree ("user_id","created_at");

CREATE INDEX "active_services_idx" ON public.services USING btree ("name") WHERE deleted_at IS NULL;

CREATE INDEX "active_users_idx" ON public.users USING btree ("is_active","last_login_at") WHERE deleted_at IS NULL;

-- Trigger function to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with an 'updated_at' column
CREATE TRIGGER set_updated_at_timestamp_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_timestamp_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_timestamp_access_tokens BEFORE UPDATE ON public.access_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_timestamp_otp_codes BEFORE UPDATE ON public.otp_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
