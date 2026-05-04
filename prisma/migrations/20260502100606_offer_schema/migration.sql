/*
  Warnings:

  - You are about to drop the column `coupon_count` on the `booklets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "booklets" DROP COLUMN "coupon_count";

-- AlterTable
ALTER TABLE "user_coupons" ADD COLUMN     "expires_at" TIMESTAMP(3);
