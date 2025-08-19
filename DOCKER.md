# Docker 部署指南

本文档提供了员工管理系统的 Docker 容器化部署指南。

## 目录

- [概述](#概述)
- [先决条件](#先决条件)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [服务架构](#服务架构)
- [常用命令](#常用命令)
- [故障排除](#故障排除)
- [生产环境部署](#生产环境部署)

## 概述

该系统使用 Docker Compose 进行容器化部署，包含以下服务：

- **Frontend**: React 应用（Nginx 服务）
- **Backend**: ASP.NET Core API
- **Database**: MySQL 8.0

## 先决条件

### 必需软件

1. **Docker Desktop** (推荐) 或 Docker Engine
   - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
   - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

2. **Docker Compose** (通常包含在 Docker Desktop 中)
   - 验证安装: `docker compose version`

### 系统要求

- **RAM**: 最少 4GB，推荐 8GB
- **存储**: 最少 2GB 可用空间
- **CPU**: 双核处理器

## 快速开始

### 1. 克隆项目并进入目录

```bash
git clone <your-repository-url>
cd StaffManagementSystem
```

### 2. 配置环境变量

复制环境配置文件：

```bash
# Windows
copy .env.docker .env

# Linux/Mac
cp .env.docker .env
```

编辑 `.env` 文件，修改以下配置：

```env
# 邮件服务配置（必须配置）
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# 其他配置根据需要修改
MYSQL_ROOT_PASSWORD=your-secure-password
JWT_KEY=your-jwt-secret-key
```

### 3. 启动服务

#### Windows

```cmd
# 使用批处理脚本
docker-start.bat

# 或手动命令
docker compose up --build -d
```

#### Linux/Mac

```bash
# 使用脚本
./docker-start.sh

# 或手动命令
docker compose up --build -d
```

### 4. 访问应用

- **前端**: http://localhost
- **后端 API**: http://localhost:5000
- **API 文档**: http://localhost:5000/swagger (如果启用)

### 5. 默认管理员账户

```
用户名: admin
密码: Admin123!@#
```

**⚠️ 重要**: 首次登录后请立即修改管理员密码！

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | `StaffDB123!@#` |
| `MYSQL_DATABASE` | 数据库名称 | `StaffDB` |
| `MYSQL_USER` | MySQL 用户名 | `staffuser` |
| `MYSQL_PASSWORD` | MySQL 用户密码 | `StaffUser123!@#` |
| `JWT_KEY` | JWT 密钥 | `ThisIsAVerySecureKeyForJWTTokenGeneration123!@#` |
| `EMAIL_USERNAME` | SMTP 用户名 | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP 密码 | `your-app-password` |
| `FRONTEND_PORT` | 前端端口 | `80` |
| `BACKEND_PORT` | 后端端口 | `5000` |
| `DATABASE_PORT` | 数据库端口 | `3306` |

### 端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|----------|----------|------|
| Frontend | 80 | 80 | React 应用 |
| Backend | 5000 | 5000 | ASP.NET Core API |
| Database | 3306 | 3306 | MySQL 数据库 |

## 服务架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Nginx)       │    │  (ASP.NET Core) │    │    (MySQL)      │
│   Port: 80      │◄──►│   Port: 5000    │◄──►│   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 网络配置

- 所有服务运行在 `staff-network` 桥接网络中
- 前端通过 Nginx 反向代理访问后端 API
- 后端通过容器名 `database` 连接数据库

## 常用命令

### 基本操作

```bash
# 启动所有服务
docker compose up -d

# 重新构建并启动
docker compose up --build -d

# 停止所有服务
docker compose down

# 重启单个服务
docker compose restart backend

# 查看服务状态
docker compose ps
```

### 日志查看

```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs backend
docker compose logs frontend
docker compose logs database

# 实时查看日志
docker compose logs -f

# 查看最近 100 行日志
docker compose logs --tail=100
```

### 数据管理

```bash
# 进入数据库容器
docker compose exec database mysql -u root -p

# 备份数据库
docker compose exec database mysqldump -u root -p StaffDB > backup.sql

# 恢复数据库
docker compose exec -T database mysql -u root -p StaffDB < backup.sql

# 查看数据卷
docker volume ls
```

### 开发调试

```bash
# 进入后端容器
docker compose exec backend bash

# 进入前端容器
docker compose exec frontend sh

# 查看容器资源使用情况
docker stats

# 清理未使用的容器和镜像
docker system prune
```

## 故障排除

### 常见问题

#### 1. 端口冲突

**错误**: `bind: address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :80     # Windows
lsof -i :80                    # Linux/Mac

# 停止占用端口的服务或修改 docker-compose.yml 中的端口映射
```

#### 2. 数据库连接失败

**错误**: `Unable to connect to any of the specified MySQL hosts`

**解决方案**:
```bash
# 检查数据库容器状态
docker compose logs database

# 重启数据库服务
docker compose restart database

# 验证数据库健康状态
docker compose exec database mysqladmin ping -h localhost
```

#### 3. 构建失败

**错误**: 构建过程中出现依赖问题

**解决方案**:
```bash
# 清理 Docker 缓存
docker builder prune

# 强制重新构建
docker compose build --no-cache

# 检查 .dockerignore 文件是否正确
```

#### 4. 前端无法访问后端

**症状**: 前端加载但 API 请求失败

**解决方案**:
1. 检查后端容器是否正常运行
2. 验证 Nginx 配置中的代理设置
3. 检查网络连接

```bash
# 测试后端 API
curl http://localhost:5000/health

# 检查 Nginx 配置
docker compose exec frontend cat /etc/nginx/nginx.conf
```

### 性能优化

#### 1. 内存优化

```yaml
# 在 docker-compose.yml 中添加内存限制
services:
  backend:
    mem_limit: 512m
    mem_reservation: 256m
```

#### 2. 启动优化

```bash
# 预拉取镜像
docker compose pull

# 并行构建
docker compose build --parallel
```

## 生产环境部署

### 安全配置

1. **修改默认密码**
   ```env
   MYSQL_ROOT_PASSWORD=your-strong-password
   JWT_KEY=your-secure-jwt-key-at-least-32-characters
   ```

2. **配置 HTTPS**
   - 使用 Let's Encrypt 或其他 SSL 证书
   - 修改 Nginx 配置支持 HTTPS

3. **网络安全**
   - 关闭不必要的端口映射
   - 使用防火墙限制访问

### 监控配置

```yaml
# 添加到 docker-compose.yml
services:
  monitoring:
    image: prom/prometheus
    # 监控配置
```

### 备份策略

```bash
# 创建定时备份脚本
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T database mysqldump -u root -p$MYSQL_ROOT_PASSWORD StaffDB > "backup_$BACKUP_DATE.sql"
```

### 日志管理

```yaml
# 在 docker-compose.yml 中配置日志
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 升级指南

### 1. 备份数据

```bash
# 备份数据库
docker compose exec -T database mysqldump -u root -p StaffDB > backup_before_upgrade.sql

# 备份配置文件
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup
```

### 2. 更新代码

```bash
git pull origin main
```

### 3. 重新部署

```bash
docker compose down
docker compose up --build -d
```

### 4. 验证升级

```bash
# 检查服务状态
docker compose ps

# 验证应用功能
curl http://localhost:5000/health
```

## 卸载

### 完全清理

```bash
# 停止并删除所有容器
docker compose down

# 删除数据卷（⚠️ 会删除所有数据）
docker compose down -v

# 删除镜像
docker rmi staffmanagementsystem-frontend
docker rmi staffmanagementsystem-backend

# 清理未使用的资源
docker system prune -a
```

## 支持

如果遇到问题，请按以下步骤：

1. 查看本文档的[故障排除](#故障排除)部分
2. 检查 [Issues](https://github.com/your-repo/issues) 页面
3. 创建新的 Issue 并提供：
   - 错误信息
   - 日志输出
   - 系统环境信息
   - 复现步骤

---

更多信息请参考主项目文档 [README.md](README.md) 和 [CLAUDE.md](CLAUDE.md)。