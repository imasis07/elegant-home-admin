import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import {
  deleteHomeBanner,
  fetchHomeBanners,
  saveHomeBanner,
  type HomeBannerRow,
} from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LayoutTemplate, MousePointerClick, Save, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type EditableBanner = {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  target_route: string;
  sort_order: number;
  is_active: boolean;
};

function toEditable(row: HomeBannerRow): EditableBanner {
  return {
    id: row.id,
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    image_url: row.image_url ?? "",
    target_route: row.target_route ?? "",
    sort_order: Number(row.sort_order ?? 0),
    is_active: !!row.is_active,
  };
}

const routeSuggestions = [
  "acServiceList",
  "airCoolerServiceList",
  "fanServiceList",
  "tvServiceList",
  "fridgeServiceList",
  "washingMachineServiceList",
  "laptopServiceList",
  "computerServiceList",
  "bikeServiceList",
  "carServiceList",
  "roServiceList",
  "aquaguardServiceList",
];

const HomeBanners = () => {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, EditableBanner>>({});
  const [newBanner, setNewBanner] = useState<EditableBanner>({
    title: "",
    subtitle: "",
    image_url: "",
    target_route: "",
    sort_order: 0,
    is_active: true,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["home-banners"],
    queryFn: fetchHomeBanners,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const saveMutation = useMutation({
    mutationFn: saveHomeBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-banners"] });
      toast.success("Banner saved");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to save banner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHomeBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-banners"] });
      toast.success("Banner deleted");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to delete banner");
    },
  });

  const banners = useMemo(() => data ?? [], [data]);
  const activeCount = banners.filter((item) => item.is_active).length;
  const totalClicks = banners.reduce((sum, item) => sum + Number(item.click_count ?? 0), 0);

  const getDraft = (row: HomeBannerRow) => drafts[row.id] ?? toEditable(row);

  const setDraft = (id: string, updater: (prev: EditableBanner) => EditableBanner) => {
    setDrafts((prev) => {
      const source = prev[id] ?? toEditable((data ?? []).find((item) => item.id === id)!);
      return { ...prev, [id]: updater(source) };
    });
  };

  const validateBanner = (row: EditableBanner) => {
    if (!row.image_url.trim()) return "Banner image URL required";
    if (row.sort_order < 0) return "Sort order cannot be negative";
    return null;
  };

  const handleSave = (row: EditableBanner) => {
    const validationError = validateBanner(row);
    if (validationError) return toast.error(validationError);
    saveMutation.mutate(row);
  };

  const handleCreate = () => {
    const validationError = validateBanner(newBanner);
    if (validationError) return toast.error(validationError);
    saveMutation.mutate(newBanner, {
      onSuccess: () => {
        setNewBanner({
          title: "",
          subtitle: "",
          image_url: "",
          target_route: "",
          sort_order: (banners.at(-1)?.sort_order ?? banners.length) + 1,
          is_active: true,
        });
      },
    });
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Home Banners</h1>
          <p className="text-sm text-muted-foreground">
            Swiggy/Zomato style daily promo banners yahin se manage karo. Title, image, route aur sort order sab update hoga.
          </p>
          {error ? <p className="mt-2 text-xs text-destructive">{(error as Error).message}</p> : null}
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Banners", value: String(banners.length), icon: LayoutTemplate },
            { label: "Active Banners", value: String(activeCount), icon: ImagePlus },
            { label: "Route Templates", value: String(routeSuggestions.length), icon: UploadCloud },
            { label: "Total Clicks", value: String(totalClicks), icon: MousePointerClick },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="stat-card hover-lift">
                <div className="w-fit rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 font-display text-2xl font-bold text-foreground">{isLoading ? "..." : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="glass-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <ImagePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Add New Banner</h3>
              <p className="text-xs text-muted-foreground">Image URL do, route select karo, save karo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              value={newBanner.title}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Banner title"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm md:col-span-2"
            />
            <input
              value={newBanner.subtitle}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Subtitle"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm md:col-span-2"
            />
            <input
              value={newBanner.image_url}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://...image"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm md:col-span-2"
            />
            <input
              value={newBanner.target_route}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, target_route: e.target.value }))}
              placeholder="Target route"
              list="banner-route-suggestions"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm md:col-span-2"
            />
            <input
              type="number"
              value={newBanner.sort_order}
              onChange={(e) => setNewBanner((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
              placeholder="Sort"
              className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
            />
            <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm">
              <input
                type="checkbox"
                checked={newBanner.is_active}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>
            <button
              onClick={handleCreate}
              disabled={saveMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Save Banner
            </button>
          </div>
          <datalist id="banner-route-suggestions">
            {routeSuggestions.map((route) => (
              <option key={route} value={route} />
            ))}
          </datalist>
        </div>

        {isLoading ? (
          <div className="glass-card p-6 text-sm text-muted-foreground">Loading banners...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {banners.map((row) => {
              const draft = getDraft(row);
              return (
                <div key={row.id} className="glass-card overflow-hidden p-4">
                  <div className="mb-4 aspect-[16/7] overflow-hidden rounded-2xl bg-muted/30">
                    {draft.image_url ? (
                      <img
                        src={draft.image_url}
                        alt={draft.title || "Banner preview"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Preview unavailable
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
                    />
                    <input
                      value={draft.subtitle}
                      onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Subtitle"
                      className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
                    />
                    <input
                      value={draft.image_url}
                      onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, image_url: e.target.value }))}
                      placeholder="Image URL"
                      className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm md:col-span-2"
                    />
                    <input
                      value={draft.target_route}
                      onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, target_route: e.target.value }))}
                      placeholder="Target route"
                      list="banner-route-suggestions"
                      className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
                    />
                    <input
                      type="number"
                      value={draft.sort_order}
                      onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
                      placeholder="Sort order"
                      className="h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={draft.is_active}
                          onChange={(e) => setDraft(row.id, (prev) => ({ ...prev, is_active: e.target.checked }))}
                        />
                        {draft.is_active ? "Active on app" : "Hidden from app"}
                      </label>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {Number(row.click_count ?? 0)} clicks
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteMutation.mutate(row.id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs text-destructive disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      <button
                        onClick={() => handleSave(draft)}
                        disabled={saveMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default HomeBanners;
