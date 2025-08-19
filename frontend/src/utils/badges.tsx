import { Badge } from "../components/ui/badge";

export const getStatusBadge = (status: string) => {
  const variants = {
    active: { 
      variant: "secondary" as const, 
      label: "Active", 
      className: "bg-green-100 text-green-800" 
    },
    inactive: { 
      variant: "secondary" as const, 
      label: "Inactive", 
      className: "bg-red-100 text-red-800" 
    },
    "on-leave": { 
      variant: "secondary" as const, 
      label: "On Leave", 
      className: "bg-yellow-100 text-yellow-800" 
    },
    pending: { 
      variant: "secondary" as const, 
      label: "Pending", 
      className: "bg-yellow-100 text-yellow-800" 
    },
    approved: { 
      variant: "secondary" as const, 
      label: "Approved", 
      className: "bg-green-100 text-green-800" 
    },
    rejected: { 
      variant: "secondary" as const, 
      label: "Rejected", 
      className: "bg-red-100 text-red-800" 
    },
    cancelled: { 
      variant: "secondary" as const, 
      label: "Cancelled", 
      className: "bg-gray-100 text-gray-800" 
    }
  };

  const config = variants[status as keyof typeof variants];
  if (!config) {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

export const getPriorityBadge = (priority: string) => {
  const variants = {
    low: { 
      variant: "secondary" as const, 
      label: "Low", 
      className: "bg-gray-100 text-gray-800" 
    },
    medium: { 
      variant: "secondary" as const, 
      label: "Medium", 
      className: "bg-blue-100 text-blue-800" 
    },
    high: { 
      variant: "secondary" as const, 
      label: "High", 
      className: "bg-orange-100 text-orange-800" 
    },
    urgent: { 
      variant: "secondary" as const, 
      label: "Urgent", 
      className: "bg-red-100 text-red-800" 
    }
  };

  const config = variants[priority as keyof typeof variants];
  if (!config) {
    return <Badge variant="secondary">{priority}</Badge>;
  }

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

export const getPermissionTypeBadge = (type: string) => {
  const variants = {
    read: { 
      variant: "secondary" as const, 
      label: "Read", 
      className: "bg-blue-100 text-blue-800" 
    },
    write: { 
      variant: "secondary" as const, 
      label: "Write", 
      className: "bg-orange-100 text-orange-800" 
    },
    delete: { 
      variant: "secondary" as const, 
      label: "Delete", 
      className: "bg-red-100 text-red-800" 
    },
    admin: { 
      variant: "secondary" as const, 
      label: "Admin", 
      className: "bg-purple-100 text-purple-800" 
    }
  };

  const config = variants[type as keyof typeof variants];
  if (!config) {
    return <Badge variant="secondary">{type}</Badge>;
  }

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};