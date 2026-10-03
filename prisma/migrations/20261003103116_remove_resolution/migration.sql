/*
  Warnings:

  - You are about to drop the `resolutions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "resolutions" DROP CONSTRAINT "resolutions_complaintId_fkey";

-- DropForeignKey
ALTER TABLE "resolutions" DROP CONSTRAINT "resolutions_officerId_fkey";

-- DropTable
DROP TABLE "resolutions";
