CREATE TYPE "public"."token_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"code" varchar(6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"last_name" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"username" varchar(100) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"category" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "active_codes_idx" ON "otp_codes" USING btree ("is_active","expires_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "user_codes_idx" ON "otp_codes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "active_users_idx" ON "users" USING btree ("is_active","last_login_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_words_idx" ON "words" USING btree ("user_id","created_at");