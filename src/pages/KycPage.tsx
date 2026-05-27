import { AnimatedPage } from "@/components/AnimatedPage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBackendSnapshot, type KycDocType, type ProfileRow, updatePartnerKycStatus } from "@/lib/backend";
import { CheckCircle2, FileBadge2, FileWarning, Folder, XCircle } from "lucide-react";
import { toast } from "sonner";

function normalizeStatus(value: unknown): "verified" | "pending" | "rejected" | "not_uploaded" {
  const text = String(value ?? "").toLowerCase();
  if (text === "verified") return "verified";
  if (text === "rejected") return "rejected";
  if (text === "pending" || text === "under_review") return "pending";
  return "not_uploaded";
}

function getDocUrl(profile: ProfileRow, type: KycDocType) {
  if (type === "aadhaar") {
    const joined = [
      profile.aadhaar_front_url,
      profile.aadhaar_back_url,
      profile.aadhaar_url,
      profile.aadhaar_doc_url,
      profile.aadhaar_file_url,
    ]
      .filter(Boolean)
      .map((item) => String(item));
    return joined.join(" | ");
  }
  return String(profile.pan_url ?? profile.pan_doc_url ?? profile.pan_file_url ?? "");
}

function extractUrls(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter((item) => item.startsWith("http://") || item.startsWith("https://"));
}

const KycPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "verified" | "rejected" | "all">("pending");

  const { data, isLoading, error } = useQuery({
    queryKey: ["backend-snapshot"],
    queryFn: fetchBackendSnapshot,
    staleTime: 15_000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const mutation = useMutation({
    mutationFn: updatePartnerKycStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backend-snapshot"] });
      toast.success("KYC status updated");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to update KYC");
    },
  });

  const folders = useMemo(() => {
    const profiles = (data?.profiles ?? []).filter((p) => p.partner_access);
    return profiles
      .map((profile) => {
        const aadhaarStatus = normalizeStatus(profile.aadhaar_status);
        const panStatus = normalizeStatus(profile.pan_status);
        const pendingCount = [aadhaarStatus, panStatus].filter((s) => s === "pending").length;
        const rejectedCount = [aadhaarStatus, panStatus].filter((s) => s === "rejected").length;
        const verifiedCount = [aadhaarStatus, panStatus].filter((s) => s === "verified").length;

        let overall: "pending" | "verified" | "rejected";
        if (rejectedCount > 0) overall = "rejected";
        else if (verifiedCount === 2) overall = "verified";
        else overall = "pending";

        const aadhaarUrl = getDocUrl(profile, "aadhaar");
        const panUrl = getDocUrl(profile, "pan");
        const hasAnyDoc =
          aadhaarUrl.trim().length > 0 ||
          panUrl.trim().length > 0 ||
          aadhaarStatus !== "not_uploaded" ||
          panStatus !== "not_uploaded";

        return {
          partnerId: profile.id,
          name: profile.full_name || "Partner",
          email: profile.email || "No email",
          overall,
          hasAnyDoc,
          docs: [
            {
              type: "aadhaar" as const,
              label: "Aadhaar",
              status: aadhaarStatus,
              url: aadhaarUrl,
            },
            {
              type: "pan" as const,
              label: "PAN",
              status: panStatus,
              url: panUrl,
            },
          ],
          pendingCount,
        };
      })
      .filter((item) => item.hasAnyDoc)
      .filter((item) => (tab === "all" ? true : item.overall === tab))
      .sort((a, b) => b.pendingCount - a.pendingCount);
  }, [data, tab]);

  const setDocStatus = (partnerId: string, docType: KycDocType, status: "verified" | "rejected") => {
    mutation.mutate({ partnerId, docType, status });
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">KYC Review</h1>
          <p className="text-sm text-muted-foreground">Partner-wise folders with Aadhaar and PAN documents.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList className="h-10 rounded-full bg-muted/60 p-1">
            <TabsTrigger value="pending" className="rounded-full px-4">Pending</TabsTrigger>
            <TabsTrigger value="verified" className="rounded-full px-4">Verified</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-full px-4">Rejected</TabsTrigger>
            <TabsTrigger value="all" className="rounded-full px-4">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="glass-card p-6 text-sm text-muted-foreground">Loading KYC folders...</div>
        ) : folders.length === 0 ? (
          <div className="glass-card p-6 text-sm text-muted-foreground">No uploaded KYC documents in this tab.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {folders.map((folder) => (
              <div key={folder.partnerId} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{folder.name}</h3>
                      <p className="text-xs text-muted-foreground">{folder.email}</p>
                      <p className="text-[11px] text-muted-foreground break-all">ID: {folder.partnerId}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${folder.overall === "verified" ? "bg-emerald-500/15 text-emerald-600" : folder.overall === "rejected" ? "bg-red-500/15 text-red-600" : "bg-amber-500/15 text-amber-600"}`}>
                    {folder.overall}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {folder.docs.map((doc) => (
                    <div key={doc.type} className="rounded-xl border border-border/60 bg-background/40 p-3">
                      {(() => {
                        const links = extractUrls(doc.url);
                        return (
                          <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {doc.status === "verified" ? (
                            <FileBadge2 className="h-4 w-4 text-emerald-600" />
                          ) : doc.status === "rejected" ? (
                            <FileWarning className="h-4 w-4 text-red-600" />
                          ) : (
                            <FileBadge2 className="h-4 w-4 text-amber-600" />
                          )}
                          <p className="text-sm font-medium text-foreground">{doc.label}</p>
                        </div>
                        <span className={`text-xs ${doc.status === "verified" ? "text-emerald-600" : doc.status === "rejected" ? "text-red-600" : doc.status === "pending" ? "text-amber-600" : "text-muted-foreground"}`}>
                          {doc.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {links.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {links.map((link, index) => (
                              <a
                                key={`${doc.type}-${index}`}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-muted/50"
                              >
                                View {doc.label} {links.length > 1 ? index + 1 : ""}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-500">No viewable file. Use Reject to force partner re-upload.</span>
                        )}
                        <button
                          onClick={() => setDocStatus(folder.partnerId, doc.type, "verified")}
                          disabled={mutation.isPending || doc.status === "not_uploaded" || links.length === 0}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setDocStatus(folder.partnerId, doc.type, "rejected")}
                          disabled={mutation.isPending || doc.status === "not_uploaded"}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default KycPage;
