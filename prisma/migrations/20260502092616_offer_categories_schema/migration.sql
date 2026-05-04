/*
  Warnings:

  - You are about to drop the column `category` on the `booklets` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `offers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[city_id]` on the table `booklets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category_id` to the `offers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booklets" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "offers" DROP COLUMN "category",
ADD COLUMN     "category_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booklet_categories" (
    "id" TEXT NOT NULL,
    "booklet_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "booklet_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "booklet_categories_booklet_id_category_id_key" ON "booklet_categories"("booklet_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "booklets_city_id_key" ON "booklets"("city_id");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booklet_categories" ADD CONSTRAINT "booklet_categories_booklet_id_fkey" FOREIGN KEY ("booklet_id") REFERENCES "booklets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booklet_categories" ADD CONSTRAINT "booklet_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
