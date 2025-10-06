import React from 'react';
import { FormDialog } from '../common';
import { useEntityForm } from '../../hooks';
import { DEPARTMENT_FORM_FIELDS } from '../../constants/formConfigs';
import type { DepartmentCreateRequest, DepartmentUpdateRequest } from '../../types/api';
import type { FormErrors } from '../../types/common';

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: Partial<DepartmentCreateRequest>;
  onSubmit: (data: DepartmentCreateRequest | DepartmentUpdateRequest) => Promise<{ success: boolean; errors?: FormErrors<DepartmentCreateRequest | DepartmentUpdateRequest> }>;
}

export function DepartmentForm({
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData,
  onSubmit
}: DepartmentFormProps) {
  const {
    formData,
    formErrors,
    isSubmitting,
    handleFieldChange,
    resetForm,
    populateForm
  } = useEntityForm<DepartmentCreateRequest>({
    initialData: {
      name: "",
      description: "",
      manager: "",
      parentId: "",
      ...initialData
    },
    onSubmit,
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    }
  });

  React.useEffect(() => {
    if (isOpen && initialData && mode === 'edit') {
      populateForm(initialData);
    } else if (isOpen && mode === 'create') {
      resetForm();
    }
  }, [isOpen, mode, initialData, populateForm, resetForm]);

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async () => {
    const result = await onSubmit(formData);
    if (result.success) {
      onSuccess();
      handleClose();
    }
    return result;
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Add New Department' : 'Edit Department'}
      fields={DEPARTMENT_FORM_FIELDS}
      data={formData}
      errors={formErrors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onFieldChange={handleFieldChange}
      submitLabel={mode === 'create' ? 'Add Department' : 'Update Department'}
    />
  );
}