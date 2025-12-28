-- CreateTable
CREATE TABLE "xueqiu_statuses" (
    "id" UUID NOT NULL,
    "status_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "raw_text" TEXT,
    "expanded_text" TEXT,
    "target_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "repost_count" INTEGER NOT NULL DEFAULT 0,
    "raw_data" JSONB,
    "db_created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "db_updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xueqiu_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "xueqiu_statuses_user_id_created_at_idx" ON "xueqiu_statuses"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "xueqiu_statuses_created_at_idx" ON "xueqiu_statuses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "xueqiu_statuses_status_id_key" ON "xueqiu_statuses"("status_id");
