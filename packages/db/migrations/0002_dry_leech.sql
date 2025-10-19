ALTER TABLE "words" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "language" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "translated" varchar(255);