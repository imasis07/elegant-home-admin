-- Service pricing master table for Admin Panel + Customer App
-- Run once in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.service_prices (
  id uuid primary key default gen_random_uuid(),
  parent_service_key text,
  parent_service_name text,
  service_key text not null unique,
  service_name text not null,
  service_category text not null default 'General',
  min_price numeric(10,2) not null default 0,
  max_price numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_prices_price_chk check (min_price >= 0 and max_price >= min_price)
);

create index if not exists idx_service_prices_category on public.service_prices(service_category);
create index if not exists idx_service_prices_active on public.service_prices(is_active);
create index if not exists idx_service_prices_parent on public.service_prices(parent_service_key);

create or replace function public.touch_service_prices_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_service_prices_updated_at on public.service_prices;
create trigger trg_touch_service_prices_updated_at
before update on public.service_prices
for each row
execute function public.touch_service_prices_updated_at();

alter table public.service_prices enable row level security;

drop policy if exists service_prices_read_anon on public.service_prices;
create policy service_prices_read_anon
on public.service_prices
for select
to anon
using (true);

drop policy if exists service_prices_read_auth on public.service_prices;
create policy service_prices_read_auth
on public.service_prices
for select
to authenticated
using (true);

drop policy if exists service_prices_write_admin on public.service_prices;
create policy service_prices_write_admin
on public.service_prices
for all
to authenticated
using (lower(auth.jwt() ->> 'email') = 'info@cervizo.in')
with check (lower(auth.jwt() ->> 'email') = 'info@cervizo.in');

alter table public.service_prices
  add column if not exists parent_service_key text,
  add column if not exists parent_service_name text;

