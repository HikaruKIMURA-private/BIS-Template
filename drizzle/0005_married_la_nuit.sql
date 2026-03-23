CREATE TABLE "skill_sheet" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"experience_years" integer NOT NULL,
	"owned_skills" text NOT NULL,
	"careers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_sheet_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "skill_sheet" ADD CONSTRAINT "skill_sheet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_sheet_userId_idx" ON "skill_sheet" USING btree ("user_id");