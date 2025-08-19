import type { FormFieldConfig } from '../types/common';

const DEPARTMENT_OPTIONS = [
  { value: "Technology", label: "Technology" },
  { value: "Marketing", label: "Marketing" },
  { value: "Finance", label: "Finance" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Operations", label: "Operations" },
  { value: "Sales", label: "Sales" },
  { value: "Customer Service", label: "Customer Service" }
];

export const EMPLOYEE_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'Enter full name',
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'Enter email address',
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  {
    name: 'position',
    label: 'Job Position',
    type: 'text',
    required: true,
    placeholder: 'Enter job position',
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    name: 'department',
    label: 'Department',
    type: 'select',
    required: true,
    placeholder: 'Select department',
    options: DEPARTMENT_OPTIONS
  },
  {
    name: 'hireDate',
    label: 'Hire Date',
    type: 'date',
    required: true
  },
  {
    name: 'salary',
    label: 'Annual Salary',
    type: 'number',
    required: true,
    placeholder: 'Enter annual salary',
    validation: {
      min: 0
    }
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'text',
    placeholder: 'Enter phone number',
    validation: {
      pattern: /^[+]?[1-9][\d]{0,15}$/,
      minLength: 10
    }
  },
  {
    name: 'address',
    label: 'Address',
    type: 'text',
    placeholder: 'Enter address'
  }
];


export const DEPARTMENT_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: 'name',
    label: 'Department Name',
    type: 'text',
    required: true,
    placeholder: 'Enter department name',
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    name: 'manager',
    label: 'Manager',
    type: 'text',
    required: true,
    placeholder: 'Enter manager name',
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Enter department description',
    validation: {
      maxLength: 500
    }
  }
];

export const APPROVAL_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: 'title',
    label: 'Request Title',
    type: 'text',
    required: true,
    placeholder: 'Enter request title',
    validation: {
      minLength: 3,
      maxLength: 200
    }
  },
  {
    name: 'type',
    label: 'Request Type',
    type: 'select',
    required: true,
    placeholder: 'Select request type',
    options: [
      { value: 'leave', label: 'Leave Request' },
      { value: 'expense', label: 'Expense Reimbursement' },
      { value: 'purchase', label: 'Purchase Request' },
      { value: 'other', label: 'Other Request' }
    ]
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'radio',
    required: true,
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ]
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Please provide detailed description and relevant information',
    validation: {
      minLength: 5,
      maxLength: 1000
    }
  }
];

export const ROLE_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: 'name',
    label: 'Role Name',
    type: 'text',
    required: true,
    placeholder: 'Enter role name',
    validation: {
      minLength: 3,
      maxLength: 100
    }
  },
  {
    name: 'description',
    label: 'Role Description',
    type: 'textarea',
    required: true,
    placeholder: 'Enter role description',
    validation: {
      minLength: 10,
      maxLength: 500
    }
  }
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on-leave', label: 'On Leave' }
];

export const APPROVAL_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'leave', label: 'Leave' },
  { value: 'expense', label: 'Expense' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'other', label: 'Other' }
];

export const APPROVAL_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];