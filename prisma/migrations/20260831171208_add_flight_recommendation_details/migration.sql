-- AlterTable
ALTER TABLE "flight_recommendations" ADD COLUMN     "class" TEXT,
ADD COLUMN     "departure_date" TEXT,
ADD COLUMN     "duration_minutes" INTEGER,
ADD COLUMN     "flight_number" TEXT,
ADD COLUMN     "stops" INTEGER;
