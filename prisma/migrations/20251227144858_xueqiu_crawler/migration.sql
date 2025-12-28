-- CreateEnum
CREATE TYPE "XueqiuTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CookieStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "xueqiu_users" (
    "uid" VARCHAR NOT NULL,
    "screen_name" VARCHAR(100) NOT NULL,
    "followers_count" INTEGER NOT NULL DEFAULT 0,
    "friends_count" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_crawl_at" TIMESTAMPTZ,

    CONSTRAINT "xueqiu_users_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "xueqiu_crawl_tasks" (
    "id" UUID NOT NULL,
    "target_type" VARCHAR(50) NOT NULL DEFAULT '',
    "target_id" VARCHAR NOT NULL DEFAULT '',
    "status" "XueqiuTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "result" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "xueqiu_crawl_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xueqiu_cookies" (
    "id" UUID NOT NULL,
    "cookie" TEXT NOT NULL,
    "status" "CookieStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "last_used_at" TIMESTAMPTZ,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xueqiu_cookies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "xueqiu_users_last_crawl_at_idx" ON "xueqiu_users"("last_crawl_at");

-- CreateIndex
CREATE INDEX "xueqiu_crawl_tasks_status_priority_created_at_idx" ON "xueqiu_crawl_tasks"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "xueqiu_cookies_status_idx" ON "xueqiu_cookies"("status");

-- CreateIndex
CREATE INDEX "xueqiu_cookies_expires_at_idx" ON "xueqiu_cookies"("expires_at");
