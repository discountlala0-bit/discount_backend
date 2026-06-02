/*
  Warnings:

  - The unique constraint covering the columns `[user_id,offer_id]` on the table `user_coupons` will be dropped.

*/

-- DropIndex
DROP INDEX IF EXISTS "user_coupons_user_id_offer_id_key";
