import { AnimatedPage } from "@/components/AnimatedPage";
import { useState } from "react";
import { Search, Send, Phone, Video, MoreVertical, Paperclip, Smile, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

const contacts = [
  { id: 1, name: "Sarah Johnson", avatar: "SJ", lastMsg: "Thanks for the quick service!", time: "2m", unread: 2, online: true },
  { id: 2, name: "CleanPro Team", avatar: "CP", lastMsg: "We'll be there at 10 AM", time: "15m", unread: 0, online: true },
  { id: 3, name: "Mike Chen", avatar: "MC", lastMsg: "Can I reschedule to Friday?", time: "1h", unread: 1, online: false },
  { id: 4, name: "John's Plumbing", avatar: "JP", lastMsg: "Job completed, invoice sent", time: "2h", unread: 0, online: true },
  { id: 5, name: "Emily Davis", avatar: "ED", lastMsg: "Great work on the wiring!", time: "3h", unread: 0, online: false },
  { id: 6, name: "ElectriFix", avatar: "EF", lastMsg: "Parts arrived, ready to start", time: "5h", unread: 0, online: false },
];

const messages = [
  { id: 1, sender: "them", text: "Hi! I wanted to check on my booking for deep cleaning tomorrow.", time: "10:30 AM", status: "read" },
  { id: 2, sender: "me", text: "Hello Sarah! Yes, your booking is confirmed for tomorrow at 10 AM.", time: "10:32 AM", status: "read" },
  { id: 3, sender: "them", text: "Perfect! Will it be the same team as last time?", time: "10:33 AM", status: "read" },
  { id: 4, sender: "me", text: "Yes, the CleanPro team has been assigned. They'll arrive with all necessary supplies.", time: "10:35 AM", status: "read" },
  { id: 5, sender: "them", text: "Wonderful! Also, can you add window cleaning to the service?", time: "10:36 AM", status: "read" },
  { id: 6, sender: "me", text: "Of course! I've added window cleaning. The updated total is $220. I'll send a revised confirmation shortly.", time: "10:38 AM", status: "delivered" },
  { id: 7, sender: "them", text: "Thanks for the quick service!", time: "10:39 AM", status: "read" },
];

const Chat = () => {
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [inputValue, setInputValue] = useState("");

  return (
    <AnimatedPage>
      <div className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-xl border border-border/50">
        {/* Contacts sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-border/50 bg-card/50 flex flex-col">
          <div className="border-b border-border/50 p-4">
            <h2 className="font-display text-lg font-bold text-foreground">Messages</h2>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search conversations..." className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((c) => (
              <motion.div
                key={c.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedContact(c)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20 ${selectedContact.id === c.id ? "bg-muted/30 border-l-2 border-l-primary" : ""}`}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                    <span className="text-xs font-bold text-primary">{c.avatar}</span>
                  </div>
                  {c.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground truncate">{c.name}</h4>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{c.unread}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-xs font-bold text-primary">{selectedContact.avatar}</span>
                </div>
                {selectedContact.online && <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-card bg-success" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{selectedContact.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedContact.online ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Phone className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Video className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${m.sender === "me" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted/50 text-foreground rounded-bl-md"}`}>
                  <p className="text-sm">{m.text}</p>
                  <div className={`mt-1 flex items-center justify-end gap-1 ${m.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    <span className="text-[10px]">{m.time}</span>
                    {m.sender === "me" && (m.status === "read" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Paperclip className="h-4 w-4" /></button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Smile className="h-4 w-4" /></button>
              <button className="rounded-lg bg-primary p-2.5 text-primary-foreground transition-colors hover:bg-primary/90"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Chat;
