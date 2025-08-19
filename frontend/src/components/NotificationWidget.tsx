import { Bell, CheckCircle, Clock, AlertCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNotifications } from "../hooks";

export function NotificationWidget() {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications(5);

  const getIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline"
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading notifications...</div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                notification.isRead ? 'bg-card opacity-60' : 'bg-card hover:bg-accent'
              }`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              {getIcon(notification.type)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm ${notification.isRead ? 'font-normal' : 'font-medium'}`}>
                    {notification.title}
                    {!notification.isRead && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>}
                  </h4>
                  {getPriorityBadge(notification.priority)}
                </div>
                <p className="text-xs text-muted-foreground">{notification.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{notification.timeAgo}</p>
                  {notification.triggeredByUserName && (
                    <p className="text-xs text-muted-foreground">by {notification.triggeredByUserName}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No notifications</div>
        )}
      </CardContent>
    </Card>
  );
}