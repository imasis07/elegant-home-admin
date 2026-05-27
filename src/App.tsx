import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { AuthProvider } from "@/auth/AuthContext";
import { RequireAal2, RequireAuth } from "@/auth/RouteGuards";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Services from "./pages/Services";
import ServicePartners from "./pages/ServicePartners";
import Customers from "./pages/Customers";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";
import EmailPage from "./pages/EmailPage";
import Withdrawal from "./pages/Withdrawal";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import KycPage from "./pages/KycPage";
import ServicePrices from "./pages/ServicePrices";
import HomeBanners from "./pages/HomeBanners";
import WebhookTest from "./pages/WebhookTest";
import Login from "./pages/Login";
import MfaSetup from "./pages/MfaSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/mfa"
              element={
                <RequireAuth>
                  <MfaSetup />
                </RequireAuth>
              }
            />
            <Route
              element={
                <RequireAal2>
                  <AdminLayout />
                </RequireAal2>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/services" element={<Services />} />
              <Route path="/service-prices" element={<ServicePrices />} />
              <Route path="/home-banners" element={<HomeBanners />} />
              <Route path="/partners" element={<ServicePartners />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/kyc" element={<KycPage />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/email" element={<EmailPage />} />
              <Route path="/webhook-test" element={<WebhookTest />} />
              <Route path="/withdrawals" element={<Withdrawal />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
