import { useMemo, useEffect } from "react";
import { Download, Trash2, Eye, Edit, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { StatisticsCards, DataTable, ConfirmationDialog, PageHeader, SearchFilterBar } from "../common";
import { EmployeeForm } from "../forms/EmployeeForm";
import { useEmployeeData, useCRUDDialogs } from "../../hooks";
import { getStatusBadge } from "../../utils/badges";
import type { Employee, TableColumn, TableAction, StatisticCardData } from "../../types/common";
import type { FilterConfig } from "../common/SearchFilterBar";
import type { EmployeeCreateRequest, EmployeeUpdateRequest } from "../../types/api";
import { STATUS_OPTIONS } from "../../constants/formConfigs";

interface EmployeesPageProps {
  autoOpenCreate?: boolean;
}

export function EmployeesPage({ autoOpenCreate }: EmployeesPageProps = {}) {
  const {
    employees,
    statistics,
    departments,
    departmentNames,
    filters,
    selectedEmployees,
    setFilters,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkDeleteEmployees,
    exportEmployees,
    handleSelectEmployee,
    handleSelectAll,
    isLoading
  } = useEmployeeData();

  const {
    isCreateOpen,
    isEditOpen,
    isViewOpen,
    isDeleteOpen,
    selectedItem: selectedEmployee,
    deleteTarget,
    openCreate,
    openEdit,
    openView,
    openDelete,
    closeCreate,
    closeEdit,
    closeView,
    closeDelete
  } = useCRUDDialogs<Employee>();

  // Auto-open create dialog when triggered from quick actions
  useEffect(() => {
    if (autoOpenCreate) {
      openCreate();
    }
  }, [autoOpenCreate, openCreate]);


  const statisticsData: StatisticCardData[] = useMemo(() => [
    {
      label: "Total Employees",
      value: statistics.total,
      icon: Users,
      trend: statistics.trends?.totalEmployeesTrend ? {
        value: statistics.trends.totalEmployeesTrend.text,
        isPositive: statistics.trends.totalEmployeesTrend.isPositive
      } : undefined
    },
    {
      label: "Active",
      value: statistics.active,
      icon: Users,
      color: "text-green-600"
    },
    {
      label: "On Leave",
      value: statistics.onLeave,
      icon: Users,
      color: "text-yellow-600"
    },
    {
      label: "Inactive",
      value: statistics.inactive,
      icon: Users,
      color: "text-red-600"
    }
  ], [statistics]);

  const columns: TableColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (employee) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.thumbnailImageUrl || employee.profileImageUrl || employee.avatar} />
            <AvatarFallback>
              {employee.name?.split(" ").map((n) => n[0]).join("") || "??"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{employee.name}</div>
            <div className="text-sm text-muted-foreground">{employee.email}</div>
          </div>
        </div>
      )
    },
    { key: 'position', header: 'Position' },
    { 
      key: 'department', 
      header: 'Department',
      render: (employee) => typeof employee.department === 'object' ? employee.department.name : employee.department
    },
    { key: 'hireDate', header: 'Hire Date' },
    {
      key: 'salary',
      header: 'Salary',
      render: (employee) => `$${employee.salary?.toLocaleString() || "Not specified"}`
    },
    {
      key: 'status',
      header: 'Status',
      render: (employee) => getStatusBadge(employee.status)
    }
  ];

  const actions: TableAction<Employee>[] = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (employee) => openView(employee)
    },
    {
      label: "Edit",
      icon: Edit,
      onClick: (employee) => openEdit(employee)
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "destructive",
      onClick: (employee) => openDelete(employee)
    }
  ];


  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    
    const success = await deleteEmployee(deleteTarget.id);
    if (success) {
      closeDelete();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.size === 0) {
      toast.error("Please select employees to delete");
      return;
    }

    const success = await bulkDeleteEmployees(Array.from(selectedEmployees));
    if (success) {
      // Selection is cleared in the hook
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'department',
      label: 'Department',
      placeholder: 'Department',
      options: departmentNames.map(dept => ({ value: dept, label: dept })),
      width: 'w-40'
    },
    {
      key: 'status',
      label: 'Status',
      placeholder: 'Status',
      options: STATUS_OPTIONS.slice(1) // Remove 'all' option as it's handled by SearchFilterBar
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Employee Management" 
        onAddClick={openCreate}
        addButtonLabel="Add Employee"
      >
        {selectedEmployees.size > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedEmployees.size})
          </Button>
        )}
        <Button variant="outline" onClick={() => exportEmployees()} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </PageHeader>

      <StatisticsCards statistics={statisticsData} />

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchValue={filters.search || ""}
            searchPlaceholder="Search employees by name, email, or position..."
            onSearchChange={(value) => setFilters({ ...filters, search: value })}
            filters={filterConfigs}
            filterValues={filters as Record<string, string>}
            onFilterChange={(key, value) => setFilters({ ...filters, [key]: value })}
            className="mb-6"
          />

          <DataTable
            data={employees}
            columns={columns}
            actions={actions}
            selectable
            selectedItems={selectedEmployees}
            onSelectItem={handleSelectEmployee}
            onSelectAll={handleSelectAll}
            loading={isLoading}
            emptyMessage="No employees found"
          />
        </CardContent>
      </Card>

      {/* View Employee Dialog */}
      <Dialog open={isViewOpen} onOpenChange={closeView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedEmployee.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedEmployee.name?.split(" ").map((n) => n[0]).join("") || "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedEmployee.name}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.position}</p>
                  <div className="mt-1">{getStatusBadge(selectedEmployee.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{selectedEmployee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <p>{typeof selectedEmployee.department === 'object' ? selectedEmployee.department.name : selectedEmployee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Hire Date</label>
                  <p>{selectedEmployee.hireDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Salary</label>
                  <p>${selectedEmployee.salary?.toLocaleString() || "Not specified"}</p>
                </div>
                {selectedEmployee.phone && (
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p>{selectedEmployee.phone}</p>
                  </div>
                )}
                {selectedEmployee.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <p>{selectedEmployee.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Employee Form */}
      <EmployeeForm
        isOpen={isCreateOpen}
        onClose={closeCreate}
        onSuccess={() => {}}
        mode="create"
        departments={departments}
        onSubmit={(data) => createEmployee(data as EmployeeCreateRequest)}
      />

      {/* Edit Employee Form */}
      <EmployeeForm
        isOpen={isEditOpen}
        onClose={closeEdit}
        onSuccess={() => {}}
        mode="edit"
        departments={departments}
        initialData={selectedEmployee ? {
          ...selectedEmployee,
          department: typeof selectedEmployee.department === 'object' ? selectedEmployee.department.id : selectedEmployee.department
        } : undefined}
        onSubmit={(data) => selectedEmployee ? updateEmployee(selectedEmployee.id, data as EmployeeUpdateRequest) : Promise.resolve({ success: false })}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={closeDelete}
        onConfirm={handleDeleteEmployee}
        title="Confirm Delete"
        itemName={deleteTarget?.name}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}