-- CreateTable
CREATE TABLE `SocialPost` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `platform` ENUM('MENU', 'WHATSAPP', 'INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'GOOGLE_REVIEWS', 'GOOGLE_MAPS', 'WEBSITE', 'PHONE', 'CATALOG', 'CUSTOM') NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SocialPost_businessId_position_idx`(`businessId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
