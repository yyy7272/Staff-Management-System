# Staff Management System

A full-stack application for managing employees, departments, approvals, and payroll with advanced security features and modern architecture.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![.NET Core](https://img.shields.io/badge/.NET%20Core-9.0-purple.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)


## ✨ Key Features

### 🔐 Enterprise Security
- **JWT Authentication** with automatic token refresh
- **Email Verification** system with 24-hour expiry
- **Role-Based Access Control (RBAC)** with fine-grained permissions
- **Password Security** using HMAC-SHA512 with salt hashing

### 👥 Employee Management
- Complete employee lifecycle management
- Department hierarchy with unlimited levels
- Employee avatar upload and management
- Real-time notifications and activity tracking

### 🏢 Features
- **Department Hierarchy**: Self-referencing tree structure
- **Approval Workflows**: Multi-role approval system with status tracking
- **Activity Logging**: Comprehensive audit trail

## 🏗️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for modern styling
- **Radix UI** components for accessibility
- **React Router** for client-side routing
- **React Hook Form** for form management
- **Sonner** for notifications

### Backend
- **ASP.NET Core 9.0** Web API
- **Entity Framework Core** for data access
- **MySQL 8.0** database
- **JWT Bearer** authentication
- **SMTP Integration** for email services

### DevOps & Deployment
- **Docker & Docker Compose** for containerization


## 📁 Project Structure

```
StaffManagementSystem/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   ├── Dockerfile          # Frontend container config
│   └── nginx.conf          # Nginx configuration
├── backend/                 # ASP.NET Core API
│   ├── StaffManagementSystem/
│   │   ├── Controllers/    # API controllers
│   │   ├── Models/         # Data models
│   │   ├── Services/       # Business logic
│   │   ├── DbContexts/     # Database contexts
│   │   └── Middleware/     # Custom middleware
│   ├── StaffManagementSystem.Tests/  # Unit tests
│   └── Dockerfile          # Backend container config
├── scripts/                # Database initialization
├── docker-compose.yml      # Container orchestration
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** (recommended) or Docker Engine
- **Node.js 18+** (for local development)
- **.NET 9.0 SDK** (for local development)
- **MySQL 8.0** (if running without Docker)

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yyy7272/Staff-Management-System.git
   cd Staff-Management-System
   ```

2. **Configure environment**
   ```bash
   # Windows
   copy .env.docker .env
   
   # Linux/Mac
   cp .env.docker .env
   ```

3. **Update email configuration in .env**
   ```env
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

4. **Start the application**
   ```bash
   # Windows
   docker-start.bat
   
   # Linux/Mac
   ./docker-start.sh
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:3306

### Option 2: Local Development

#### Backend Setup
```bash
cd backend/StaffManagementSystem
dotnet restore
dotnet ef database update
dotnet run
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 👤 Default Administrator Account

```
Username: admin
Password: Admin123!@#
```


## 🧪 Testing

### Backend Tests
```bash
cd backend
dotnet test
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```


## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_KEY` | JWT secret key | Required |
| `EMAIL_USERNAME` | SMTP username | Required |
| `EMAIL_PASSWORD` | SMTP password | Required |
| `MYSQL_ROOT_PASSWORD` | Database password | `StaffDB123!@#` |

### Company Domain Configuration 
Configure allowed email domains in `appsettings.json`:
```json
{
  "CompanyAccess": {
    "AllowedDomains": [
      "yourcompany.com",
      "*.yourcompany.com"
    ]
  }
}
```

## 📚 API Documentation

The API follows RESTful conventions with comprehensive endpoints:

- **Authentication**: `/api/auth/*`
- **Employees**: `/api/Employee/*`
- **Departments**: `/api/Department/*`
- **Approvals**: `/api/Approval/*`
- **Payroll**: `/api/payroll/*`
- **Admin**: `/api/admin/*`

## 📋 Development Commands

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:coverage # Run tests with coverage
```

### Backend Commands
```bash
dotnet run                    # Start API server
dotnet build                  # Build the solution
dotnet test                   # Run tests
dotnet ef database update    # Apply migrations
dotnet ef migrations add <name> # Create new migration
```

## 🙏 Acknowledgments

- Built with modern web technologies and best practices with the help of claude code
- Inspired by enterprise-grade management systems


