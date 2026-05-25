/*
  Warnings:

  - A unique constraint covering the columns `[redeem_code]` on the table `user_coupons` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "booklets_city_id_key";

-- AlterTable
ALTER TABLE "add_ons" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "popularity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "terms_and_conditions" TEXT;

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "city_id" TEXT;

-- AlterTable
ALTER TABLE "user_coupons" ADD COLUMN     "redeem_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_coupons_redeem_code_key" ON "user_coupons"("redeem_code");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
