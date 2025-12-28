-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('RSS', 'WECHAT', 'TWITTER', 'REDDIT', 'HACKERNEWS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "crawler_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fetchInterval" INTEGER NOT NULL DEFAULT 3600,
    "lastFetchAt" TIMESTAMP(3),
    "lastEtag" TEXT,
    "authConfig" JSONB,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawler_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawler_tasks" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalFetched" INTEGER NOT NULL DEFAULT 0,
    "totalParsed" INTEGER NOT NULL DEFAULT 0,
    "totalStored" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawler_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crawler_sources_sourceUrl_key" ON "crawler_sources"("sourceUrl");

-- AddForeignKey
ALTER TABLE "crawler_tasks" ADD CONSTRAINT "crawler_tasks_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "crawler_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
