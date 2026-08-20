-- Max People is no longer configurable per offer; the field and every
-- "Valid For X People" display built on it have been removed from the
-- admin panel and the app.
ALTER TABLE "offers" DROP COLUMN "max_people";

-- Distributor codes now grant the customer a fixed-amount discount on
-- booklet purchases instead of a percentage. Existing discount_percentage
-- values do not carry over automatically — re-enter each distributor's
-- discount as a rupee amount after this migration runs.
ALTER TABLE "distributors" DROP COLUMN "discount_percentage";
ALTER TABLE "distributors" ADD COLUMN "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- A single offer can now be linked into the same booklet with a multiplier
-- (e.g. "4x" grants the customer 4 separate redemptions of that one coupon
-- within the booklet, instead of adding the offer 4 separate times).
ALTER TABLE "booklet_offers" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
