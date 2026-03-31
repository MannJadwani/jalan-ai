"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import type { UserRole } from "../lib/auth";

const allNavItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  glow: string;
  activeColor: string;
  activeBg: string;
  dot: string;
  roles: UserRole[];
}> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    glow: "icon-glow-cyan",
    activeColor: "text-cyan-400",
    activeBg: "bg-cyan-500/8 border-cyan-500/15",
    dot: "bg-cyan-400",
    roles: ["admin"],
  },
  {
    href: "/chat",
    label: "AI Chat",
    icon: MessageSquare,
    glow: "icon-glow-emerald",
    activeColor: "text-emerald-400",
    activeBg: "bg-emerald-500/8 border-emerald-500/15",
    dot: "bg-emerald-400",
    roles: ["admin", "member"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { session, logout } = useAuth();

  // Filter nav items by role
  const navItems = allNavItems.filter(
    (item) => session && item.roles.includes(session.role)
  );

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-60"
      } h-screen flex flex-col bg-[#0c0c0e] border-r border-[#1c1c1f] transition-all duration-300 flex-shrink-0 relative`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[#1c1c1f]">
        <div className="w-9 h-9 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center flex-shrink-0 shadow-md shadow-black/40">
          <Zap className="w-5 h-5 text-cyan-400 icon-glow-cyan" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white whitespace-nowrap tracking-tight">
              Jalan AI
            </h1>
            <p className="text-[10px] text-zinc-600 whitespace-nowrap">
              {session?.role === "admin"
                ? "Director\u0027s Dashboard"
                : "Business Chat"}
            </p>
          </div>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-[#161618] border border-[#2a2a2f] flex items-center justify-center text-zinc-500 hover:text-white transition-all z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border ${
                isActive
                  ? `${item.activeBg} ${item.activeColor}`
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-transparent"
              }`}
            >
              <item.icon
                className={`w-[18px] h-[18px] flex-shrink-0 ${
                  isActive
                    ? `${item.activeColor} ${item.glow}`
                    : "text-zinc-600 group-hover:text-zinc-400"
                }`}
              />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div
                  className={`ml-auto w-1.5 h-1.5 rounded-full ${item.dot} phosphor-pulse`}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-[#1c1c1f] space-y-1">
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md shadow-cyan-500/10">
            {session?.initials || "??"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {session?.displayName || "User"}
              </p>
              <p className="text-[10px] text-zinc-600 truncate capitalize">
                {session?.role || ""}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/5 transition-all w-full text-sm ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
