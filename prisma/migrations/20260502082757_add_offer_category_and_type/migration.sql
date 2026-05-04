/*
  Warnings:

  - Made the column `validity` on table `booklets` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `category` to the `offers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booklets" ADD COLUMN     "category" TEXT,
ALTER COLUMN "validity" SET NOT NULL,
ALTER COLUMN "validity" SET DEFAULT 365;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "offer_type" TEXT NOT NULL DEFAULT 'add_on';
