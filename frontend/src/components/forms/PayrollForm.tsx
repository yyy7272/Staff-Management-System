import { useState, useEffect } from "react";
import { useEmployeeData } from "../../hooks";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import type { Payroll } from "../../types/common";

interface PayrollFormProps {
  payroll?: Payroll;
  onSubmit: (data: PayrollFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface PayrollFormData {
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  taxWithholding: number;
  notes?: string;
}

export function PayrollForm({ payroll, onSubmit, onCancel, isSubmitting = false }: PayrollFormProps) {
  const { employees, isLoading: employeesLoading, loadingState: employeeLoadingState } = useEmployeeData();
  const [formData, setFormData] = useState<PayrollFormData>({
    employeeId: payroll?.employeeId || "",
    payPeriodStart: payroll?.payPeriodStart ? payroll.payPeriodStart.split('T')[0] : "",
    payPeriodEnd: payroll?.payPeriodEnd ? payroll.payPeriodEnd.split('T')[0] : "",
    baseSalary: payroll?.baseSalary || 0,
    overtime: payroll?.overtime || 0,
    bonus: payroll?.bonus || 0,
    deductions: payroll?.deductions || 0,
    taxWithholding: payroll?.taxWithholding || 0,
    notes: payroll?.notes || ""
  });

  const [errors, setErrors] = useState<Partial<PayrollFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PayrollFormData> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = "Employee is required";
    }

    if (!formData.payPeriodStart) {
      newErrors.payPeriodStart = "Pay period start date is required";
    }

    if (!formData.payPeriodEnd) {
      newErrors.payPeriodEnd = "Pay period end date is required";
    }

    if (formData.payPeriodStart && formData.payPeriodEnd && formData.payPeriodStart >= formData.payPeriodEnd) {
      newErrors.payPeriodEnd = "End date must be after start date";
    }

    if (formData.baseSalary < 0) {
      newErrors.baseSalary = "Base salary cannot be negative";
    }

    if (formData.overtime < 0) {
      newErrors.overtime = "Overtime cannot be negative";
    }

    if (formData.bonus < 0) {
      newErrors.bonus = "Bonus cannot be negative";
    }

    if (formData.deductions < 0) {
      newErrors.deductions = "Deductions cannot be negative";
    }

    if (formData.taxWithholding < 0) {
      newErrors.taxWithholding = "Tax withholding cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof PayrollFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Calculate net pay automatically
  const netPay = formData.baseSalary + formData.overtime + formData.bonus - formData.deductions - formData.taxWithholding;

  // Auto-populate employee salary when employee is selected
  useEffect(() => {
    if (formData.employeeId && !payroll) {
      const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
      if (selectedEmployee && selectedEmployee.salary) {
        setFormData(prev => ({ ...prev, baseSalary: selectedEmployee.salary }));
      }
    }
  }, [formData.employeeId, employees, payroll]);

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Loading employees...</div>
        </div>
      </div>
    );
  }

  // Show error state if employees failed to load
  if (employeeLoadingState === 'error' || (employees.length === 0 && !employeesLoading)) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load employee data. You may not have permission to access employee information, 
            or there may be a network issue. Please contact your administrator if this persists.
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee *</Label>
          <Select 
            value={formData.employeeId} 
            onValueChange={(value) => handleInputChange('employeeId', value)}
            disabled={!!payroll} // Don't allow changing employee for existing payroll
          >
            <SelectTrigger className={errors.employeeId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name} - {typeof employee.department === 'string' ? employee.department : employee.department?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employeeId && <p className="text-sm text-red-500">{errors.employeeId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payPeriodStart">Pay Period Start *</Label>
          <Input
            type="date"
            id="payPeriodStart"
            value={formData.payPeriodStart}
            onChange={(e) => handleInputChange('payPeriodStart', e.target.value)}
            className={errors.payPeriodStart ? "border-red-500" : ""}
          />
          {errors.payPeriodStart && <p className="text-sm text-red-500">{errors.payPeriodStart}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payPeriodEnd">Pay Period End *</Label>
          <Input
            type="date"
            id="payPeriodEnd"
            value={formData.payPeriodEnd}
            onChange={(e) => handleInputChange('payPeriodEnd', e.target.value)}
            className={errors.payPeriodEnd ? "border-red-500" : ""}
          />
          {errors.payPeriodEnd && <p className="text-sm text-red-500">{errors.payPeriodEnd}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseSalary">Base Salary *</Label>
          <Input
            type="number"
            id="baseSalary"
            min="0"
            step="0.01"
            value={formData.baseSalary}
            onChange={(e) => handleInputChange('baseSalary', parseFloat(e.target.value) || 0)}
            className={errors.baseSalary ? "border-red-500" : ""}
          />
          {errors.baseSalary && <p className="text-sm text-red-500">{errors.baseSalary}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="overtime">Overtime Pay</Label>
          <Input
            type="number"
            id="overtime"
            min="0"
            step="0.01"
            value={formData.overtime}
            onChange={(e) => handleInputChange('overtime', parseFloat(e.target.value) || 0)}
            className={errors.overtime ? "border-red-500" : ""}
          />
          {errors.overtime && <p className="text-sm text-red-500">{errors.overtime}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bonus">Bonus</Label>
          <Input
            type="number"
            id="bonus"
            min="0"
            step="0.01"
            value={formData.bonus}
            onChange={(e) => handleInputChange('bonus', parseFloat(e.target.value) || 0)}
            className={errors.bonus ? "border-red-500" : ""}
          />
          {errors.bonus && <p className="text-sm text-red-500">{errors.bonus}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deductions">Deductions</Label>
          <Input
            type="number"
            id="deductions"
            min="0"
            step="0.01"
            value={formData.deductions}
            onChange={(e) => handleInputChange('deductions', parseFloat(e.target.value) || 0)}
            className={errors.deductions ? "border-red-500" : ""}
          />
          {errors.deductions && <p className="text-sm text-red-500">{errors.deductions}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxWithholding">Tax Withholding</Label>
          <Input
            type="number"
            id="taxWithholding"
            min="0"
            step="0.01"
            value={formData.taxWithholding}
            onChange={(e) => handleInputChange('taxWithholding', parseFloat(e.target.value) || 0)}
            className={errors.taxWithholding ? "border-red-500" : ""}
          />
          {errors.taxWithholding && <p className="text-sm text-red-500">{errors.taxWithholding}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Additional notes or comments..."
          rows={3}
        />
      </div>

      {/* Net Pay Display */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex justify-between items-center">
            <span>Calculated Net Pay:</span>
            <span className="font-semibold text-green-600">${netPay.toLocaleString()}</span>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : payroll ? "Update Payroll" : "Create Payroll"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}