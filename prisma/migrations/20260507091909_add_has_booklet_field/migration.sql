-- AlterTable
ALTER TABLE "places" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "has_booklet" BOOLEAN NOT NULL DEFAULT false;
