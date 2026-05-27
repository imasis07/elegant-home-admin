import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { Bell, CheckCircle2, AlertCircle, Info, Clock } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendSnapshot } from "@/lib/backend";

const typeConfig: Record<string, { icon: typeof Bell; class: string }> = {
  info: { icon: Info, class: "text-info bg-info/10" },
  success: { icon: CheckCircle2, class: "text-success bg-success/10" },
  warning: { icon: AlertCircle, class: "text-warning bg-warning/10" },
};

const getType = (title: string, message: string) => {
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes("cancel") || text.includes("failed") || text.includes("error")) return "warning";
  if (text.includes("complete") || text.includes("success") || text.includes("approved")) return "success";
  return "info";
};

const Notifications = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
  });

  const rows = useMemo(() => {
    const notifications = data?.notifications ?? [];
    const profiles = data?.profiles ?? [];
    const profileMap = new Map(profiles.map((p) => [p.id, p.full_name || p.email || "User"]));

    return notifications.map((row) => {
      const title = row.title || "Notification";
      const message = row.message || "-";
      return {
        id: row.id,
        title,
        desc: `${profileMap.get(row.user_id ?? "") || "User"} â€¢ ${message}`,
        time: row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : "-",
        type: getType(title, message),
        read: Boolean(row.is_read),
      };
    });
  }, [data]);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Live activity from Supabase `notifications` table.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <StaggerContainer className="space-y-3">
          {isLoading ? (
            <div className="glass-card p-6 text-sm text-muted-foreground">Loading notifications...</div>
          ) : rows.length === 0 ? (
            <div className="glass-card p-6 text-sm text-muted-foreground">No notifications found.</div>
          ) : (
            rows.map((item) => {
              const config = typeConfig[item.type] ?? typeConfig.info;
              const Icon = config.icon;
              return (
                <StaggerItem key={item.id}>
                  <div className={`glass-card flex items-start gap-4 p-4 transition-colors hover:bg-muted/10 ${!item.read ? "border-l-2 border-l-primary" : ""}`}>
                    <div className={`rounded-lg p-2 ${config.class}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </div>
                  </div>
                </StaggerItem>
              );
            })
          )}
        </StaggerContainer>
      </div>
    </AnimatedPage>
  );
};

export default Notifications;
