-- CreateTable
CREATE TABLE `PointGroup` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `locationLabel` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PointGroup_businessId_idx`(`businessId`),
    UNIQUE INDEX `PointGroup_businessId_name_key`(`businessId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `pointGroupId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Tag_pointGroupId_idx` ON `Tag`(`pointGroupId`);

-- AddForeignKey
ALTER TABLE `PointGroup` ADD CONSTRAINT `PointGroup_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_pointGroupId_fkey` FOREIGN KEY (`pointGroupId`) REFERENCES `PointGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
