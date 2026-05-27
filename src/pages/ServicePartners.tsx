import { AnimatedPage } from "@/components/AnimatedPage";
import { Search, CheckCircle2, Clock, MapPin, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendSnapshot, formatCurrency, parseMoney } from "@/lib/backend";

const ServicePartners = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
  });

  const partners = useMemo(() => {
    const allProfiles = data?.profiles ?? [];
    const bookings = data?.bookings ?? [];
    const partnerRows = allProfiles.filter((item) => item.partner_access);

    return partnerRows
      .map((partner) => {
        const partnerBookings = bookings.filter((booking) => booking.partner_id === partner.id);
        const jobs = partnerBookings.length;
        const revenue = partnerBookings
          .filter((booking) => (booking.status ?? "").toLowerCase() === "completed")
          .reduce((sum, booking) => sum + (booking.final_price ?? parseMoney(booking.amount)), 0);

        return {
          id: partner.id,
          name: partner.full_name || "Partner",
          category: partner.service_category || "Not set",
          location: partner.address || "Not set",
          email: partner.email || "No email",
          mobile:
            (partner.mobile as string | null | undefined) ||
            (partner.phone as string | null | undefined) ||
            (partner.mobile_no as string | null | undefined) ||
            (partner.contact_no as string | null | undefined) ||
            "No mobile",
          jobs,
          revenue,
          isOnline: Boolean(partner.is_online),
          aadhaarStatus: (partner.aadhaar_status || "not_uploaded").toLowerCase(),
          panStatus: (partner.pan_status || "not_uploaded").toLowerCase(),
          avatar: (partner.full_name || "P").slice(0, 2).toUpperCase(),
        };
      })
      .filter((item) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [item.name, item.category, item.email, item.mobile, item.location].some((value) => value.toLowerCase().includes(q));
      });
  }, [data, search]);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Service Partners</h1>
          <p className="text-sm text-muted-foreground">Connected with Supabase `profiles` + `bookings`.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Search partners..."
            className="h-10 w-full rounded-lg border border-border/50 bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="glass-card p-6 text-sm text-muted-foreground">Loading partners...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {partners.map((partner) => (
              <motion.div key={partner.id} whileHover={{ y: -3 }} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                      <span className="text-sm font-bold text-primary">{partner.avatar}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{partner.name}</h3>
                        {partner.aadhaarStatus === "verified" && partner.panStatus === "verified" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-warning" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{partner.category}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${partner.isOnline ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {partner.isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {partner.location}</p>
                  <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {partner.email}</p>
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {partner.mobile}</p>
                  <p>KYC: Aadhaar {partner.aadhaarStatus} • PAN {partner.panStatus}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/30 pt-3">
                  <div>
                    <p className="text-base font-bold text-foreground">{partner.jobs}</p>
                    <p className="text-xs text-muted-foreground">Jobs</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{formatCurrency(partner.revenue)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
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

export default ServicePartners;
