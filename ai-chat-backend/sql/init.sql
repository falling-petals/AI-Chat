CREATE DATABASE IF NOT EXISTS ai_chat
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_chat;

-- ============================================================
-- Migration (2026-06-29): 移除冗余字段
-- 已有数据库执行：
--   ALTER TABLE conversation DROP COLUMN model_provider;
--   ALTER TABLE conversation DROP COLUMN model_name;
--   ALTER TABLE model_config DROP COLUMN is_active;
-- ============================================================

CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE conversation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) DEFAULT NULL,
    system_prompt TEXT DEFAULT NULL,
    pinned TINYINT(1) NOT NULL DEFAULT 0,
    archived TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_archived (user_id, archived),
    INDEX idx_user_pinned (user_id, pinned)
);

CREATE TABLE message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'user/assistant/system',
    content TEXT DEFAULT NULL,
    thinking TEXT DEFAULT NULL COMMENT '深度思考内容',
    file_ids TEXT DEFAULT NULL COMMENT '关联文件ID列表，JSON数组',
    search_enabled TINYINT(1) DEFAULT 0 COMMENT '是否开启了联网搜索',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_conv_created (conversation_id, created_at)
);

CREATE TABLE model_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    base_url VARCHAR(500) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_model (user_id, provider, model_name)
);

CREATE TABLE file (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    conversation_id BIGINT DEFAULT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_files (user_id)
);

-- ============================================================
-- Migration (2026-06-27): 对话置顶/归档
-- 已有数据库执行：
--   ALTER TABLE conversation ADD COLUMN pinned TINYINT(1) NOT NULL DEFAULT 0;
--   ALTER TABLE conversation ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0;
--   CREATE INDEX idx_user_archived ON conversation(user_id, archived);
-- 
-- Migration (2026-06-27): 文件上传
--   CREATE TABLE file (...);
--   ALTER TABLE message ADD COLUMN file_ids TEXT DEFAULT NULL;
-- ============================================================
