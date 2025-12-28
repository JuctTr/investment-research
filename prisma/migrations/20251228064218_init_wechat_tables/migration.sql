-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CrawlMode" AS ENUM ('SOGOU', 'WECHAT_PC', 'AUTO');

-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "wechat_accounts" (
    "id" TEXT NOT NULL,
    "account_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "introduction" TEXT,
    "avatar_url" VARCHAR(500),
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "crawlMode" "CrawlMode" NOT NULL DEFAULT 'AUTO',
    "followers_count" INTEGER NOT NULL DEFAULT 0,
    "publish_count" INTEGER NOT NULL DEFAULT 0,
    "last_crawl_at" TIMESTAMPTZ,
    "last_publish_at" TIMESTAMPTZ,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "raw_data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wechat_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wechat_articles" (
    "id" TEXT NOT NULL,
    "article_id" VARCHAR(100) NOT NULL,
    "account_id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "author" VARCHAR(200),
    "digest" TEXT,
    "content" TEXT,
    "content_html" TEXT,
    "cover_url" VARCHAR(500),
    "source_url" VARCHAR(500) NOT NULL,
    "publish_time" TIMESTAMPTZ NOT NULL,
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "reward_count" INTEGER NOT NULL DEFAULT 0,
    "is_original" BOOLEAN NOT NULL DEFAULT false,
    "copyright_stat" INTEGER DEFAULT 0,
    "raw_data" JSONB,
    "db_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "db_updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wechat_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wechat_crawl_logs" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "crawl_mode" "CrawlMode" NOT NULL,
    "status" "CrawlStatus" NOT NULL,
    "articles_fetched" INTEGER NOT NULL DEFAULT 0,
    "articles_stored" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "error_stack" TEXT,
    "duration" INTEGER,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wechat_crawl_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wechat_accounts_account_id_key" ON "wechat_accounts"("account_id");

-- CreateIndex
CREATE INDEX "wechat_accounts_status_idx" ON "wechat_accounts"("status");

-- CreateIndex
CREATE INDEX "wechat_accounts_enabled_idx" ON "wechat_accounts"("enabled");

-- CreateIndex
CREATE INDEX "wechat_accounts_last_crawl_at_idx" ON "wechat_accounts"("last_crawl_at");

-- CreateIndex
CREATE UNIQUE INDEX "wechat_articles_article_id_key" ON "wechat_articles"("article_id");

-- CreateIndex
CREATE INDEX "wechat_articles_account_id_idx" ON "wechat_articles"("account_id");

-- CreateIndex
CREATE INDEX "wechat_articles_publish_time_idx" ON "wechat_articles"("publish_time");

-- CreateIndex
CREATE INDEX "wechat_articles_publish_time_desc_idx" ON "wechat_articles"("publish_time" DESC);

-- CreateIndex
CREATE INDEX "wechat_crawl_logs_account_id_idx" ON "wechat_crawl_logs"("account_id");

-- CreateIndex
CREATE INDEX "wechat_crawl_logs_status_idx" ON "wechat_crawl_logs"("status");

-- CreateIndex
CREATE INDEX "wechat_crawl_logs_started_at_idx" ON "wechat_crawl_logs"("started_at");

-- AddForeignKey
ALTER TABLE "wechat_articles" ADD CONSTRAINT "wechat_articles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "wechat_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_crawl_logs" ADD CONSTRAINT "wechat_crawl_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "wechat_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
