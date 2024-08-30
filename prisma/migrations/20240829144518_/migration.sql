/*
  Warnings:

  - You are about to alter the column `fileName` on the `digital_files` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `fileUrl` on the `digital_files` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `price` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `url` on the `product_images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `title` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalSales` on the `seller_analytics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `name` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `subject` on the `support_tickets` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `firstName` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "digital_files" ALTER COLUMN "fileName" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "fileUrl" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "product_images" ALTER COLUMN "url" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "seller_analytics" ALTER COLUMN "totalSales" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "stores" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "support_tickets" ALTER COLUMN "subject" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "username" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "carts_createdAt_updatedAt_idx" ON "carts"("createdAt", "updatedAt");

-- CreateIndex
CREATE INDEX "orders_createdAt_updatedAt_idx" ON "orders"("createdAt", "updatedAt");

-- CreateIndex
CREATE INDEX "products_createdAt_updatedAt_idx" ON "products"("createdAt", "updatedAt");

-- CreateIndex
CREATE INDEX "seller_analytics_lastUpdated_idx" ON "seller_analytics"("lastUpdated");

-- CreateIndex
CREATE INDEX "stores_createdAt_updatedAt_idx" ON "stores"("createdAt", "updatedAt");

-- CreateIndex
CREATE INDEX "subscriptions_createdAt_updatedAt_idx" ON "subscriptions"("createdAt", "updatedAt");

-- CreateIndex
CREATE INDEX "support_tickets_createdAt_updatedAt_idx" ON "support_tickets"("createdAt", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_createdAt_updatedAt_idx" ON "users"("createdAt", "updatedAt");
