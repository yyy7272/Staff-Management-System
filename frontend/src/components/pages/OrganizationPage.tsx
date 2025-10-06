import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Collapsible, CollapsibleContent } from "../ui/collapsible";
import { ConfirmationDialog } from "../common";
import { useDepartmentData } from "../../hooks";
import { DepartmentForm } from "../forms";
import { PageHeader } from "../common";
import { useCRUDDialogs } from "../../hooks";
import type { Department } from "../../types/common";
import type { DepartmentCreateRequest, DepartmentUpdateRequest } from "../../types/api";
import "tailwindcss";




interface OrganizationPageProps {
  autoOpenCreate?: boolean;
}

export function OrganizationPage({ autoOpenCreate }: OrganizationPageProps = {}) {
  const { departments, createDepartment, updateDepartment, deleteDepartment } = useDepartmentData();
  const { isCreateOpen, isEditOpen, selectedItem, openCreate, openEdit, closeCreate, closeEdit } = useCRUDDialogs<Department>();
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  // Auto-open create dialog when triggered from quick actions
  useEffect(() => {
    if (autoOpenCreate) {
      openCreate();
    }
  }, [autoOpenCreate, openCreate]);

  const allDepartments = useMemo(() => {
    const flattenDepts = (depts: Department[]): Department[] => {
      return depts.reduce((acc, dept) => {
        acc.push(dept);
        if (dept.children) {
          acc.push(...flattenDepts(dept.children));
        }
        return acc;
      }, [] as Department[]);
    };
    return flattenDepts(departments);
  }, [departments]);

  const statistics = useMemo(() => {
    const totalDepts = allDepartments.length;
    const parentDepts = departments.length;
    const childDepts = allDepartments.filter(d => d.parentId).length;
    const totalEmployees = allDepartments.reduce((sum, dept) => sum + dept.employeeCount, 0);
    
    return { totalDepts, parentDepts, childDepts, totalEmployees };
  }, [allDepartments, departments]);

  const toggleDepartment = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };



  const handleCreateDepartment = async (data: DepartmentCreateRequest) => {
    const result = await createDepartment(data);
    if (result.success) {
      closeCreate();
    }
    return result;
  };

  const handleUpdateDepartment = async (data: DepartmentUpdateRequest) => {
    if (!selectedItem) return { success: false };
    const result = await updateDepartment(selectedItem.id, data);
    if (result.success) {
      closeEdit();
    }
    return result;
  };

  const handleDeleteDepartment = async (department: Department) => {
    await deleteDepartment(department.id);
    setDeleteTarget(null);
  };

  const handleAddSubDepartment = (parentDept: Department) => {
    openCreate({ parentId: parentDept.id });
  };

  const handleEditClick = (department: Department) => {
    openEdit(department);
  };

  const DepartmentItem = ({ dept, level = 0 }: { dept: Department; level?: number }) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expandedDepts.has(dept.id);

    return (
      <div className="w-full">
        <div className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 ${level > 0 ? 'ml-6 border-l-2 border-gray-200' : ''}`}>
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleDepartment(dept.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            
            <Building2 className={`h-4 w-4 ${level === 0 ? 'text-blue-600' : 'text-gray-500'}`} />
            <div>
              <span className={level === 0 ? 'font-medium' : ''}>{dept.name}</span>
              {dept.manager && (
                <div className="text-xs text-muted-foreground">Manager: {dept.manager}</div>
              )}
              <div className="text-xs text-muted-foreground">users: {dept.employeeCount}</div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddSubDepartment(dept)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-department
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditClick(dept)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Department
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteTarget(dept)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && (
          <Collapsible open={isExpanded}>
            <CollapsibleContent className="mt-1">
              {dept.children?.map((child) => (
                <DepartmentItem key={child.id} dept={child} level={level + 1} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Organization Management">
        <Button className="gap-2" onClick={() => openCreate()}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </PageHeader>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statistics.totalDepts}</div>
            <p className="text-muted-foreground">Total Departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statistics.parentDepts}</div>
            <p className="text-muted-foreground">Top-level Departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statistics.childDepts}</div>
            <p className="text-muted-foreground">Sub-departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statistics.totalEmployees}</div>
            <p className="text-muted-foreground">Total users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {departments.map((dept) => (
            <DepartmentItem key={dept.id} dept={dept} />
          ))}
        </CardContent>
      </Card>

      <DepartmentForm
        isOpen={isCreateOpen}
        onClose={closeCreate}
        onSuccess={() => {}}
        mode="create"
        onSubmit={(data) => handleCreateDepartment(data as DepartmentCreateRequest)}
      />

      <DepartmentForm
        isOpen={isEditOpen}
        onClose={closeEdit}
        onSuccess={() => {}}
        mode="edit"
        initialData={selectedItem ? {
          name: selectedItem.name,
          description: selectedItem.description,
          manager: selectedItem.manager,
          parentId: selectedItem.parentId
        } : undefined}
        onSubmit={(data) => handleUpdateDepartment(data as DepartmentUpdateRequest)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteDepartment(deleteTarget)}
        title="Confirm Delete"
        description={
          deleteTarget?.children && deleteTarget.children.length > 0 
            ? `Are you sure you want to delete department "${deleteTarget?.name}"? This department contains ${deleteTarget.children.length} sub-departments, which will also be deleted. This action cannot be undone.`
            : `Are you sure you want to delete department "${deleteTarget?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}