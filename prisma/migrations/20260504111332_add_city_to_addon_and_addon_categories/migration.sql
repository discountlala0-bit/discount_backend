/*
  Warnings:

  - Added the required column `city_id` to the `add_ons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "add_ons" ADD COLUMN     "city_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "add_on_categories" (
    "id" TEXT NOT NULL,
    "add_on_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "add_on_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "add_on_categories_add_on_id_category_id_key" ON "add_on_categories"("add_on_id", "category_id");

-- AddForeignKey
ALTER TABLE "add_ons" ADD CONSTRAINT "add_ons_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "add_on_categories" ADD CONSTRAINT "add_on_categories_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "add_ons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "add_on_categories" ADD CONSTRAINT "add_on_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
