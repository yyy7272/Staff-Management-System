# Testing Guide

This document provides comprehensive information about testing in the Staff Management System.

## Table of Contents

- [Overview](#overview)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)

## Overview

The Staff Management System uses a comprehensive testing strategy that includes:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test how different parts of the system work together
- **End-to-End Tests**: Test complete user workflows
- **Security Tests**: Test for vulnerabilities and security issues

## Frontend Testing

### Technology Stack

- **Testing Framework**: Vitest
- **Testing Library**: React Testing Library
- **User Interaction**: @testing-library/user-event
- **Mocking**: Vitest built-in mocking capabilities

### Test Structure

```
staffmanagementsystem/src/
├── components/
│   └── __tests__/
│       ├── LoginPage.test.tsx
│       └── DataTable.test.tsx
├── services/
│   └── __tests__/
│       └── employeeService.test.ts
├── hooks/
│   └── __tests__/
│       └── useEmployeeData.test.ts
└── setupTests.ts
```

### Types of Frontend Tests

1. **Component Tests**: Test React components in isolation
2. **Service Tests**: Test API service functions
3. **Hook Tests**: Test custom React hooks
4. **Integration Tests**: Test component interactions

### Running Frontend Tests

```bash
cd staffmanagementsystem

# Install dependencies
npm install

# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci

# Open test UI
npm run test:ui
```

### Example Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

## Backend Testing

### Technology Stack

- **Testing Framework**: xUnit
- **Assertion Library**: FluentAssertions
- **Mocking**: Moq
- **Database**: Entity Framework InMemory
- **Integration Testing**: ASP.NET Core Test Host

### Test Structure

```
StaffManagementSystem.Tests/
├── Controllers/
│   ├── EmployeeControllerTests.cs
│   └── AuthControllerTests.cs
├── Services/
│   ├── ActivityServiceTests.cs
│   └── NotificationServiceTests.cs
├── Models/
│   └── UserTests.cs
└── BasicTests.cs
```

### Types of Backend Tests

1. **Unit Tests**: Test individual methods and classes
2. **Controller Tests**: Test API endpoints
3. **Service Tests**: Test business logic
4. **Integration Tests**: Test database interactions

### Running Backend Tests

```bash
cd StaffManagementSystem-backend/StaffManagementSystem.Tests

# Restore packages
dotnet restore

# Run tests once
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run tests with detailed output
dotnet test --verbosity normal

# Run specific test
dotnet test --filter "TestMethodName"
```

### Example Test

```csharp
[Fact]
public async Task GetAll_ReturnsAllEmployees_WhenNoFilters()
{
    // Arrange
    await SeedTestDataAsync();

    // Act
    var result = await _controller.GetAll();

    // Assert
    var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
    var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
    
    var dataProperty = response.GetType().GetProperty("data");
    var data = dataProperty?.GetValue(response) as IEnumerable<object>;
    data.Should().NotBeNull();
    data.Should().HaveCount(2);
}
```

## Running Tests

### All Tests

Use the provided scripts to run both frontend and backend tests:

**Windows (PowerShell):**
```powershell
.\test-all.ps1
```

**Linux/Mac (Bash):**
```bash
./test-all.sh
```

### Individual Tests

**Frontend only:**
```bash
cd staffmanagementsystem
npm run test:ci
```

**Backend only:**
```bash
cd StaffManagementSystem-backend/StaffManagementSystem.Tests
dotnet test
```

## Test Coverage

### Frontend Coverage

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/index.html` - HTML report for browsers

Target coverage: **80%** minimum

### Backend Coverage

Coverage reports are generated using the XPlat Code Coverage collector:
```bash
dotnet test --collect:"XPlat Code Coverage"
```

Reports are saved in the `TestResults/` directory.

Target coverage: **80%** minimum

### Viewing Coverage Reports

**Frontend:**
```bash
cd staffmanagementsystem
npm run test:coverage
# Open coverage/index.html in browser
```

**Backend:**
Use tools like ReportGenerator to convert coverage files to HTML:
```bash
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:"TestResults/*/coverage.cobertura.xml" -targetdir:"CoverageReport"
```

## Continuous Integration

### GitHub Actions

The project includes a comprehensive CI/CD pipeline with:

1. **Frontend Tests**: Linting, unit tests, and build
2. **Backend Tests**: Unit tests and integration tests
3. **Security Scanning**: Vulnerability scanning with Trivy
4. **Integration Tests**: Full system testing with database
5. **Deployment**: Automated deployment to staging/production

### Pipeline Stages

```
┌─────────────┐    ┌─────────────┐
│  Frontend   │    │   Backend   │
│   Tests     │    │    Tests    │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └──────┬──────────┘
              │
       ┌──────▼──────┐
       │ Integration │
       │    Tests    │
       └──────┬──────┘
              │
       ┌──────▼──────┐
       │  Security   │
       │    Scan     │
       └──────┬──────┘
              │
       ┌──────▼──────┐
       │  Deploy     │
       │  Staging    │
       └─────────────┘
```

### Running CI Locally

To simulate the CI environment locally:

```bash
# Install act (GitHub Actions runner)
# https://github.com/nektos/act

# Run the CI pipeline
act
```

## Best Practices

### General Testing Principles

1. **AAA Pattern**: Arrange, Act, Assert
2. **Single Responsibility**: One test should test one thing
3. **Descriptive Names**: Test names should describe what they test
4. **Independent Tests**: Tests should not depend on each other
5. **Fast Tests**: Tests should run quickly

### Frontend Testing Best Practices

1. **Test User Behavior**: Focus on what users do, not implementation details
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock External Dependencies**: Mock API calls, external services
4. **Test Error States**: Test loading, error, and empty states
5. **Accessibility Testing**: Include accessibility checks

### Backend Testing Best Practices

1. **Use In-Memory Database**: For fast, isolated tests
2. **Mock External Services**: Mock email services, file storage, etc.
3. **Test Business Logic**: Focus on business rules and validation
4. **Test Error Handling**: Test exception handling and edge cases
5. **Clean Test Data**: Clean up test data after each test

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to group related tests
2. **Setup and Teardown**: Use `beforeEach`, `afterEach` for common setup
3. **Test Data Builders**: Use factory methods to create test data
4. **Page Object Model**: For E2E tests, use page objects
5. **Custom Matchers**: Create custom matchers for common assertions

### Performance Testing

1. **Load Testing**: Test system under expected load
2. **Stress Testing**: Test system beyond expected capacity
3. **Memory Usage**: Monitor memory usage during tests
4. **Database Performance**: Test database queries performance

### Security Testing

1. **Input Validation**: Test with malicious inputs
2. **Authentication**: Test unauthorized access attempts
3. **Authorization**: Test role-based access control
4. **Data Leakage**: Test for sensitive data exposure
5. **OWASP Top 10**: Test for common security vulnerabilities

## Debugging Tests

### Frontend Debugging

```bash
# Run specific test file
npm test LoginPage.test.tsx

# Run tests in debug mode
npm run test:debug

# Use browser debugger
# Add `debugger;` statement in test code
```

### Backend Debugging

```bash
# Run specific test
dotnet test --filter "GetAll_ReturnsAllEmployees"

# Run with detailed output
dotnet test --verbosity diagnostic

# Use Visual Studio debugger
# Set breakpoints and run in debug mode
```

### Common Issues

1. **Async Testing**: Make sure to await async operations
2. **State Cleanup**: Clean up state between tests
3. **Mock Verification**: Verify mocks are called correctly
4. **Timing Issues**: Use `waitFor` for async operations
5. **Database State**: Ensure database state is consistent

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [xUnit Documentation](https://xunit.net/)
- [FluentAssertions](https://fluentassertions.com/)
- [Moq Documentation](https://github.com/moq/moq)
- [ASP.NET Core Testing](https://docs.microsoft.com/en-us/aspnet/core/test/)

---

For more information about the Staff Management System, see the main [README.md](README.md).