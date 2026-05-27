import { AnimatedPage } from "@/components/AnimatedPage";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { Search, Plus, Star, Mail, MailOpen, Trash2, Archive, Reply, Clock, Paperclip } from "lucide-react";
import { useState } from "react";

const emails = [
  { id: 1, from: "Sarah Johnson", email: "sarah@email.com", subject: "Feedback on Deep Cleaning Service", preview: "Hi, I wanted to share how satisfied I was with the deep cleaning service yesterday. The team was professional and thorough...", time: "10:42 AM", read: false, starred: true, hasAttachment: false },
  { id: 2, from: "CleanPro Team", email: "team@cleanpro.com", subject: "Monthly Performance Report", preview: "Please find attached the monthly performance report for February 2026. Key highlights include a 15% increase in bookings...", time: "9:15 AM", read: false, starred: false, hasAttachment: true },
  { id: 3, from: "Mike Chen", email: "mike@email.com", subject: "Re: Plumbing Repair Invoice", preview: "Thanks for sending the invoice. I've processed the payment via bank transfer. Please confirm once received...", time: "Yesterday", read: true, starred: false, hasAttachment: false },
  { id: 4, from: "ElectriFix", email: "hello@electrifix.com", subject: "New Service Pricing Update", preview: "We've updated our service pricing effective March 1, 2026. Please review the attached rate card and let us know if...", time: "Yesterday", read: true, starred: true, hasAttachment: true },
  { id: 5, from: "Support Team", email: "support@homeserv.com", subject: "Customer Complaint - Booking #B-1035", preview: "A customer has raised a complaint regarding booking #B-1035. The issue relates to delayed arrival of the service team...", time: "Mar 1", read: true, starred: false, hasAttachment: false },
  { id: 6, from: "Lisa Anderson", email: "lisa@email.com", subject: "Cancellation Request Confirmation", preview: "I'm writing to confirm the cancellation of my house painting booking. I understand the cancellation policy and...", time: "Mar 1", read: true, starred: false, hasAttachment: false },
  { id: 7, from: "GreenCare", email: "green@care.com", subject: "Partnership Proposal", preview: "We would like to discuss expanding our partnership to include seasonal landscaping services in addition to...", time: "Feb 28", read: true, starred: true, hasAttachment: true },
];

const EmailPage = () => {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const selected = emails.find((e) => e.id === selectedEmail);

  return (
    <AnimatedPage>
      <div className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-xl border border-border/50">
        {/* Email list */}
        <div className={`${selected ? "hidden lg:flex" : "flex"} w-full lg:w-96 flex-shrink-0 border-r border-border/50 bg-card/50 flex-col`}>
          <div className="border-b border-border/50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Inbox</h2>
              <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3 w-3" /> Compose
              </button>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search emails..." className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {emails.map((e) => (
              <div
                key={e.id}
                onClick={() => setSelectedEmail(e.id)}
                className={`cursor-pointer border-b border-border/20 px-4 py-3 transition-colors hover:bg-muted/20 ${selectedEmail === e.id ? "bg-muted/30 border-l-2 border-l-primary" : ""} ${!e.read ? "bg-muted/10" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className={`${e.starred ? "text-primary" : "text-muted-foreground/30"}`}>
                      <Star className={`h-3.5 w-3.5 ${e.starred ? "fill-primary" : ""}`} />
                    </button>
                    <h4 className={`text-sm ${!e.read ? "font-semibold text-foreground" : "text-foreground/80"}`}>{e.from}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {e.hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground">{e.time}</span>
                  </div>
                </div>
                <p className={`mt-0.5 text-xs ${!e.read ? "font-medium text-foreground/90" : "text-muted-foreground"}`}>{e.subject}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">{e.preview}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email detail */}
        <div className={`${selected ? "flex" : "hidden lg:flex"} flex-1 flex-col`}>
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
                <button onClick={() => setSelectedEmail(null)} className="text-xs text-muted-foreground hover:text-foreground lg:hidden">← Back</button>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Reply className="h-4 w-4" /></button>
                  <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Archive className="h-4 w-4" /></button>
                  <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="font-display text-xl font-bold text-foreground">{selected.subject}</h2>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                    <span className="text-xs font-bold text-primary">{selected.from.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selected.from}</p>
                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{selected.time}</span>
                </div>
                <div className="mt-6 text-sm leading-relaxed text-foreground/80">
                  <p>{selected.preview}</p>
                  <br />
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
                  <br />
                  <p>Best regards,<br />{selected.from}</p>
                </div>
              </div>
              <div className="border-t border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <input type="text" placeholder="Write a reply..." className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                  <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MailOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default EmailPage;
