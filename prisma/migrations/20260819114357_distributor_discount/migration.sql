-- Distributor codes now grant the customer a checkout discount instead of
-- paying the distributor a commission. Historical data was exported to
-- distributor_old_commission_percentage_backup.csv and
-- distributor_commissions_backup.csv before this migration ran.

-- Replace commission_percentage with discount_percentage (reset to 0; the
-- old commission value is preserved in the CSV backup, not carried over).
ALTER TABLE "distributors" DROP COLUMN "commission_percentage";
ALTER TABLE "distributors" ADD COLUMN "discount_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Track how much of each order was discounted via a distributor code.
ALTER TABLE "orders" ADD COLUMN "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- No more payable commissions; "who used which distributor code" is now
-- answered by orders.distributor_id + orders.discount_amount directly.
DROP TABLE "distributor_commissions";
