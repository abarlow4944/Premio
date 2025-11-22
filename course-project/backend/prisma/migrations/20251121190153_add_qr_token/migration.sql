/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "qrToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_qrToken_key" ON "User"("qrToken");
