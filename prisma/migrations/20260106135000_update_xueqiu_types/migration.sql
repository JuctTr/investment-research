-- 更新 SourceType 枚举，将 XUEQIU 拆分为 XUEQIU_USER_PROFILE 和 XUEQIU_USER_STATUSES

-- Step 1: 创建新的枚举类型，包含新的值
CREATE TYPE "SourceType_New" AS ENUM ('RSS', 'WECHAT', 'XUEQIU_USER_PROFILE', 'XUEQIU_USER_STATUSES', 'TWITTER', 'REDDIT', 'HACKERNEWS', 'CUSTOM');

-- Step 2: 将现有的 sourceType 列转换到新类型
-- 对于旧的 XUEQIU 值，默认转换为 XUEQIU_USER_STATUSES
ALTER TABLE "crawler_sources" ALTER COLUMN "sourceType" TYPE "SourceType_New" USING
  CASE "sourceType"
    WHEN 'XUEQIU' THEN 'XUEQIU_USER_STATUSES'::"SourceType_New"
    ELSE "sourceType"::text::"SourceType_New"
  END;

-- Step 3: 删除旧的枚举类型
DROP TYPE "SourceType";

-- Step 4: 重命名新类型为原名
ALTER TYPE "SourceType_New" RENAME TO "SourceType";
