import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { Wallet, Building, CreditCard, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendSnapshot, formatCurrency } from "@/lib/backend";

const statusConfig: Record<string, { class: string; icon: typeof CheckCircle2 }> = {
  completed: { class: "text-success bg-success/10", icon: CheckCircle2 },
  approved: { class: "text-success bg-success/10", icon: CheckCircle2 },
  processing: { class: "text-info bg-info/10", icon: Clock },
  pending: { class: "text-warning bg-warning/10", icon: Clock },
  rejected: { class: "text-destructive bg-destructive/10", icon: XCircle },
  failed: { class: "text-destructive bg-destructive/10", icon: XCircle },
};

const Withdrawal = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
  });

  const view = useMemo(() => {
    const withdrawals = data?.withdrawals ?? [];
    const profiles = data?.profiles ?? [];
    const walletLedger = data?.walletLedger ?? [];

    const requestedTotal = withdrawals.reduce((sum, row) => sum + (row.amount ?? 0), 0);
    const paidTotal = withdrawals
      .filter((row) => ["approved", "completed", "paid"].includes((row.status || "").toLowerCase()))
      .reduce((sum, row) => sum + (row.amount ?? 0), 0);
    const pendingTotal = withdrawals
      .filter((row) => ["pending", "processing"].includes((row.status || "").toLowerCase()))
      .reduce((sum, row) => sum + (row.amount ?? 0), 0);

    const commissionPending = walletLedger
      .filter((row) => row.reason === "commission" && row.direction === "debit" && (row.status || "pending") === "pending")
      .reduce((sum, row) => sum + (row.amount ?? 0), 0);

    const partnerNameById = new Map(
      profiles.filter((row) => row.partner_access).map((row) => [row.id, row.full_name || row.email || "Partner"])
    );

    const rows = withdrawals.map((row) => ({
      id: row.id,
      partner: partnerNameById.get(row.partner_id ?? "") || "Partner",
      amount: row.amount ?? 0,
      date: row.requested_at ? new Date(row.requested_at).toLocaleString("en-IN") : "-",
      status: (row.status || "pending").toLowerCase(),
    }));

    return { requestedTotal, paidTotal, pendingTotal, commissionPending, rows };
  }, [data]);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Withdrawals</h1>
          <p className="text-sm text-muted-foreground">Live from Supabase `withdrawals` and `wallet_ledger`.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Requested", value: formatCurrency(view.requestedTotal), icon: Wallet },
            { label: "Paid Out", value: formatCurrency(view.paidTotal), icon: Building },
            { label: "Pending", value: formatCurrency(view.pendingTotal), icon: CreditCard },
            { label: "Pending Commission", value: formatCurrency(view.commissionPending), icon: Clock },
          ].map((item) => (
            <StaggerItem key={item.label}>
              <div className="stat-card hover-lift">
                <div className="rounded-lg bg-primary/10 p-2 w-fit">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 font-display text-xl font-bold text-foreground">{isLoading ? "..." : item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="glass-card overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Withdrawal Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  {["Request ID", "Partner", "Amount", "Date", "Status"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      Loading withdrawals...
                    </td>
                  </tr>
                ) : view.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No withdrawals found.
                    </td>
                  </tr>
                ) : (
                  view.rows.map((row) => {
                    const conf = statusConfig[row.status] ?? statusConfig.pending;
                    const Icon = conf.icon;
                    return (
                      <tr key={row.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{row.id}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{row.partner}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{formatCurrency(row.amount)}</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">{row.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${conf.class}`}>
                            <Icon className="h-3 w-3" />
                            {row.status}
                          </span>
                        </td>
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

export default Withdrawal;
