-- Mirrors the booklet_offers quantity multiplier: a single add-on offer can
-- now be purchased once but grant the customer multiple independent
-- redeemable coupons (e.g. "4x" grants 4 separate redemptions).
ALTER TABLE "add_on_offers" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
