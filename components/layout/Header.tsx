"use client";

import { Button } from "@/components/ui/Button";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationsDropdown } from "@/components/layout/NotificationsDropdown";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0e1a]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="mx-4 flex-1 max-w-xl">
          <GlobalSearch />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <NotificationsDropdown />

          <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
