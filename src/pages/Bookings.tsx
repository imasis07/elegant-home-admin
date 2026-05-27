import { AnimatedPage } from "@/components/AnimatedPage";
import { Search, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendSnapshot, formatCurrency, parseMoney } from "@/lib/backend";

const statusConfig: Record<string, { class: string; icon: typeof CheckCircle2 }> = {
  completed: { class: "text-success", icon: CheckCircle2 },
  "in-progress": { class: "text-info", icon: Clock },
  in_progress: { class: "text-info", icon: Clock },
  accepted: { class: "text-info", icon: Clock },
  pending: { class: "text-warning", icon: Clock },
  cancelled: { class: "text-destructive", icon: XCircle },
  canceled: { class: "text-destructive", icon: XCircle },
  rejected: { class: "text-destructive", icon: XCircle },
};

const Bookings = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
  });

  const rows = useMemo(() => {
    const bookings = data?.bookings ?? [];
    const profiles = data?.profiles ?? [];
    const customers = new Map(profiles.filter((p) => p.customer_access).map((p) => [p.id, p.full_name || p.email || "Customer"]));
    const partners = new Map(profiles.filter((p) => p.partner_access).map((p) => [p.id, p.full_name || p.email || "Partner"]));

    return bookings
      .map((b) => ({
        id: b.booking_id || b.id,
        customer: customers.get(b.user_id ?? "") || "Customer",
        service: b.service_type || b.services?.[0] || "Service",
        provider: partners.get(b.partner_id ?? "") || "Unassigned",
        date: b.service_date || (b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "-"),
        time: b.service_time || "",
        status: (b.status || "pending").toLowerCase(),
        amount: formatCurrency(b.final_price ?? parseMoney(b.amount)),
      }))
      .filter((row) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [row.id, row.customer, row.service, row.provider, row.status].some((item) => item.toLowerCase().includes(q));
      });
  }, [data, search]);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground">Connected with Supabase `bookings` table.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Search bookings..."
            className="h-10 w-full rounded-lg border border-border/50 bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  {["ID", "Customer", "Service", "Provider", "Date", "Status", "Amount"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      Loading bookings...
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const sc = statusConfig[row.status] ?? statusConfig.pending;
                    const Icon = sc.icon;
                    return (
                      <tr key={row.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{row.id}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{row.customer}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{row.service}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{row.provider}</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">{row.date} {row.time}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium capitalize ${sc.class}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{row.amount}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Bookings;

