import { useMemo } from "react";
import { Users, Building2, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { StatisticsCards } from "../common";
import { useStatistics, useActivities } from "../../hooks";
import type { StatisticCardData } from "../../types/common";
import "tailwindcss";

interface HomePageProps {
  setActiveMenu?: (menu: string) => void;
  onQuickAddEmployee?: () => void;
  onQuickAddDepartment?: () => void;
}

export function HomePage({ setActiveMenu, onQuickAddEmployee, onQuickAddDepartment }: HomePageProps) {
  const { statistics, isLoading } = useStatistics();
  const { activities, isLoading: activitiesLoading } = useActivities(5);

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
      label: "Active Employees",
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

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to the Employee Management System</p>
      </div>

      <StatisticsCards statistics={statisticsData} className="gap-6" loading={isLoading} />

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activitiesLoading ? (
              <div className="text-sm text-muted-foreground">Loading activities...</div>
            ) : activities.length > 0 ? (
              activities.map((activity) => {
                const getStatusColor = (action: string) => {
                  switch (action.toLowerCase()) {
                    case 'created':
                    case 'registered':
                      return 'bg-blue-500';
                    case 'approved':
                      return 'bg-green-500';
                    case 'rejected':
                      return 'bg-red-500';
                    case 'updated':
                      return 'bg-yellow-500';
                    case 'deleted':
                      return 'bg-gray-500';
                    default:
                      return 'bg-blue-500';
                  }
                };

                return (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.action)}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.entityName && `${activity.entityName} - `}
                        by {activity.userName}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.timeAgo}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">No recent activities</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onQuickAddEmployee?.()}
            >
              <Users className="h-4 w-4 mr-2" />
              Add New Employee
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setActiveMenu?.('approval')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Process Approvals
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}