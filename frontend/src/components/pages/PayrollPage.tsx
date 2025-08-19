import { useState, useEffect, useMemo } from "react";
import { 
  Download, Trash2, Eye, Edit, DollarSign, AlertCircle, Plus, 
  Calculator, TrendingUp, Users, CreditCard, Calendar,
  FileText, BarChart3, Settings
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { StatisticsCards, DataTable, ConfirmationDialog, PageHeader, SearchFilterBar } from "../common";
import { useCRUDDialogs } from "../../hooks";
import { usePayrollData } from "../../hooks/usePayrollData";
import { getStatusBadge } from "../../utils/badges";
import { PayrollForm, type PayrollFormData } from "../forms";
import type { Payroll, TableColumn, TableAction, StatisticCardData } from "../../types/common";
import type { FilterConfig } from "../common/SearchFilterBar";

interface PayrollPageProps {
  autoOpenCreate?: boolean;
}

export function PayrollPage({ autoOpenCreate }: PayrollPageProps = {}) {
  const [accessDenied, setAccessDenied] = useState(false);
  
  const {
    payrolls,
    statistics,
    filters,
    selectedPayrolls,
    setFilters,
    createPayroll,
    updatePayroll,
    deletePayroll,
    updatePayrollStatus,
    handleSelectPayroll,
    handleSelectAll,
    isLoading,
    hasAccess
  } = usePayrollData();

  const {
    isCreateOpen,
    isEditOpen,
    isViewOpen,
    isDeleteOpen,
    selectedItem: selectedPayroll,
    deleteTarget,
    openCreate,
    openEdit,
    openView,
    openDelete,
    closeCreate,
    closeEdit,
    closeView,
    closeDelete
  } = useCRUDDialogs<Payroll>();

  // Check access on component mount
  useEffect(() => {
    if (!hasAccess && !isLoading) {
      setAccessDenied(true);
    }
  }, [hasAccess, isLoading]);

  // Auto-open create dialog when triggered
  useEffect(() => {
    if (autoOpenCreate && hasAccess) {
      openCreate();
    }
  }, [autoOpenCreate, hasAccess, openCreate]);

  // If access is denied, show unauthorized message
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
                <p className="text-sm text-gray-600 mt-2">
                  You don't have permission to access the payroll system. 
                  Only administrators and HR personnel can view payroll information.
                </p>
              </div>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statisticsData: StatisticCardData[] = useMemo(() => [
    {
      label: "Total Payroll",
      value: `$${statistics.totalPayroll.toLocaleString()}`,
      icon: DollarSign,
      trend: statistics.trends?.totalPayrollTrend ? {
        value: statistics.trends.totalPayrollTrend.text,
        isPositive: statistics.trends.totalPayrollTrend.isPositive
      } : undefined,
      color: "text-green-600"
    },
    {
      label: "Average Salary",
      value: `$${Math.round(statistics.averagePayroll).toLocaleString()}`,
      icon: TrendingUp,
      trend: statistics.trends?.averagePayrollTrend ? {
        value: statistics.trends.averagePayrollTrend.text,
        isPositive: statistics.trends.averagePayrollTrend.isPositive
      } : undefined,
      color: "text-blue-600"
    },
    {
      label: "Total Records",
      value: statistics.totalRecords,
      icon: Users,
      trend: statistics.trends?.totalRecordsTrend ? {
        value: statistics.trends.totalRecordsTrend.text,
        isPositive: statistics.trends.totalRecordsTrend.isPositive
      } : undefined,
      color: "text-purple-600"
    },
    {
      label: "Pending Payment",
      value: statistics.processedRecords,
      icon: CreditCard,
      trend: statistics.trends?.processedRecordsTrend ? {
        value: statistics.trends.processedRecordsTrend.text,
        isPositive: statistics.trends.processedRecordsTrend.isPositive
      } : undefined,
      color: "text-orange-600"
    }
  ], [statistics]);

  const payrollStatusData = useMemo(() => [
    {
      label: "Draft",
      value: statistics.draftRecords,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    {
      label: "Processed",
      value: statistics.processedRecords,
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      label: "Paid",
      value: statistics.paidRecords,
      color: "bg-green-100 text-green-800 border-green-200"
    }
  ], [statistics]);

  const columns: TableColumn<Payroll>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (payroll) => (
        <div>
          <div className="font-medium">{payroll.employee.name}</div>
          <div className="text-sm text-muted-foreground">{payroll.employee.department}</div>
        </div>
      )
    },
    {
      key: 'payPeriod',
      header: 'Pay Period',
      render: (payroll) => (
        <div className="text-sm">
          <div>{new Date(payroll.payPeriodStart).toLocaleDateString()}</div>
          <div className="text-muted-foreground">
            to {new Date(payroll.payPeriodEnd).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: 'baseSalary',
      header: 'Base Salary',
      render: (payroll) => `$${payroll.baseSalary.toLocaleString()}`
    },
    {
      key: 'netPay',
      header: 'Net Pay',
      render: (payroll) => (
        <div className="font-medium text-green-600">
          ${payroll.netPay.toLocaleString()}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (payroll) => getStatusBadge(payroll.status)
    },
    {
      key: 'processedAt',
      header: 'Processed',
      render: (payroll) => (
        <div className="text-sm">
          {payroll.processedAt ? (
            <>
              <div>{new Date(payroll.processedAt).toLocaleDateString()}</div>
              <div className="text-muted-foreground">by {payroll.processedBy}</div>
            </>
          ) : (
            <span className="text-muted-foreground">Not processed</span>
          )}
        </div>
      )
    }
  ];

  const actions: TableAction<Payroll>[] = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (payroll) => openView(payroll)
    },
    {
      label: "Edit",
      icon: Edit,
      onClick: (payroll) => openEdit(payroll),
      disabled: (payroll) => payroll.status === "paid"
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "destructive",
      onClick: (payroll) => openDelete(payroll),
      disabled: (payroll) => payroll.status !== "draft"
    }
  ];

  const handleCreatePayroll = async (formData: PayrollFormData) => {
    const payrollData = {
      ...formData,
      netPay: formData.baseSalary + formData.overtime + formData.bonus - formData.deductions - formData.taxWithholding
    };
    
    const result = await createPayroll(payrollData);
    if (result.success) {
      closeCreate();
    }
  };

  const handleEditPayroll = async (formData: PayrollFormData) => {
    if (!selectedPayroll) return;
    
    const payrollData = {
      ...formData,
      netPay: formData.baseSalary + formData.overtime + formData.bonus - formData.deductions - formData.taxWithholding
    };
    
    const result = await updatePayroll(selectedPayroll.id, payrollData);
    if (result.success) {
      closeEdit();
    }
  };

  const handleDeletePayroll = async () => {
    if (!deleteTarget) return;
    
    const success = await deletePayroll(deleteTarget.id);
    if (success) {
      closeDelete();
    }
  };

  const handleStatusUpdate = async (payrollId: string, newStatus: string) => {
    const success = await updatePayrollStatus(payrollId, newStatus);
    if (success) {
      toast.success(`Payroll status updated to ${newStatus}`);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      placeholder: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'processed', label: 'Processed' },
        { value: 'paid', label: 'Paid' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payroll Management" 
        description="Manage employee payroll records, process payments, and view salary statistics"
        onAddClick={openCreate}
        addButtonLabel="Add Payroll Record"
      >
        <div className="flex gap-2">
          {selectedPayrolls.size > 0 && (
            <Button variant="destructive" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedPayrolls.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => {}} className="gap-2">
            <Calculator className="h-4 w-4" />
            Generate Payroll
          </Button>
          <Button variant="outline" onClick={() => {}} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </PageHeader>


      {/* Payroll Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Payroll Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {payrollStatusData.map((status, index) => (
              <div key={index} className={`px-6 py-4 rounded-lg border ${status.color}`}>
                <div className="text-sm font-medium">{status.label}</div>
                <div className="text-2xl font-bold">{status.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Payroll Records
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payroll Records</span>
                <div className="flex items-center gap-2">
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SearchFilterBar
                searchValue={filters.search || ""}
                searchPlaceholder="Search by employee name, email, or department..."
                onSearchChange={(value) => setFilters({ ...filters, search: value })}
                filters={filterConfigs}
                filterValues={filters as Record<string, string>}
                onFilterChange={(key, value) => setFilters({ ...filters, [key]: value })}
                className="mb-6"
              />

              <DataTable
                data={payrolls}
                columns={columns}
                actions={actions}
                selectable
                selectedItems={selectedPayrolls}
                onSelectItem={handleSelectPayroll}
                onSelectAll={handleSelectAll}
                loading={isLoading}
                emptyMessage={
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No payroll records found</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Get started by creating your first payroll record or generating payroll for all employees.
                    </p>
                    <Button onClick={openCreate} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Payroll Record
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => toast.info("This function will be available soon")}>
                  <Calendar className="h-6 w-6" />
                  Monthly Report
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => toast.info("This function will be available soon")}>
                  <Users className="h-6 w-6" />
                  Employee Summary
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => toast.info("This function will be available soon")}>
                  <TrendingUp className="h-6 w-6" />
                  Salary Analysis
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => toast.info("This function will be available soon")}>
                  <DollarSign className="h-6 w-6" />
                  Tax Summary
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => toast.info("This function will be available soon")}>
                  <BarChart3 className="h-6 w-6" />
                  Department Costs
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => toast.info("This function will be available soon")}>
                  <FileText className="h-6 w-6" />
                  Custom Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Payroll settings configuration will be available in a future update.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Payroll Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={closeCreate}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Payroll Record</DialogTitle>
          </DialogHeader>
          <PayrollForm
            onSubmit={handleCreatePayroll}
            onCancel={closeCreate}
            isSubmitting={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Payroll Dialog */}
      <Dialog open={isEditOpen} onOpenChange={closeEdit}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll Record</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <PayrollForm
              payroll={selectedPayroll}
              onSubmit={handleEditPayroll}
              onCancel={closeEdit}
              isSubmitting={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Payroll Dialog */}
      <Dialog open={isViewOpen} onOpenChange={closeView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Employee</label>
                  <p>{selectedPayroll.employee.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayroll.employee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedPayroll.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pay Period Start</label>
                  <p>{new Date(selectedPayroll.payPeriodStart).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Pay Period End</label>
                  <p>{new Date(selectedPayroll.payPeriodEnd).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Base Salary</label>
                  <p>${selectedPayroll.baseSalary.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Overtime</label>
                  <p>${selectedPayroll.overtime.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Bonus</label>
                  <p>${selectedPayroll.bonus.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Deductions</label>
                  <p>${selectedPayroll.deductions.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tax Withholding</label>
                  <p>${selectedPayroll.taxWithholding.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-600">Net Pay</label>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedPayroll.netPay.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedPayroll.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm">{selectedPayroll.notes}</p>
                </div>
              )}

              {selectedPayroll.status !== "draft" && (
                <Alert>
                  <AlertDescription>
                    This payroll record was processed on{" "}
                    {new Date(selectedPayroll.processedAt!).toLocaleDateString()} by{" "}
                    {selectedPayroll.processedBy}.
                  </AlertDescription>
                </Alert>
              )}

              {selectedPayroll.status === "draft" && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleStatusUpdate(selectedPayroll.id, "processed")}
                    variant="outline"
                  >
                    Mark as Processed
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate(selectedPayroll.id, "paid")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Paid
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={closeDelete}
        onConfirm={handleDeletePayroll}
        title="Confirm Delete"
        itemName={deleteTarget?.employee.name}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}