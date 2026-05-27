import { AnimatedPage } from "@/components/AnimatedPage";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendSnapshot, formatCurrency, parseMoney } from "@/lib/backend";

const Customers = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
  });

  const customers = useMemo(() => {
    const profiles = data?.profiles ?? [];
    const bookings = data?.bookings ?? [];
    const customerRows = profiles.filter((item) => item.customer_access);

    return customerRows
      .map((customer) => {
        const customerBookings = bookings.filter((booking) => booking.user_id === customer.id);
        const spent = customerBookings.reduce((sum, booking) => sum + (booking.final_price ?? parseMoney(booking.amount)), 0);
        const active = customerBookings.some((booking) => {
          const status = (booking.status || "").toLowerCase();
          return status === "accepted" || status === "in_progress" || status === "pending";
        });

        return {
          id: customer.id,
          name: customer.full_name || "Customer",
          email: customer.email || "No email",
          bookings: customerBookings.length,
          spent,
          status: active ? "active" : "inactive",
          joined: customer.created_at ? new Date(customer.created_at).toLocaleDateString("en-IN") : "-",
        };
      })
      .filter((item) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [item.name, item.email, item.status].some((value) => value.toLowerCase().includes(q));
      });
  }, [data, search]);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Connected with Supabase `profiles` and `bookings`.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Search customers..."
            className="h-10 w-full rounded-lg border border-border/50 bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="glass-card p-6 text-sm text-muted-foreground">Loading customers...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => (
              <motion.div key={customer.id} whileHover={{ y: -3 }} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                      <span className="text-sm font-bold text-primary">
                        {customer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{customer.name}</h3>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${customer.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {customer.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/30 pt-3">
                  <div>
                    <p className="text-lg font-bold text-foreground">{customer.bookings}</p>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(customer.spent)}</p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-xs text-foreground">{customer.joined}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default Customers;

