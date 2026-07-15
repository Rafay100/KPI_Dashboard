"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

const notifications = [
  { title: "KPI update approved", detail: "Q3 Revenue target moved to 92%", time: "3m ago" },
  { title: "Overdue KPI", detail: "Engineering delivery is behind target", time: "18m ago" },
  { title: "Failed sync", detail: "Airtable sync failed for tasks table", time: "1h ago" },
];

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white" onClick={() => setOpen((value) => !value)}>
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
      </Button>

      {open ? (
        <div className="absolute right-0 top-12 w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl">
          <div className="mb-2 px-2 text-sm font-semibold text-white">Notifications</div>
          <div className="space-y-2">
            {notifications.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="mt-1 text-sm text-slate-400">{item.detail}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
