/*
  Warnings:

  - Added the required column `type` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('COMPLAINT', 'SERVICE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "type" "CategoryType" NOT NULL;
