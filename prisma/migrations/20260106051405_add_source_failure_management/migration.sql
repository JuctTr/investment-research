-- CreateEnum
CREATE TYPE "SourceHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'DISABLED');

-- AlterTable
ALTER TABLE "crawler_sources" ADD COLUMN     "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "healthStatus" "SourceHealthStatus" NOT NULL DEFAULT 'HEALTHY',
ADD COLUMN     "lastFailureAt" TIMESTAMP(3),
ADD COLUMN     "lastSuccessAt" TIMESTAMP(3),
ADD COLUMN     "maxConsecutiveFailures" INTEGER NOT NULL DEFAULT 5;