insert into public.service_prices (parent_service_key, parent_service_name, service_key, service_name, service_category, min_price, max_price, is_active)
values
  -- Laptop
  ('laptop_repair_services', 'Laptop Repair Services', 'windows_laptop', 'Windows Laptop', 'Gadgets', 699, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'macbook', 'MacBook', 'Gadgets', 599, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'gaming_laptop', 'Gaming Laptop', 'Gadgets', 499, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'ultrabook', 'Ultrabook', 'Gadgets', 399, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'ssd_256gb', 'SSD 256GB', 'Gadgets', 299, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'ssd_512gb', 'SSD 512GB', 'Gadgets', 199, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'battery', 'Battery', 'Gadgets', 599, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', '8gb_ram', '8GB RAM', 'Gadgets', 499, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'regular_keyboard', 'Regular Keyboard', 'Gadgets', 399, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'backlit_keyboard', 'Backlit Keyboard', 'Gadgets', 299, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'mechanical', 'Mechanical', 'Gadgets', 199, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'ms_office', 'MS Office', 'Gadgets', 699, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'antivirus', 'Antivirus', 'Gadgets', 599, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'photoshop', 'Photoshop', 'Gadgets', 499, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'driver_pack', 'Driver Pack', 'Gadgets', 399, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'windows_10_home', 'Windows 10 Home', 'Gadgets', 299, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'windows_10_pro', 'Windows 10 Pro', 'Gadgets', 199, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'windows_11_home', 'Windows 11 Home', 'Gadgets', 699, 699, true),
  ('laptop_repair_services', 'Laptop Repair Services', 'windows_11_pro', 'Windows 11 Pro', 'Gadgets', 599, 699, true),

  -- Computer
  ('computer_repair_services', 'Computer Repair Services', 'desktop_general_service', 'Desktop General Service', 'Gadgets', 399, 999, true),
  ('computer_repair_services', 'Computer Repair Services', 'windows_install_format', 'Windows Install / Format', 'Gadgets', 499, 1099, true),
  ('computer_repair_services', 'Computer Repair Services', 'slow_pc_speed_boost', 'Slow PC Speed Boost', 'Gadgets', 349, 899, true),
  ('computer_repair_services', 'Computer Repair Services', 'ram_ssd_upgrade_support', 'RAM / SSD Upgrade Support', 'Gadgets', 299, 799, true),
  ('computer_repair_services', 'Computer Repair Services', 'motherboard_power_issue', 'Motherboard / Power Issue', 'Gadgets', 599, 1499, true),
  ('computer_repair_services', 'Computer Repair Services', 'lan_wifi_network_fix', 'LAN / WiFi / Network Fix', 'Gadgets', 249, 699, true),

  -- TV
  ('tv_repair_services', 'TV Repair Services', 'general_tv_repair', 'General TV Repair', 'Gadgets', 299, 899, true),
  ('tv_repair_services', 'TV Repair Services', 'led_screen_fix', 'LED Screen Fix', 'Gadgets', 2499, 6499, true),
  ('tv_repair_services', 'TV Repair Services', 'board_repair', 'Board Repair', 'Gadgets', 1999, 3999, true),
  ('tv_repair_services', 'TV Repair Services', 'sound_system_fix', 'Sound System Fix', 'Gadgets', 499, 1499, true),
  ('tv_repair_services', 'TV Repair Services', 'tv_installation', 'TV Installation', 'Gadgets', 899, 1999, true),
  ('tv_repair_services', 'TV Repair Services', 'smart_tv_setup', 'Smart TV Setup', 'Gadgets', 299, 999, true),

  -- AC
  ('ac_repair_services', 'AC Repair Services', 'ac_check_up', 'AC Check-up', 'Cooling', 299, 299, true),
  ('ac_repair_services', 'AC Repair Services', 'ac_regular_service', 'AC Regular Service', 'Cooling', 499, 499, true),
  ('ac_repair_services', 'AC Repair Services', 'ac_installation', 'AC Installation', 'Cooling', 799, 799, true),
  ('ac_repair_services', 'AC Repair Services', 'ac_uninstallation', 'AC Uninstallation', 'Cooling', 399, 399, true),
  ('ac_repair_services', 'AC Repair Services', 'gas_top_up', 'Gas Top-up', 'Cooling', 1999, 1999, true),

  -- Fridge
  ('fridge_repair_services', 'Fridge Repair Services', 'fridge_gas_refill', 'Fridge Gas Refill', 'Appliances', 179, 499, true),
  ('fridge_repair_services', 'Fridge Repair Services', 'fridge_deep_clean', 'Fridge Deep Clean', 'Appliances', 129, 644, true),
  ('fridge_repair_services', 'Fridge Repair Services', 'fridge_install', 'Fridge Install', 'Appliances', 149, 499, true),
  ('fridge_repair_services', 'Fridge Repair Services', 'fridge_repair', 'Fridge Repair', 'Appliances', 159, 999, true),
  ('fridge_repair_services', 'Fridge Repair Services', 'compressor_fix', 'Compressor Fix', 'Appliances', 299, 899, true),

  -- Washing Machine
  ('washing_machine_repair_services', 'Washing Machine Repair Services', 'drum_issue', 'Drum Issue', 'Appliances', 399, 999, true),
  ('washing_machine_repair_services', 'Washing Machine Repair Services', 'deep_cleaning', 'Deep Cleaning', 'Appliances', 299, 799, true),
  ('washing_machine_repair_services', 'Washing Machine Repair Services', 'motor_repair', 'Motor Repair', 'Appliances', 599, 1999, true),
  ('washing_machine_repair_services', 'Washing Machine Repair Services', 'drainage_issue', 'Drainage Issue', 'Appliances', 199, 499, true),
  ('washing_machine_repair_services', 'Washing Machine Repair Services', 'installation', 'Installation', 'Appliances', 499, 999, true),

  -- RO
  ('ro_purifier_repair_services', 'RO Purifier Repair Services', 'ro_filter_change', 'RO Filter Change', 'Purifiers', 399, 1199, true),
  ('ro_purifier_repair_services', 'RO Purifier Repair Services', 'ro_general_service', 'RO General Service', 'Purifiers', 249, 699, true),
  ('ro_purifier_repair_services', 'RO Purifier Repair Services', 'ro_leakage_repair', 'RO Leakage Repair', 'Purifiers', 299, 999, true),
  ('ro_purifier_repair_services', 'RO Purifier Repair Services', 'ro_installation_re_installation', 'RO Installation / Re-installation', 'Purifiers', 499, 1299, true),
  ('ro_purifier_repair_services', 'RO Purifier Repair Services', 'tds_taste_correction', 'TDS & Taste Correction', 'Purifiers', 199, 499, true),
  ('ro_purifier_repair_services', 'RO Purifier Repair Services', 'amc_plan_support', 'AMC Plan Support', 'Purifiers', 349, 999, true),

  -- Aquaguard
  ('aquaguard_repair_services', 'Aquaguard Repair Services', 'aquaguard_cartridge_change', 'Aquaguard Cartridge Change', 'Purifiers', 449, 1299, true),
  ('aquaguard_repair_services', 'Aquaguard Repair Services', 'aquaguard_deep_service', 'Aquaguard Deep Service', 'Purifiers', 299, 799, true),
  ('aquaguard_repair_services', 'Aquaguard Repair Services', 'no_water_output_repair', 'No Water Output Repair', 'Purifiers', 349, 1199, true),
  ('aquaguard_repair_services', 'Aquaguard Repair Services', 'aquaguard_installation', 'Aquaguard Installation', 'Purifiers', 499, 1399, true),
  ('aquaguard_repair_services', 'Aquaguard Repair Services', 'taste_odor_correction', 'Taste / Odor Correction', 'Purifiers', 249, 699, true),
  ('aquaguard_repair_services', 'Aquaguard Repair Services', 'annual_service_check', 'Annual Service Check', 'Purifiers', 399, 999, true),

  -- Cooler
  ('cooler_repair_services', 'Cooler Repair Services', 'cooler_check_up', 'Cooler Check-up', 'Cooling', 249, 249, true),
  ('cooler_repair_services', 'Cooler Repair Services', 'cooler_deep_cleaning', 'Cooler Deep Cleaning', 'Cooling', 399, 399, true),
  ('cooler_repair_services', 'Cooler Repair Services', 'cooling_issue_repair', 'Cooling Issue Repair', 'Cooling', 599, 599, true),
  ('cooler_repair_services', 'Cooler Repair Services', 'water_pump_repair', 'Water Pump Repair', 'Cooling', 499, 499, true),
  ('cooler_repair_services', 'Cooler Repair Services', 'cooler_installation', 'Cooler Installation', 'Cooling', 699, 699, true),

  -- Fan
  ('fan_repair_services', 'Fan Repair Services', 'ceiling_fan_service', 'Ceiling Fan Service', 'Cooling', 249, 899, true),
  ('fan_repair_services', 'Fan Repair Services', 'table_fan_service', 'Table Fan Service', 'Cooling', 199, 699, true),

  -- Emergency
  ('full_bike_service', 'Full Bike Service', 'full_bike_service', 'Full Bike Service', 'Emergency', 499, 1299, true),
  ('car_repair_services', 'Car Repair Services', 'car_repair_services', 'Car Repair Services', 'Emergency', 699, 3999, true)
on conflict (service_key) do update set
  parent_service_key = excluded.parent_service_key,
  parent_service_name = excluded.parent_service_name,
  service_name = excluded.service_name,
  service_category = excluded.service_category,
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  is_active = excluded.is_active,
  updated_at = now();
