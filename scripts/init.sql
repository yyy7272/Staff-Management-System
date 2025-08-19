-- 初始化数据库脚本
-- 用于 Docker 容器启动时的数据库初始化

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS StaffDB;
USE StaffDB;

-- 设置字符集
ALTER DATABASE StaffDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户权限（如果需要额外的用户）
-- CREATE USER IF NOT EXISTS 'staffuser'@'%' IDENTIFIED BY 'StaffUser123!@#';
-- GRANT ALL PRIVILEGES ON StaffDB.* TO 'staffuser'@'%';
-- FLUSH PRIVILEGES;

-- 注意：实际的表结构将由 Entity Framework 迁移创建
-- 这个脚本只是确保数据库存在并配置正确