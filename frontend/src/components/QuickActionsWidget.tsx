import { Plus, FileText, Users, Building2, Settings, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

export function QuickActionsWidget() {
  const quickActions = [
    {
      id: "add-employee",
      title: "Add Employee",
      description: "Add new employee to the system",
      icon: Plus,
      color: "text-green-600"
    },
    {
      id: "process-approval",
      title: "Process Approvals",
      description: "Review pending approval requests",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      id: "manage-departments",
      title: "Manage Departments",
      description: "Organize department structure",
      icon: Building2,
      color: "text-purple-600"
    },
    {
      id: "user-permissions",
      title: "User Permissions",
      description: "Manage user roles and access",
      icon: Users,
      color: "text-orange-600"
    },
    {
      id: "payroll-processing",
      title: "Payroll Processing",
      description: "Generate and manage payroll",
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      id: "system-settings",
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      color: "text-gray-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => (
          <Button 
            key={action.id}
            variant="outline" 
            className="w-full justify-start h-auto p-3"
          >
            <action.icon className={`h-4 w-4 mr-3 ${action.color}`} />
            <div className="text-left">
              <div className="font-medium">{action.title}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}