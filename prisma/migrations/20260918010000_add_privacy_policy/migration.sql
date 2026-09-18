-- CreateTable
CREATE TABLE "privacy_policy" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_policy_pkey" PRIMARY KEY ("id")
);
