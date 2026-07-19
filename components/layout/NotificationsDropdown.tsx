"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, X, Check, Trash2, Search, Filter, AlertCircle, Calendar, CheckSquare, Target, Trophy, HelpCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleAction = async (action: string, id?: string) => {
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (_) {}
  };

  const notificationTypes = [
    "KPI Updates",
    "Task Updates",
    "Achievement Updates",
    "Approval Requests",
    "Approval Decisions",
    "Airtable Sync",
    "Settings Changes",
    "System Alerts"
  ];

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType ? n.type === filterType : true;
      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, filterType]);

  const getIcon = (type: string) => {
    switch (type) {
      case "KPI Updates": return <Target className="h-4 w-4 text-blue-400" />;
      case "Task Updates": return <CheckSquare className="h-4 w-4 text-purple-400" />;
      case "Achievement Updates": return <Trophy className="h-4 w-4 text-yellow-400" />;
      case "Approval Requests":
      case "Approval Decisions": return <Layers className="h-4 w-4 text-indigo-400" />;
      case "Airtable Sync": return <AlertCircle className="h-4 w-4 text-teal-400" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-400 hover:text-white"
        onClick={() => {
          setIsOpen(true);
          fetchNotifications();
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#0a0e1a]">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-l border-white/10 bg-slate-950 p-6 shadow-2xl flex flex-col justify-between h-full animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Bell className="mr-2 h-5 w-5 text-blue-400" /> Notifications ({notifications.length})
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Stay updated with latest project changes</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {notificationTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Bulk actions */}
              <div className="flex justify-between items-center mb-4 text-xs text-slate-500">
                <button onClick={() => handleAction("mark-all-read")} className="hover:text-blue-400 flex items-center font-medium">
                  <Check className="mr-1 h-3.5 w-3.5" /> Mark all read
                </button>
                <button onClick={() => handleAction("clear-all")} className="hover:text-red-400 flex items-center font-medium">
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear all
                </button>
              </div>

              {/* Notifications List */}
              <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                {loading && (
                  <div className="space-y-2">
                    <div className="h-12 w-full bg-white/5 rounded animate-pulse" />
                    <div className="h-12 w-full bg-white/5 rounded animate-pulse" />
                  </div>
                )}

                {!loading && filteredNotifications.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-12">
                    No notifications matching filters.
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`p-3 rounded-lg border transition-all ${
                        n.read 
                          ? "bg-white/5 border-white/5 opacity-60" 
                          : "bg-blue-500/5 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.05)]"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-white truncate pr-1">{n.title}</span>
                            <span className="text-[9px] text-gray-500 font-mono flex-shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-2 border-t border-white/5 pt-2 text-[10px]">
                        {!n.read && (
                          <button onClick={() => handleAction("mark-read", n.id)} className="text-blue-400 hover:text-white flex items-center">
                            <Check className="h-3 w-3 mr-0.5" /> Read
                          </button>
                        )}
                        <button onClick={() => handleAction("delete", n.id)} className="text-gray-500 hover:text-red-400 flex items-center">
                          <Trash2 className="h-3 w-3 mr-0.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button onClick={() => setIsOpen(false)} className="w-full justify-center mt-6">
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

