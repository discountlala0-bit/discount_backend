-- CreateTable
CREATE TABLE "add_ons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "add_on_offers" (
    "id" TEXT NOT NULL,
    "add_on_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,

    CONSTRAINT "add_on_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "add_on_offers_add_on_id_offer_id_key" ON "add_on_offers"("add_on_id", "offer_id");

-- AddForeignKey
ALTER TABLE "add_on_offers" ADD CONSTRAINT "add_on_offers_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "add_ons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "add_on_offers" ADD CONSTRAINT "add_on_offers_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
