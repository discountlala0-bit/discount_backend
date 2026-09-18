-- AlterTable
ALTER TABLE "terms_and_conditions" ALTER COLUMN "content" TYPE JSONB USING '[]'::jsonb;

-- AlterTable
ALTER TABLE "privacy_policy" ALTER COLUMN "content" TYPE JSONB USING '[]'::jsonb;
