import { supabase } from "@/lib/supabase";

export type BookingRow = {
  id: string;
  booking_id: string | null;
  user_id: string | null;
  partner_id: string | null;
  services: string[] | null;
  service_type: string | null;
  service_date: string | null;
  service_time: string | null;
  amount: string | null;
  final_price: number | null;
  status: string | null;
  created_at: string | null;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile?: string | null;
  address: string | null;
  service_category: string | null;
  is_online: boolean | null;
  partner_access: boolean | null;
  customer_access: boolean | null;
  aadhaar_status: string | null;
  pan_status: string | null;
  created_at: string | null;
  is_verified?: boolean | null;
  aadhaar_front_url?: string | null;
  aadhaar_back_url?: string | null;
  aadhaar_url?: string | null;
  pan_url?: string | null;
  aadhaar_doc_url?: string | null;
  pan_doc_url?: string | null;
  [key: string]: unknown;
};

export type WithdrawalRow = {
  id: string;
  partner_id: string | null;
  amount: number | null;
  status: string | null;
  requested_at: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string | null;
  title: string | null;
  message: string | null;
  created_at: string | null;
  is_read: boolean | null;
};

export type WalletLedgerRow = {
  id: string;
  partner_id: string | null;
  booking_id: string | null;
  reason: string | null;
  direction: string | null;
  amount: number | null;
  status: string | null;
  created_at: string | null;
};

export type ServicePriceRow = {
  id: string;
  parent_service_key: string | null;
  parent_service_name: string | null;
  service_key: string;
  service_name: string;
  service_category: string | null;
  min_price: number;
  max_price: number;
  is_active: boolean;
  updated_at: string | null;
};

export type HomeBannerRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  target_route: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  click_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BackendSnapshot = {
  bookings: BookingRow[];
  profiles: ProfileRow[];
  withdrawals: WithdrawalRow[];
  notifications: NotificationRow[];
  walletLedger: WalletLedgerRow[];
};

export type KycDocType = "aadhaar" | "pan";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

function assertEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.");
  }
}

async function restGet<T>(path: string): Promise<T> {
  assertEnv();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token ?? supabaseAnonKey!;
  const res = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchBackendSnapshot(): Promise<BackendSnapshot> {
  const [bookings, profiles, withdrawals, notifications, walletLedger] = await Promise.all([
    restGet<BookingRow[]>(
      "/rest/v1/bookings?select=id,booking_id,user_id,partner_id,services,service_type,service_date,service_time,amount,final_price,status,created_at&order=created_at.desc&limit=500"
    ),
    restGet<ProfileRow[]>(
      "/rest/v1/profiles?select=*&order=created_at.desc&limit=500"
    ),
    restGet<WithdrawalRow[]>(
      "/rest/v1/withdrawals?select=id,partner_id,amount,status,requested_at&order=requested_at.desc&limit=500"
    ),
    restGet<NotificationRow[]>(
      "/rest/v1/notifications?select=id,user_id,title,message,created_at,is_read&order=created_at.desc&limit=200"
    ),
    restGet<WalletLedgerRow[]>(
      "/rest/v1/wallet_ledger?select=id,partner_id,booking_id,reason,direction,amount,status,created_at&order=created_at.desc&limit=1000"
    ).catch(() => []),
  ]);

  return {
    bookings,
    profiles,
    withdrawals,
    notifications,
    walletLedger,
  };
}

export async function updatePartnerKycStatus(input: {
  partnerId: string;
  docType: KycDocType;
  status: "verified" | "rejected" | "pending";
}) {
  const statusColumn = input.docType === "aadhaar" ? "aadhaar_status" : "pan_status";

  const { data: currentRow, error: fetchError } = await supabase
    .from("profiles")
    .select("aadhaar_status,pan_status")
    .eq("id", input.partnerId)
    .single();

  if (fetchError) throw fetchError;

  const nextAadhaar = input.docType === "aadhaar" ? input.status : (currentRow.aadhaar_status ?? "pending");
  const nextPan = input.docType === "pan" ? input.status : (currentRow.pan_status ?? "pending");

  const payload: Record<string, unknown> = {
    [statusColumn]: input.status,
    is_verified: nextAadhaar === "verified" && nextPan === "verified",
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", input.partnerId);
  if (error) throw error;
}

export function parseMoney(input: string | number | null | undefined): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  if (!input) return 0;
  const cleaned = String(input).replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export async function fetchServicePrices(): Promise<ServicePriceRow[]> {
  const { data, error } = await supabase
    .from("service_prices")
    .select("id,parent_service_key,parent_service_name,service_key,service_name,service_category,min_price,max_price,is_active,updated_at")
    .order("parent_service_name", { ascending: true })
    .order("service_category", { ascending: true })
    .order("service_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ServicePriceRow[];
}

export async function saveServicePrice(input: {
  id?: string;
  parent_service_key?: string;
  parent_service_name?: string;
  service_key: string;
  service_name: string;
  service_category: string;
  min_price: number;
  max_price: number;
  is_active: boolean;
}) {
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    parent_service_key: input.parent_service_key?.trim().toLowerCase() || null,
    parent_service_name: input.parent_service_name?.trim() || null,
    service_key: input.service_key.trim().toLowerCase(),
    service_name: input.service_name.trim(),
    service_category: input.service_category.trim(),
    min_price: input.min_price,
    max_price: input.max_price,
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("service_prices").upsert(payload, {
    onConflict: "service_key",
  });
  if (error) throw error;
}

export async function fetchHomeBanners(): Promise<HomeBannerRow[]> {
  const { data, error } = await supabase
    .from("home_banners")
    .select("id,title,subtitle,image_url,target_route,sort_order,is_active,click_count,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as HomeBannerRow[];
}

export async function saveHomeBanner(input: {
  id?: string;
  title: string;
  subtitle?: string;
  image_url: string;
  target_route?: string;
  sort_order: number;
  is_active: boolean;
}) {
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || "",
    image_url: input.image_url.trim(),
    target_route: input.target_route?.trim() || "",
    sort_order: input.sort_order,
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("home_banners").upsert(payload, {
    onConflict: "id",
  });
  if (error) throw error;
}

export async function deleteHomeBanner(id: string) {
  const { error } = await supabase.from("home_banners").delete().eq("id", id);
  if (error) throw error;
}
