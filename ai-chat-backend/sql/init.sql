CREATE DATABASE IF NOT EXISTS ai_chat DEFAULT CHARACTER SET utf8mb4;

USE ai_chat;

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
    model_provider VARCHAR(50) DEFAULT 'dashscope',
    model_name VARCHAR(100) DEFAULT 'qwen-plus',
    system_prompt TEXT DEFAULT NULL,
    pinned TINYINT(1) NOT NULL DEFAULT 0,
    archived TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_archived (user_id, archived)
);

CREATE TABLE message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'user/assistant/system',
    content TEXT DEFAULT NULL,
    thinking TEXT DEFAULT NULL COMMENT '深度思考内容',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id)
);

CREATE TABLE model_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    base_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_model (user_id, provider, model_name)
);

-- ============================================================
-- Migration (2026-06-27): 对话置顶/归档
-- 已有数据库执行：
--   ALTER TABLE conversation ADD COLUMN pinned TINYINT(1) NOT NULL DEFAULT 0;
--   ALTER TABLE conversation ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0;
--   CREATE INDEX idx_user_archived ON conversation(user_id, archived);
-- ============================================================
