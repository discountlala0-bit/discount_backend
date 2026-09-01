-- Adds indexes on foreign-key/filter columns that had none (only unique
-- constraints existed before). These back the most frequent queries in the
-- app: filtering booklets/add-ons/places by city, orders by user+status,
-- and cart/order items by type+id.

CREATE INDEX IF NOT EXISTS "booklets_city_id_idx" ON "booklets"("city_id");
CREATE INDEX IF NOT EXISTS "offers_place_id_idx" ON "offers"("place_id");
CREATE INDEX IF NOT EXISTS "cart_items_item_type_item_id_idx" ON "cart_items"("item_type", "item_id");
CREATE INDEX IF NOT EXISTS "orders_user_id_status_idx" ON "orders"("user_id", "status");
CREATE INDEX IF NOT EXISTS "order_items_item_type_item_id_idx" ON "order_items"("item_type", "item_id");
CREATE INDEX IF NOT EXISTS "places_city_id_idx" ON "places"("city_id");
CREATE INDEX IF NOT EXISTS "places_category_id_idx" ON "places"("category_id");
CREATE INDEX IF NOT EXISTS "add_ons_city_id_idx" ON "add_ons"("city_id");
