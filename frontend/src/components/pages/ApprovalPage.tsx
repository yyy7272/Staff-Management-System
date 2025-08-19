import { useState, useMemo } from "react";
import { Clock, CheckCircle, XCircle, FileText, Plus, Eye, Check, X, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { StatisticsCards, DataTable } from "../common";
import { ApprovalForm } from "../forms";
import { useApprovalData } from "../../hooks";
import { getStatusBadge, getPriorityBadge } from "../../utils/badges";
import type { ApprovalItem, TableColumn, TableAction, StatisticCardData } from "../../types/common";
import { APPROVAL_TYPE_OPTIONS, APPROVAL_STATUS_OPTIONS, PRIORITY_OPTIONS } from "../../constants/formConfigs";

export function ApprovalPage() {
  const {
    approvals,
    pendingApprovals,
    myApprovals,
    statistics,
    filters,
    setFilters,
    createApproval,
    processApprovalAction,
    cancelApproval,
    fetchApprovals,
    getTypeLabel,
    isLoading
  } = useApprovalData();

  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<{item: ApprovalItem, action: "approve" | "reject"} | null>(null);
  const [approvalReason, setApprovalReason] = useState("");

  const statisticsData: StatisticCardData[] = useMemo(() => [
    {
      label: "Pending Approval",
      value: statistics.pending,
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      label: "Approved",
      value: statistics.approved,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      label: "Rejected",
      value: statistics.rejected,
      icon: XCircle,
      color: "text-red-600"
    },
    {
      label: "My Requests",
      value: statistics.myTotal,
      icon: FileText,
      color: "text-blue-600"
    }
  ], [statistics]);

  const pendingColumns: TableColumn<ApprovalItem>[] = [
    {
      key: 'title',
      header: 'Request',
      render: (approval) => (
        <div>
          <div className="font-medium">{approval.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">
            {approval.description}
          </div>
        </div>
      )
    },
    {
      key: 'applicant',
      header: 'Applicant',
      render: (approval) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={approval.applicant.avatar} />
            <AvatarFallback className="text-xs">
              {approval.applicant.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{approval.applicant.name}</div>
            <div className="text-xs text-muted-foreground">
              {approval.applicant.department}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (approval) => getTypeLabel(approval.type)
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (approval) => getPriorityBadge(approval.priority)
    },
    { key: 'submitDate', header: 'Submitted' }
  ];

  const pendingActions: TableAction<ApprovalItem>[] = [
    {
      label: "View",
      icon: Eye,
      onClick: (approval) => handleViewApproval(approval)
    },
    {
      label: "Approve",
      icon: Check,
      onClick: (approval) => handleQuickApproval(approval, "approve")
    },
    {
      label: "Reject",
      icon: X,
      variant: "destructive",
      onClick: (approval) => handleQuickApproval(approval, "reject")
    }
  ];

  const allColumns: TableColumn<ApprovalItem>[] = [
    ...pendingColumns,
    {
      key: 'status',
      header: 'Status',
      render: (approval) => getStatusBadge(approval.status)
    }
  ];

  const allActions: TableAction<ApprovalItem>[] = [
    {
      label: "View",
      icon: Eye,
      onClick: (approval) => handleViewApproval(approval)
    }
  ];

  const myActions: TableAction<ApprovalItem>[] = [
    {
      label: "View",
      icon: Eye,
      onClick: (approval) => handleViewApproval(approval)
    },
    {
      label: "Cancel",
      icon: X,
      variant: "destructive",
      disabled: (approval) => approval.status !== "pending",
      onClick: (approval) => handleCancelApproval(approval)
    }
  ];


  const handleApprovalAction = async (approval: ApprovalItem, action: "approve" | "reject", reason?: string) => {
    const success = await processApprovalAction(approval.id, { action, reason });
    if (success) {
      setApprovalAction(null);
      setApprovalReason("");
    }
  };

  const handleQuickApproval = async (approval: ApprovalItem, action: "approve" | "reject") => {
    setApprovalAction({ item: approval, action });
  };

  const handleViewApproval = (approval: ApprovalItem) => {
    setSelectedApproval(approval);
    setIsViewDialogOpen(true);
  };

  const handleCancelApproval = async (approval: ApprovalItem) => {
    await cancelApproval(approval.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Approval Management</h2>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      <StatisticsCards statistics={statisticsData} />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="my">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={pendingApprovals}
                columns={pendingColumns}
                actions={pendingActions}
                loading={isLoading}
                emptyMessage="No pending approvals"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, applicant or description..."
                    value={filters.search || ""}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.priority || "all"}
                  onValueChange={(value) => setFilters({ ...filters, priority: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DataTable
                data={approvals}
                columns={allColumns}
                actions={allActions}
                loading={isLoading}
                emptyMessage="No requests found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={myApprovals}
                columns={allColumns}
                actions={myActions}
                loading={isLoading}
                emptyMessage="No requests found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Approval Form */}
      <ApprovalForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          // No need to fetch - createApproval already adds the new item to the local state
          setIsCreateDialogOpen(false);
        }}
        onSubmit={createApproval}
      />

      {/* View Approval Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <p className="mt-1">{selectedApproval.title}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="mt-1">{getTypeLabel(selectedApproval.type)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Applicant</Label>
                  <p className="mt-1">{selectedApproval.applicant.name} - {selectedApproval.applicant.department}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApproval.status)}</div>
                </div>
              </div>

              {selectedApproval.type === "leave" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <p className="mt-1">{selectedApproval.startDate}</p>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <p className="mt-1">{selectedApproval.endDate}</p>
                  </div>
                </div>
              )}

              {selectedApproval.amount && (
                <div>
                  <Label>Amount</Label>
                  <p className="mt-1">${selectedApproval.amount.toLocaleString()}</p>
                </div>
              )}

              <div>
                <Label>Priority</Label>
                <div className="mt-1">{getPriorityBadge(selectedApproval.priority)}</div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedApproval.description}</p>
              </div>

              {selectedApproval.approver && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Approver</Label>
                    <p className="mt-1">{selectedApproval.approver}</p>
                  </div>
                  <div>
                    <Label>Approval Date</Label>
                    <p className="mt-1">{selectedApproval.approvalDate}</p>
                  </div>
                </div>
              )}

              {selectedApproval.reason && (
                <div>
                  <Label>Reason</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedApproval.reason}</p>
                </div>
              )}

              {selectedApproval.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleQuickApproval(selectedApproval, "approve")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleQuickApproval(selectedApproval, "reject")}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Action Dialog */}
      <AlertDialog open={!!approvalAction} onOpenChange={() => setApprovalAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalAction?.action === "approve" ? "Approve Request" : "Reject Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {approvalAction?.action === "approve" ? "approve" : "reject"} this request?
              {approvalAction?.action === "reject" && (
                <div className="mt-4">
                  <Label htmlFor="reason">Reason for rejection</Label>
                  <Textarea 
                    id="reason"
                    placeholder="Please provide reason for rejection"
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => approvalAction && handleApprovalAction(approvalAction.item, approvalAction.action, approvalReason)}
              className={approvalAction?.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}