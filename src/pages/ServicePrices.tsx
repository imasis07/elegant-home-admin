import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { fetchServicePrices, saveServicePrice, type ServicePriceRow, formatCurrency } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Plus, Save, Tag, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type EditableRow = {
  id?: string;
  parent_service_key: string;
  parent_service_name: string;
  service_key: string;
  service_name: string;
  service_category: string;
  min_price: number;
  max_price: number;
  is_active: boolean;
};

function toEditable(row: ServicePriceRow): EditableRow {
  return {
    id: row.id,
    parent_service_key: row.parent_service_key ?? "",
    parent_service_name: row.parent_service_name ?? "General",
    service_key: row.service_key,
    service_name: row.service_name,
    service_category: row.service_category ?? "General",
    min_price: Number(row.min_price ?? 0),
    max_price: Number(row.max_price ?? 0),
    is_active: !!row.is_active,
  };
}

function makeKey(text: string) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const ServicePrices = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [draftMap, setDraftMap] = useState<Record<string, EditableRow>>({});
  const [newRow, setNewRow] = useState<EditableRow>({
    parent_service_key: "",
    parent_service_name: "",
    service_key: "",
    service_name: "",
    service_category: "General",
    min_price: 0,
    max_price: 0,
    is_active: true,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["service-prices"],
    queryFn: fetchServicePrices,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const mutation = useMutation({
    mutationFn: saveServicePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-prices"] });
      toast.success("Service price saved");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to save service price");
    },
  });

  const rows = useMemo(() => {
    const raw = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((item) => {
      return (
        item.service_name.toLowerCase().includes(q) ||
        (item.parent_service_name ?? "").toLowerCase().includes(q) ||
        (item.service_category ?? "").toLowerCase().includes(q) ||
        item.service_key.toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ServicePriceRow[]>();
    rows.forEach((row) => {
      const key = row.parent_service_name?.trim() || "General Services";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const totalServices = rows.length;
  const activeServices = rows.filter((item) => item.is_active).length;
  const avgMinPrice = rows.length
    ? rows.reduce((sum, item) => sum + Number(item.min_price ?? 0), 0) / rows.length
    : 0;

  const getDraft = (row: ServicePriceRow) => draftMap[row.id] ?? toEditable(row);
  const setDraft = (rowId: string, updater: (prev: EditableRow) => EditableRow) => {
    setDraftMap((prev) => {
      const current = prev[rowId] ?? toEditable((data ?? []).find((x) => x.id === rowId)!);
      return { ...prev, [rowId]: updater(current) };
    });
  };

  const saveRow = (row: EditableRow) => {
    if (!row.parent_service_name.trim()) return toast.error("Main service name required");
    if (!row.service_name.trim()) return toast.error("Sub-service name required");
    if (!row.service_category.trim()) return toast.error("Service category required");
    if (row.min_price < 0 || row.max_price < 0) return toast.error("Price cannot be negative");
    if (row.max_price < row.min_price) return toast.error("Max price must be >= min price");

    mutation.mutate({
      ...row,
      parent_service_key: row.parent_service_key.trim() || makeKey(row.parent_service_name),
      service_key: row.service_key.trim() || makeKey(row.service_name),
    });
  };

  const addNewRow = () => {
    saveRow(newRow);
    setNewRow({
      parent_service_key: "",
      parent_service_name: "",
      service_key: "",
      service_name: "",
      service_category: "General",
      min_price: 0,
      max_price: 0,
      is_active: true,
    });
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Service Prices</h1>
          <p className="text-sm text-muted-foreground">
            Main service wise boxes, aur har box ke andar sub-service pricing edit kar sakte ho.
          </p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Sub-Services", value: String(totalServices), icon: Wrench },
            { label: "Active Sub-Services", value: String(activeServices), icon: Tag },
            { label: "Average Min Price", value: formatCurrency(avgMinPrice), icon: Save },
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

        <div className="glass-card p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-8">
            <input
              value={newRow.parent_service_name}
              onChange={(e) => setNewRow((prev) => ({ ...prev, parent_service_name: e.target.value }))}
              placeholder="Main service (e.g. AC Repair Services)"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm md:col-span-2"
            />
            <input
              value={newRow.service_name}
              onChange={(e) => setNewRow((prev) => ({ ...prev, service_name: e.target.value }))}
              placeholder="Sub-service name"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm md:col-span-2"
            />
            <input
              value={newRow.service_category}
              onChange={(e) => setNewRow((prev) => ({ ...prev, service_category: e.target.value }))}
              placeholder="Category"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
            />
            <input
              type="number"
              value={newRow.min_price}
              onChange={(e) => setNewRow((prev) => ({ ...prev, min_price: Number(e.target.value) || 0 }))}
              placeholder="Min"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
            />
            <input
              type="number"
              value={newRow.max_price}
              onChange={(e) => setNewRow((prev) => ({ ...prev, max_price: Number(e.target.value) || 0 }))}
              placeholder="Max"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
            />
            <button
              onClick={addNewRow}
              disabled={mutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search main service / sub-service / key..."
            className="h-10 w-full rounded-lg border border-border/50 bg-muted/30 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="glass-card p-6 text-sm text-muted-foreground">Loading service prices...</div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([parentName, list]) => (
              <div key={parentName} className="glass-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{parentName}</h3>
                    <p className="text-xs text-muted-foreground">{list.length} sub-services</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-border/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Sub-Service</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Main Key</th>
                        <th className="px-3 py-2">Sub Key</th>
                        <th className="px-3 py-2">Min</th>
                        <th className="px-3 py-2">Max</th>
                        <th className="px-3 py-2">Active</th>
                        <th className="px-3 py-2">Save</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((row) => {
                        const draft = getDraft(row);
                        return (
                          <tr key={row.id} className="border-b border-border/20">
                            <td className="px-3 py-2">
                              <input
                                value={draft.service_name}
                                onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, service_name: e.target.value }))}
                                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={draft.service_category}
                                onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, service_category: e.target.value }))}
                                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={draft.parent_service_key}
                                onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, parent_service_key: e.target.value }))}
                                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={draft.service_key}
                                onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, service_key: e.target.value }))}
                                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={draft.min_price}
                                onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, min_price: Number(e.target.value) || 0 }))}
                                className="h-9 w-24 rounded-lg border border-border/50 bg-muted/30 px-3"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={draft.max_price}
                                onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, max_price: Number(e.target.value) || 0 }))}
                                className="h-9 w-24 rounded-lg border border-border/50 bg-muted/30 px-3"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <label className="inline-flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={draft.is_active}
                                  onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, is_active: e.target.checked }))}
                                />
                                {draft.is_active ? "Active" : "Off"}
                              </label>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => saveRow(draft)}
                                disabled={mutation.isPending}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-60"
                              >
                                <Save className="h-3.5 w-3.5" />
                                Save
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default ServicePrices;
