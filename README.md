# Staff Management System

A comprehensive full-stack enterprise application for managing employees, departments, approvals, and payroll with advanced security features and modern architecture.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![.NET Core](https://img.shields.io/badge/.NET%20Core-9.0-purple.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)

## 🚀 Project Overview

This Staff Management System is a production-ready enterprise application built with modern technologies, featuring comprehensive employee lifecycle management, advanced security measures, and scalable architecture. The system supports complex organizational hierarchies, role-based access control, and automated workflows.

## ✨ Key Features

### 🔐 Enterprise Security
- **JWT Authentication** with automatic token refresh
- **Email Verification** system with 24-hour expiry
- **Company Domain Validation** with multi-layer security
- **Role-Based Access Control (RBAC)** with fine-grained permissions
- **Password Security** using HMAC-SHA512 with salt hashing
- **Account Lockout** protection against brute force attacks

### 👥 Employee Management
- Complete employee lifecycle management
- Department hierarchy with unlimited levels
- Advanced search and filtering capabilities
- Bulk operations and data export
- Employee avatar upload and management
- Real-time notifications and activity tracking

### 🏢 Organizational Features
- **Department Hierarchy**: Self-referencing tree structure
- **Approval Workflows**: Multi-role approval system with status tracking
- **Payroll Management**: Secure salary processing with role restrictions
- **Activity Logging**: Comprehensive audit trail
- **Statistics Dashboard**: Real-time analytics and reporting

### 🛠️ Technical Excellence
- **Full-Stack TypeScript**: Type-safe development
- **Modern React**: Hooks, Context API, and latest patterns
- **RESTful API**: Standardized endpoints with comprehensive documentation
- **Database Optimization**: Efficient queries with Entity Framework
- **Docker Containerization**: Production-ready deployment

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
- **ImageSharp** for image processing

### DevOps & Deployment
- **Docker & Docker Compose** for containerization
- **Nginx** reverse proxy with optimization
- **Multi-stage builds** for production optimization
- **Health checks** and monitoring
- **Cross-platform scripts** for deployment

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
   - Frontend: http://localhost
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

**⚠️ Important**: Change the administrator password immediately after first login!

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

## 📊 Architecture Highlights

### Security Architecture
- **Multi-layer validation**: Registration, middleware, and login validation
- **JWT stateless authentication** with secure token management
- **SQL injection protection** through Entity Framework parameterized queries
- **Company access control** with configurable domain whitelist

### Database Design
- **Self-referencing department hierarchy** with path tracking
- **Many-to-many relationships** for roles and permissions
- **Audit fields** with automatic timestamp management
- **Foreign key constraints** with appropriate cascade rules

### Code Quality
- **Base Service pattern** eliminating 30%+ code duplication
- **Generic CRUD operations** with type safety
- **Centralized error handling** with user-friendly messages
- **Comprehensive logging** for debugging and monitoring

## 🐳 Docker Configuration

The application is fully containerized with:
- **Frontend**: React app served by Nginx with reverse proxy
- **Backend**: ASP.NET Core API with health checks
- **Database**: MySQL 8.0 with persistent storage
- **Networking**: Custom bridge network for service communication

For detailed Docker documentation, see [DOCKER.md](DOCKER.md).

## 📈 Performance Features

- **Frontend Optimization**: Code splitting, lazy loading, CDN caching
- **Database Optimization**: Indexed queries, connection pooling
- **API Performance**: Pagination, bulk operations, response compression
- **Caching Strategy**: Static asset caching, API response optimization

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 5000, and 3306 are available
2. **Email service**: Configure SMTP settings for email verification
3. **Database connection**: Check MySQL service status and credentials
4. **Docker issues**: Verify Docker Desktop is running

For detailed troubleshooting, see [DOCKER.md](DOCKER.md#troubleshooting).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by enterprise-grade management systems
- Designed for scalability and maintainability

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yyy7272/Staff-Management-System/issues) page
2. Review the troubleshooting documentation
3. Create a new issue with detailed information

---

**Made with ❤️ by [Your Name]**