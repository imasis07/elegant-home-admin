import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { TrendingUp, DollarSign, Users, CalendarCheck, ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendSnapshot, parseMoney, formatCurrency } from "@/lib/backend";

const pieColors = ["#22c55e", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", "#64748b"];

const Analytics = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
  });

  const analytics = useMemo(() => {
    const bookings = data?.bookings ?? [];
    const profiles = data?.profiles ?? [];
    const customers = profiles.filter((item) => item.customer_access);
    const completed = bookings.filter((item) => (item.status || "").toLowerCase() === "completed");
    const grossRevenue = completed.reduce((sum, item) => sum + (item.final_price ?? parseMoney(item.amount)), 0);
    const avgOrderValue = completed.length > 0 ? grossRevenue / completed.length : 0;

    const monthMap = new Map<string, { month: string; revenue: number; customers: number }>();
    const customerSetByMonth = new Map<string, Set<string>>();
    bookings.forEach((booking) => {
      const month = (booking.created_at ? new Date(booking.created_at) : new Date()).toLocaleString("en-IN", {
        month: "short",
      });
      const row = monthMap.get(month) ?? { month, revenue: 0, customers: 0 };
      if ((booking.status || "").toLowerCase() === "completed") {
        row.revenue += booking.final_price ?? parseMoney(booking.amount);
      }
      const set = customerSetByMonth.get(month) ?? new Set<string>();
      if (booking.user_id) set.add(booking.user_id);
      customerSetByMonth.set(month, set);
      row.customers = set.size;
      monthMap.set(month, row);
    });

    const monthlyData = Array.from(monthMap.values()).slice(-7);

    const serviceMap = new Map<string, number>();
    bookings.forEach((booking) => {
      const service = booking.service_type?.trim() || booking.services?.[0]?.trim() || "Other";
      serviceMap.set(service, (serviceMap.get(service) ?? 0) + 1);
    });
    const pieData = Array.from(serviceMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: pieColors[index % pieColors.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    return {
      totalRevenue: grossRevenue,
      totalCustomers: customers.length,
      totalBookings: bookings.length,
      avgOrderValue,
      monthlyData,
      pieData,
    };
  }, [data]);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Live analytics from Supabase data.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Completed Revenue", value: formatCurrency(analytics.totalRevenue), icon: DollarSign },
            { label: "Customers", value: String(analytics.totalCustomers), icon: Users },
            { label: "Bookings", value: String(analytics.totalBookings), icon: CalendarCheck },
            { label: "Avg Order", value: formatCurrency(analytics.avgOrderValue), icon: TrendingUp },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="stat-card hover-lift">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <ArrowUpRight className="h-3 w-3" />
                    live
                  </span>
                </div>
                <p className="mt-4 font-display text-2xl font-bold text-foreground">{isLoading ? "..." : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.monthlyData}>
                <defs>
                  <linearGradient id="aGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38,92%,55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38,92%,55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228,15%,20%)" />
                <XAxis dataKey="month" stroke="hsl(228,10%,55%)" fontSize={12} />
                <YAxis stroke="hsl(228,10%,55%)" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="hsl(38,92%,55%)" fill="url(#aGold)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Service Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={analytics.pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                  {analytics.pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {analytics.pieData.map((item) => (
                <span key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Monthly Active Customers</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228,15%,20%)" />
              <XAxis dataKey="month" stroke="hsl(228,10%,55%)" fontSize={12} />
              <YAxis stroke="hsl(228,10%,55%)" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="customers" stroke="hsl(152,60%,45%)" strokeWidth={2} dot={{ fill: "hsl(152,60%,45%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Analytics;
