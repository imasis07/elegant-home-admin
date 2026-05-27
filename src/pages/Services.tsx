import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { Wrench, TrendingUp, CalendarCheck, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendSnapshot, formatCurrency, parseMoney } from "@/lib/backend";

const Services = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
  });

  const services = useMemo(() => {
    const bookings = data?.bookings ?? [];
    const map = new Map<
      string,
      { name: string; bookings: number; completed: number; pending: number; revenue: number }
    >();

    bookings.forEach((booking) => {
      const name = booking.service_type?.trim() || booking.services?.[0]?.trim() || "Service";
      const status = (booking.status || "").toLowerCase();
      const row = map.get(name) ?? { name, bookings: 0, completed: 0, pending: 0, revenue: 0 };
      row.bookings += 1;
      if (status === "completed") {
        row.completed += 1;
        row.revenue += booking.final_price ?? parseMoney(booking.amount);
      } else if (status === "pending" || status === "accepted" || status === "in_progress") {
        row.pending += 1;
      }
      map.set(name, row);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        avgTicket: item.completed > 0 ? item.revenue / item.completed : 0,
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .filter((item) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return item.name.toLowerCase().includes(q);
      });
  }, [data, search]);

  const totalServices = services.length;
  const totalBookings = services.reduce((sum, item) => sum + item.bookings, 0);
  const totalRevenue = services.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">Live summary from Supabase `bookings`.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Service Types", value: String(totalServices), icon: Wrench },
            { label: "Total Bookings", value: String(totalBookings), icon: CalendarCheck },
            { label: "Completed Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="stat-card hover-lift">
                <div className="rounded-lg bg-primary/10 p-2 w-fit">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 font-display text-2xl font-bold text-foreground">{isLoading ? "..." : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Search service..."
            className="h-10 w-full rounded-lg border border-border/50 bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="glass-card p-6 text-sm text-muted-foreground">Loading services...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <StaggerItem key={service.name}>
                <motion.div whileHover={{ y: -4 }} className="glass-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {service.bookings} jobs
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">{service.name}</h3>
                  <div className="mt-4 space-y-1 border-t border-border/30 pt-3 text-xs text-muted-foreground">
                    <p>Completed: {service.completed}</p>
                    <p>Pending/Running: {service.pending}</p>
                    <p>Revenue: {formatCurrency(service.revenue)}</p>
                    <p>Avg Ticket: {formatCurrency(service.avgTicket)}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default Services;
