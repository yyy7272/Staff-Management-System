import { HomePage } from "./pages/HomePage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { PayrollPage } from "./pages/PayrollPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { ApprovalPage } from "./pages/ApprovalPage";


interface MainContentProps {
  activeMenu: string;
  setActiveMenu?: (menu: string) => void;
  autoOpenEmployeeCreate?: boolean;
  autoOpenDepartmentCreate?: boolean;
  onQuickAddEmployee?: () => void;
  onQuickAddDepartment?: () => void;
}

export function MainContent({ activeMenu, setActiveMenu, autoOpenEmployeeCreate, autoOpenDepartmentCreate, onQuickAddEmployee, onQuickAddDepartment }: MainContentProps) {
  // Keep components mounted but hidden to preserve state
  const isActive = (page: string) => activeMenu === page;
  const defaultToHome = !['home', 'organization', 'employees', 'payroll', 'permissions', 'approval'].includes(activeMenu);

  return (
    <>
      <div style={{ display: isActive('home') || defaultToHome ? 'block' : 'none' }}>
        <HomePage setActiveMenu={setActiveMenu} onQuickAddEmployee={onQuickAddEmployee} onQuickAddDepartment={onQuickAddDepartment} />
      </div>
      <div style={{ display: isActive('organization') ? 'block' : 'none' }}>
        <OrganizationPage autoOpenCreate={autoOpenDepartmentCreate} />
      </div>
      <div style={{ display: isActive('employees') ? 'block' : 'none' }}>
        <EmployeesPage autoOpenCreate={autoOpenEmployeeCreate} />
      </div>
      <div style={{ display: isActive('payroll') ? 'block' : 'none' }}>
        <PayrollPage />
      </div>
      <div style={{ display: isActive('permissions') ? 'block' : 'none' }}>
        <PermissionsPage />
      </div>
      <div style={{ display: isActive('approval') ? 'block' : 'none' }}>
        <ApprovalPage />
      </div>
    </>
  );
}