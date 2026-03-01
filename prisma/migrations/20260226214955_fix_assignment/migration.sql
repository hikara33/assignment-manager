/*
  Warnings:

  - You are about to drop the column `descripion` on the `assignments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "descripion",
ADD COLUMN     "description" TEXT;
