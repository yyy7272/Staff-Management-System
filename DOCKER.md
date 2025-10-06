# Docker Deployment Guide

This document provides a Docker containerization deployment guide for the Staff Management System.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Service Architecture](#service-architecture)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Overview

This system uses Docker Compose for containerized deployment, including the following services:

- **Frontend**: React application (Nginx service)
- **Backend**: ASP.NET Core API
- **Database**: MySQL 8.0

## Prerequisites

### Required Software

1. **Docker Desktop** (recommended) or Docker Engine
   - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
   - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

2. **Docker Compose** (usually included with Docker Desktop)
   - Verify installation: `docker compose version`

### System Requirements

- **RAM**: Minimum 4GB, recommended 8GB
- **Storage**: Minimum 2GB available space
- **CPU**: Dual-core processor

## Quick Start

### 1. Clone the project and enter directory

```bash
git clone <your-repository-url>
cd StaffManagementSystem
```

### 2. Configure environment variables

Copy environment configuration file:

```bash
# Windows
copy .env.docker .env

# Linux/Mac
cp .env.docker .env
```

Edit the `.env` file and modify the following configuration:

```env
# Email service configuration (required)
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Modify other configurations as needed
MYSQL_ROOT_PASSWORD=your-secure-password
JWT_KEY=your-jwt-secret-key
```

### 3. Start services

#### Windows

```cmd
# Use batch script
docker-start.bat

# Or manual command
docker compose up --build -d
```

#### Linux/Mac

```bash
# Use script
./docker-start.sh

# Or manual command
docker compose up --build -d
```

### 4. Access application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/swagger (if enabled)

### 5. Default administrator account

```
Username: admin
Password: Admin123!@#
```

**⚠️ Important**: Please change the administrator password immediately after first login!

## Configuration

### Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `StaffDB123!@#` |
| `MYSQL_DATABASE` | Database name | `StaffDB` |
| `MYSQL_USER` | MySQL username | `staffuser` |
| `MYSQL_PASSWORD` | MySQL user password | `StaffUser123!@#` |
| `JWT_KEY` | JWT secret key | `ThisIsAVerySecureKeyForJWTTokenGeneration123!@#` |
| `EMAIL_USERNAME` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP password | `your-app-password` |
| `FRONTEND_PORT` | Frontend port | `80` |
| `BACKEND_PORT` | Backend port | `5000` |
| `DATABASE_PORT` | Database port | `3306` |

### Port Mapping

| Service | Container Port | Host Port | Description |
|---------|----------------|-----------|-------------|
| Frontend | 80 | 80 | React application |
| Backend | 5000 | 5000 | ASP.NET Core API |
| Database | 3306 | 3306 | MySQL database |

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Nginx)       │    │  (ASP.NET Core) │    │    (MySQL)      │
│   Port: 80      │◄──►│   Port: 5000    │◄──►│   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Network Configuration

- All services run in the `staff-network` bridge network
- Frontend accesses backend API through Nginx reverse proxy
- Backend connects to database via container name `database`

## Common Commands

### Basic Operations

```bash
# Start all services
docker compose up -d

# Rebuild and start
docker compose up --build -d

# Stop all services
docker compose down

# Restart single service
docker compose restart backend

# View service status
docker compose ps
```

### Log Viewing

```bash
# View all service logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs database

# View logs in real-time
docker compose logs -f

# View last 100 lines of logs
docker compose logs --tail=100
```

### Data Management

```bash
# Enter database container
docker compose exec database mysql -u root -p

# Backup database
docker compose exec database mysqldump -u root -p StaffDB > backup.sql

# Restore database
docker compose exec -T database mysql -u root -p StaffDB < backup.sql

# View data volumes
docker volume ls
```

### Development Debugging

```bash
# Enter backend container
docker compose exec backend bash

# Enter frontend container
docker compose exec frontend sh

# View container resource usage
docker stats

# Clean unused containers and images
docker system prune
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts

**Error**: `bind: address already in use`

**Solution**:
```bash
# Find process using the port
netstat -ano | findstr :80     # Windows
lsof -i :80                    # Linux/Mac

# Stop service using the port or modify port mapping in docker-compose.yml
```

#### 2. Database Connection Failure

**Error**: `Unable to connect to any of the specified MySQL hosts`

**Solution**:
```bash
# Check database container status
docker compose logs database

# Restart database service
docker compose restart database

# Verify database health status
docker compose exec database mysqladmin ping -h localhost
```

#### 3. Build Failure

**Error**: Dependency issues during build process

**Solution**:
```bash
# Clear Docker cache
docker builder prune

# Force rebuild
docker compose build --no-cache

# Check if .dockerignore file is correct
```

#### 4. Frontend Cannot Access Backend

**Symptoms**: Frontend loads but API requests fail

**Solution**:
1. Check if backend container is running normally
2. Verify proxy settings in Nginx configuration
3. Check network connectivity

```bash
# Test backend API
curl http://localhost:5000/health

# Check Nginx configuration
docker compose exec frontend cat /etc/nginx/nginx.conf
```

### Performance Optimization

#### 1. Memory Optimization

```yaml
# Add memory limits in docker-compose.yml
services:
  backend:
    mem_limit: 512m
    mem_reservation: 256m
```

#### 2. Startup Optimization

```bash
# Pre-pull images
docker compose pull

# Parallel build
docker compose build --parallel
```

## Production Deployment

### Security Configuration

1. **Change default passwords**
   ```env
   MYSQL_ROOT_PASSWORD=your-strong-password
   JWT_KEY=your-secure-jwt-key-at-least-32-characters
   ```

2. **Configure HTTPS**
   - Use Let's Encrypt or other SSL certificates
   - Modify Nginx configuration to support HTTPS

3. **Network Security**
   - Close unnecessary port mappings
   - Use firewall to restrict access

### Monitoring Configuration

```yaml
# Add to docker-compose.yml
services:
  monitoring:
    image: prom/prometheus
    # Monitoring configuration
```

### Backup Strategy

```bash
# Create scheduled backup script
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T database mysqldump -u root -p$MYSQL_ROOT_PASSWORD StaffDB > "backup_$BACKUP_DATE.sql"
```

### Log Management

```yaml
# Configure logging in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Upgrade Guide

### 1. Backup Data

```bash
# Backup database
docker compose exec -T database mysqldump -u root -p StaffDB > backup_before_upgrade.sql

# Backup configuration files
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup
```

### 2. Update Code

```bash
git pull origin main
```

### 3. Redeploy

```bash
docker compose down
docker compose up --build -d
```

### 4. Verify Upgrade

```bash
# Check service status
docker compose ps

# Verify application functionality
curl http://localhost:5000/health
```

## Uninstall

### Complete Cleanup

```bash
# Stop and remove all containers
docker compose down

# Remove data volumes (⚠️ will delete all data)
docker compose down -v

# Remove images
docker rmi staffmanagementsystem-frontend
docker rmi staffmanagementsystem-backend

# Clean unused resources
docker system prune -a
```

## Support

If you encounter issues, please follow these steps:

1. Check the [Troubleshooting](#troubleshooting) section in this document
2. Check the [Issues](https://github.com/your-repo/issues) page
3. Create a new Issue and provide:
   - Error messages
   - Log output
   - System environment information
   - Reproduction steps

---

For more information, please refer to the main project documentation [README.md](README.md) and [CLAUDE.md](CLAUDE.md).