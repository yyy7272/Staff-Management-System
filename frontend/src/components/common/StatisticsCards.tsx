import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { StatisticCardData } from "../../types/common";

interface StatisticsCardsProps {
  statistics: StatisticCardData[];
  className?: string;
  loading?: boolean;
}

export function StatisticsCards({ statistics, className = "", loading = false }: StatisticsCardsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {statistics.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${stat.color || ''}`}>
                    {stat.value}
                  </div>
                  {stat.trend && (
                    <p className={`text-xs ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.value}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}