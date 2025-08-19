import { Home, Building2, Users, Shield, FileCheck, DollarSign } from "lucide-react";

export const menuItems = [
  { id: "home", name: "Dashboard", icon: Home },
  { id: "organization", name: "Organization", icon: Building2 },
  { id: "employees", name: "Employees", icon: Users },
  { id: "payroll", name: "Payroll", icon: DollarSign, restricted: true }, // Only for admins/HR
  { id: "permissions", name: "Permissions", icon: Shield },
  { id: "approval", name: "Approvals", icon: FileCheck }
];