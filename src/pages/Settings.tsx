import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { User, Building, Bell as BellIcon, Shield, Palette } from "lucide-react";

const sections = [
  { title: "Profile", desc: "Update your personal information", icon: User },
  { title: "Business", desc: "Manage business details and branding", icon: Building },
  { title: "Notifications", desc: "Configure notification preferences", icon: BellIcon },
  { title: "Security", desc: "Password and two-factor authentication", icon: Shield },
  { title: "Appearance", desc: "Customize the look and feel", icon: Palette },
];

const SettingsPage = () => {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your admin panel preferences</p>
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sections.map((s) => (
            <StaggerItem key={s.title}>
              <div className="glass-card flex cursor-pointer items-center gap-4 p-5 transition-all hover:border-primary/30 hover-lift">
                <div className="rounded-lg bg-primary/10 p-3">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </AnimatedPage>
  );
};

export default SettingsPage;
