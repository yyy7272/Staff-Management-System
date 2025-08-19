import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Bell } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { menuItems } from "./components/constants/menu-items";
import { MainContent } from "./components/MainContent";
import { CalendarWidget } from "./components/CalendarWidget";
import { NotificationWidget } from "./components/NotificationWidget";
import { QuickActionsWidget } from "./components/QuickActionsWidget";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/common";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import EmailVerifiedPage from "./components/pages/EmailVerifiedPage";
import { environment } from "./config/environment";
import "tailwindcss";
// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem(environment.TOKEN_STORAGE_KEY);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem(environment.TOKEN_STORAGE_KEY);
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// Dashboard Component (the main app layout)
const Dashboard: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState("home");
  const [autoOpenEmployeeCreate, setAutoOpenEmployeeCreate] = useState(false);
  const [autoOpenDepartmentCreate, setAutoOpenDepartmentCreate] = useState(false);
  
  // Get user from localStorage for permission checking
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };
  
  const user = getUserInfo();
  
  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    return menuItems.filter(item => {
      if (!item.restricted) return true; // Show non-restricted items to everyone
      
      // For restricted items (like payroll), check permissions
      if (item.id === 'payroll') {
        return user?.isAdministrator || 
               (user?.email && user.email.includes('@')) && 
               getDepartmentFromEmail(user.email) === 'hr';
      }
      
      return true; // Default: show item
    });
  };
  
  // Helper function to check if user is in HR department (simplified)
  const getDepartmentFromEmail = (email: string): string => {
    // This is a simplified check - in real implementation, 
    // you'd query the employee data to get department
    return 'other';
  };
  
  const filteredMenuItems = getFilteredMenuItems();
  const currentMenuItem = filteredMenuItems.find(item => item.id === activeMenu);

  const handleLogout = () => {
    localStorage.removeItem(environment.TOKEN_STORAGE_KEY);
    localStorage.removeItem(environment.REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleQuickAddEmployee = () => {
    setActiveMenu("employees");
    setAutoOpenEmployeeCreate(true);
    // Reset the flag after a brief delay to allow the component to mount
    setTimeout(() => setAutoOpenEmployeeCreate(false), 100);
  };

  const handleQuickAddDepartment = () => {
    setActiveMenu("organization");
    setAutoOpenDepartmentCreate(true);
    // Reset the flag after a brief delay to allow the component to mount
    setTimeout(() => setAutoOpenDepartmentCreate(false), 100);
  };

  return (
    <SidebarProvider>
        <div className="flex h-screen w-full">
        {/* Left Sidebar */}
        <Sidebar className="w-64">
          <SidebarHeader className="border-b p-4">
            <h2>Employee Management System</h2>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveMenu(item.id)}
                    isActive={activeMenu === item.id}
                    className="w-full justify-start gap-4 px-4 py-4 h-14 text-base"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-white h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                {currentMenuItem?.icon && <currentMenuItem.icon className="h-5 w-5" />}
                <h1>{currentMenuItem?.name}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Icon */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
              
              {/* User Identity & Logout */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">John Smith</p>
                  <p className="text-xs text-muted-foreground">System Administrator</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
            <div className="max-w-full">
              <MainContent 
                activeMenu={activeMenu} 
                setActiveMenu={setActiveMenu} 
                autoOpenEmployeeCreate={autoOpenEmployeeCreate}
                autoOpenDepartmentCreate={autoOpenDepartmentCreate}
                onQuickAddEmployee={handleQuickAddEmployee}
                onQuickAddDepartment={handleQuickAddDepartment}
              />
              
              {/* Bottom Widget Area - Only shown on homepage */}
              {activeMenu === "home" && (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-1">
                    <CalendarWidget />
                  </div>
                  <div className="lg:col-span-1">
                    <NotificationWidget />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
        </div>
        <Toaster />
      </SidebarProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes - redirect to dashboard if authenticated */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          
          {/* Email verification - accessible without auth */}
          <Route path="/email-verified" element={<EmailVerifiedPage />} />
          
          {/* Protected routes - require authentication */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}