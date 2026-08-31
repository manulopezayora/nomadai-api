-- AlterTable
ALTER TABLE "hotel_recommendations" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "original_price_per_night" DOUBLE PRECISION,
ADD COLUMN     "review_count" INTEGER;
