import React, { useState } from 'react';
import { FormDialog } from '../common';
import { APPROVAL_FORM_FIELDS } from '../../constants/formConfigs';
import type { ApprovalCreateRequest } from '../../types/api';
import type { FormErrors } from '../../types/common';

interface ApprovalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<ApprovalCreateRequest>;
  onSubmit: (data: ApprovalCreateRequest) => Promise<{ success: boolean; errors?: FormErrors<ApprovalCreateRequest> }>;
}

export function ApprovalForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  onSubmit
}: ApprovalFormProps) {
  const [formData, setFormData] = useState<ApprovalCreateRequest>({
    title: "",
    type: "leave",
    description: "",
    priority: "medium",
    ...initialData
  });
  const [formErrors, setFormErrors] = useState<FormErrors<ApprovalCreateRequest>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        type: "leave",
        description: "",
        priority: "medium",
        ...initialData
      });
      setFormErrors({});
    }
  }, [isOpen, initialData]);

  const handleFieldChange = (field: keyof ApprovalCreateRequest, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      type: "leave",
      description: "",
      priority: "medium"
    });
    setFormErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        onSuccess();
        handleClose();
      } else if (result.errors) {
        setFormErrors(result.errors);
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Request"
      fields={APPROVAL_FORM_FIELDS}
      data={formData}
      errors={formErrors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onFieldChange={handleFieldChange}
      submitLabel="Submit Request"
    />
  );
}