"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  AlertTriangle,
  Sparkles,
  Package,
  Users,
  Clock,
  RefreshCw,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { ProtectedRoute } from "../lib/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── TYPES ───────────────────────────────────────────────────────────────

interface MonthlySaleFormatted {
  month: string;
  revenue_formatted: string;
}

interface MonthlySaleRaw {
  month: string;
  total_revenue: string;
}

interface CustomerRevenue {
  customer_id: string;
  customer_name: string;
  total_revenue: string;
}

interface StockoutItem {
  product_sku: string;
  brand_name: string;
  group_name: string;
  current_stock_qty: number;
}

interface DuesItem {
  customer_id: string;
  customer_name: string;
  total_due_amount: string;
  credit_limit: string;
  risk_status: string;
  utilization_pct: string | null;
}

// ─── PRODUCT PERFORMANCE (no webhook yet) ────────────────────────────────

const productPerformanceData = [
  { name: "Poplin", value: 35, fill: "#22d3ee" },
  { name: "PC Poplin", value: 20, fill: "#34d399" },
  { name: "Shirting", value: 14, fill: "#fb923c" },
  { name: "PC Rubia", value: 11, fill: "#f472b6" },
  { name: "TH Voile", value: 8, fill: "#60a5fa" },
  { name: "D Meteri", value: 6, fill: "#fbbf24" },
  { name: "Roto", value: 4, fill: "#a78bfa" },
  { name: "Others", value: 2, fill: "#6b7280" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────

function parseCrValue(formatted: string): number {
  const match = formatted.match(/([\d.]+)\s*Cr/);
  return match ? parseFloat(match[1]) : 0;
}

function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function shortenName(name: string, maxLen = 28): string {
  let clean = name.replace(/-C$|-CC$|-K$/, "").trim();
  if (clean.length > maxLen) clean = clean.substring(0, maxLen) + "…";
  return clean;
}

function getRiskBadge(risk: string) {
  if (risk.includes("Critical"))
    return { label: "CRITICAL", color: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" };
  if (risk.includes("High"))
    return { label: "HIGH", color: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-400" };
  if (risk.includes("Medium"))
    return { label: "MEDIUM", color: "bg-amber-500/15 text-amber-400 border-amber-500/25", dot: "bg-amber-400" };
  if (risk.includes("Low"))
    return { label: "LOW", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" };
  return { label: "NO LIMIT", color: "bg-zinc-500/15 text-zinc-500 border-zinc-500/25", dot: "bg-zinc-500" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SalesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="card-embossed rounded-lg px-4 py-3">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-bold text-white">₹{payload[0].value.toFixed(2)} Cr</p>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomerTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="card-embossed rounded-lg px-4 py-3 max-w-xs">
        <p className="text-[10px] text-zinc-500 mb-1">{payload[0].payload.fullName}</p>
        <p className="text-sm font-bold text-white">{formatINR(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ─── MAIN ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [monthlySales, setMonthlySales] = useState<{ month: string; revenue: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; fullName: string; revenue: number }[]>([]);
  const [stockouts, setStockouts] = useState<StockoutItem[]>([]);
  const [dues, setDues] = useState<DuesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();

      if (data.monthlySales) {
        let salesArr: Array<MonthlySaleFormatted | MonthlySaleRaw> = [];
        if (Array.isArray(data.monthlySales)) {
          if (data.monthlySales[0]?.output?.monthly_sales) {
            salesArr = data.monthlySales[0].output.monthly_sales;
          } else {
            salesArr = data.monthlySales;
          }
        } else if (data.monthlySales?.output?.monthly_sales) {
          salesArr = data.monthlySales.output.monthly_sales;
        } else if (data.monthlySales && typeof data.monthlySales === "object") {
          salesArr = [data.monthlySales];
        }

        setMonthlySales(
          salesArr.map((item) => {
            if ("revenue_formatted" in item) {
              return {
                month: item.month.replace(/\s*20(\d{2})/, " '$1"),
                revenue: parseCrValue(item.revenue_formatted),
              };
            }
            const raw = item as MonthlySaleRaw;
            const date = new Date(raw.month);
            const monthLabel = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
            const revenueInCr = parseFloat(raw.total_revenue) / 10000000;
            return {
              month: monthLabel,
              revenue: parseFloat(revenueInCr.toFixed(2)),
            };
          })
        );
      }

      if (data.topCustomers) {
        const raw: CustomerRevenue[] = Array.isArray(data.topCustomers)
          ? data.topCustomers
          : data.topCustomers && typeof data.topCustomers === "object"
          ? [data.topCustomers]
          : [];
        setTopCustomers(
          raw.map((item) => ({
            name: shortenName(item.customer_name, 22),
            fullName: item.customer_name,
            revenue: parseFloat(item.total_revenue),
          }))
        );
      }

      if (data.stockouts) {
        setStockouts(
          Array.isArray(data.stockouts)
            ? data.stockouts
            : data.stockouts && typeof data.stockouts === "object"
            ? [data.stockouts]
            : []
        );
      }

      if (data.outstandingDues) {
        const rawDues: DuesItem[] = Array.isArray(data.outstandingDues)
          ? data.outstandingDues
          : data.outstandingDues && typeof data.outstandingDues === "object"
          ? [data.outstandingDues]
          : [];

        const riskOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        rawDues.sort((a, b) => {
          const aRisk = Object.keys(riskOrder).find((k) => a.risk_status.includes(k));
          const bRisk = Object.keys(riskOrder).find((k) => b.risk_status.includes(k));
          const aOrder = aRisk ? riskOrder[aRisk] : 4;
          const bOrder = bRisk ? riskOrder[bRisk] : 4;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return parseFloat(b.total_due_amount) - parseFloat(a.total_due_amount);
        });

        setDues(rawDues);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalRevenue = monthlySales.reduce((sum, m) => sum + m.revenue, 0);
  const criticalStockouts = stockouts.filter((s) => s.current_stock_qty < -10000).length;
  const criticalDues = dues.filter((d) => d.risk_status.includes("Critical")).length;

  const LoadingSkeleton = ({ h = "h-[300px]" }: { h?: string }) => (
    <div className={`${h} flex items-center justify-center`}>
      <RefreshCw className="w-5 h-5 text-zinc-700 animate-spin" />
    </div>
  );

  return (
    <ProtectedRoute>
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pt-[60px] md:pt-0">
        {/* ─── HEADER ──────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 glass border-b border-[#1c1c1f] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">Director&apos;s Dashboard</h1>
              <p className="text-[10px] sm:text-xs text-zinc-600 mt-0.5 truncate">
                Business intelligence overview
                {lastUpdated && <span className="hidden sm:inline"> &middot; Last synced {lastUpdated}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg card-embossed text-zinc-400 hover:text-white transition-all text-xs font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link
                href="/chat"
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/15"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask AI</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">
          {/* ─── STAT CARDS ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                title: "Total Revenue",
                value: `₹${totalRevenue.toFixed(1)} Cr`,
                sub: `${monthlySales.length} months tracked`,
                icon: IndianRupee,
                iconColor: "text-cyan-400",
                iconGlow: "icon-glow-cyan",
              },
              {
                title: "Top Customers",
                value: topCustomers.length.toString(),
                sub: "Ranked by last month revenue",
                icon: Users,
                iconColor: "text-emerald-400",
                iconGlow: "icon-glow-emerald",
              },
              {
                title: "Critical Deficit",
                value: criticalStockouts.toString(),
                sub: `${stockouts.length} total items out of stock`,
                icon: Package,
                iconColor: "text-rose-400",
                iconGlow: "icon-glow-rose",
              },
              {
                title: "Credit Risk",
                value: `${criticalDues} Critical`,
                sub: `${dues.length} accounts monitored`,
                icon: ShieldAlert,
                iconColor: "text-amber-400",
                iconGlow: "icon-glow-amber",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
              >
                <div className="card-embossed rounded-xl p-3 sm:p-5 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5 sm:space-y-2.5 min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{card.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
                        {loading ? <span className="inline-block w-16 sm:w-20 h-6 sm:h-7 bg-white/[0.03] rounded shimmer" /> : card.value}
                      </p>
                      <p className="text-[9px] sm:text-[11px] text-zinc-600 truncate">{card.sub}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center shadow-inner shadow-black/20 flex-shrink-0 ml-2">
                      <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor} ${card.iconGlow}`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ─── ROW 1: MONTHLY SALES TREND ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="card-embossed rounded-xl p-3 sm:p-5"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 icon-glow-cyan" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Monthly Sales Trend</h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-600 hidden sm:block">Revenue over the last 12 months</p>
                </div>
              </div>
              {monthlySales.length > 1 && (() => {
                const change = ((monthlySales[monthlySales.length - 1].revenue - monthlySales[0].revenue) / monthlySales[0].revenue) * 100;
                const isUp = change > 0;
                return (
                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-md ${isUp ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                );
              })()}
            </div>
            {loading ? <LoadingSkeleton h="h-[200px] sm:h-[300px]" /> : (
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySales}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
                    <XAxis dataKey="month" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}Cr`} width={55} />
                    <Tooltip content={<SalesTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#salesGrad)" dot={{ fill: "#09090b", stroke: "#22d3ee", strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: "#22d3ee", stroke: "#09090b", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* ─── ROW 2: TOP CUSTOMERS | PRODUCT DONUT ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Top Customers */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="lg:col-span-3 card-embossed rounded-xl p-3 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 icon-glow-emerald" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white">Top 50 Customers</h3>
                    <p className="text-[10px] sm:text-[11px] text-zinc-600 hidden sm:block">Last month&apos;s highest spenders</p>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] text-zinc-600 bg-[#161618] border border-[#2a2a2f] px-2 py-1 rounded-md font-mono">
                  {topCustomers.length} records
                </span>
              </div>
              {loading ? <LoadingSkeleton h="h-[300px] sm:h-[400px]" /> : (
                <div className="h-[350px] sm:h-[500px] overflow-y-auto pr-1">
                  <ResponsiveContainer width="100%" height={topCustomers.length * 28}>
                    <BarChart data={topCustomers} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={9} width={120} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomerTooltip />} />
                      <Bar dataKey="revenue" fill="url(#barGrad)" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* Product Performance Donut */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="lg:col-span-2 card-embossed rounded-xl p-3 sm:p-5"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center flex-shrink-0">
                  <PieChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 icon-glow-amber" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Product Performance</h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-600 hidden sm:block">Sales split by category (12mo)</p>
                </div>
              </div>
              <div className="h-[200px] sm:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productPerformanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="65%"
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {productPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => `${value}%`}
                      contentStyle={{
                        background: "#111113",
                        border: "1px solid #1f1f23",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#e4e4e7",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                {productPerformanceData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.fill, boxShadow: `0 0 6px ${cat.fill}40` }} />
                    <span className="text-zinc-400 truncate">{cat.name}</span>
                    <span className="text-zinc-600 ml-auto font-mono">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── ROW 3: STOCKOUT ALERTS ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="card-embossed rounded-xl p-3 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 icon-glow-rose phosphor-pulse" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Stockout Alerts</h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-600 hidden sm:block">Products with negative stock levels</p>
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-rose-500/20 tracking-wider uppercase">
                {stockouts.length} items
              </span>
            </div>

            {loading ? <LoadingSkeleton h="h-[200px]" /> : (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1c1c1f]">
                      {["Product SKU", "Brand", "Category", "Stock Deficit", "Severity"].map((h) => (
                        <th key={h} className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[9px] sm:text-[10px] font-semibold text-zinc-600 uppercase tracking-wider ${h === "Stock Deficit" ? "text-right" : h === "Severity" ? "text-center" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stockouts.map((item, i) => {
                      const isCritical = item.current_stock_qty < -10000;
                      return (
                        <tr key={`${item.product_sku}-${i}`} className={`border-b border-[#1c1c1f]/50 hover:bg-white/[0.01] transition-colors ${isCritical ? "bg-rose-500/[0.02]" : ""}`}>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 font-semibold text-white text-[11px] sm:text-xs">{item.product_sku}</td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-zinc-400 text-[11px] sm:text-xs">{shortenName(item.brand_name, 30)}</td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-zinc-600 text-[11px] sm:text-xs">{item.group_name}</td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-rose-400 text-[11px] sm:text-xs">
                            {Math.round(item.current_stock_qty).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-center">
                            <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded border ${isCritical ? "bg-red-500/15 text-red-400 border-red-500/25" : "bg-orange-500/15 text-orange-400 border-orange-500/25"}`}>
                              <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isCritical ? "bg-red-400 phosphor-pulse" : "bg-orange-400"}`} />
                              {isCritical ? "CRITICAL" : "LOW"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* ─── ROW 4: OUTSTANDING DUES & CREDIT RISK ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="card-embossed rounded-xl p-3 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 icon-glow-amber" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Outstanding Dues & Credit Risk</h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-600 hidden sm:block">Top 50 customers by outstanding amount</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap ml-10 sm:ml-0">
                {[
                  { key: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/20" },
                  { key: "High", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                  { key: "Medium", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  { key: "Low", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                ].map(({ key, color }) => {
                  const count = dues.filter((d) => d.risk_status.includes(key)).length;
                  if (count === 0) return null;
                  return (
                    <span key={key} className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border ${color}`}>
                      {count} {key}
                    </span>
                  );
                })}
              </div>
            </div>

            {loading ? <LoadingSkeleton h="h-[200px]" /> : (
              <div className="overflow-x-auto max-h-[400px] sm:max-h-[500px] overflow-y-auto -mx-3 sm:mx-0">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="sticky top-0 bg-[#111113] z-10">
                    <tr className="border-b border-[#1c1c1f]">
                      {["#", "Customer", "Outstanding", "Credit Limit", "Utilization", "Risk"].map((h) => (
                        <th key={h} className={`py-2.5 sm:py-3 px-3 sm:px-4 text-[9px] sm:text-[10px] font-semibold text-zinc-600 uppercase tracking-wider ${["Outstanding", "Credit Limit"].includes(h) ? "text-right" : h === "Utilization" || h === "Risk" ? "text-center" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dues.map((item, i) => {
                      const badge = getRiskBadge(item.risk_status);
                      const dueAmount = parseFloat(item.total_due_amount);
                      const creditLimit = parseFloat(item.credit_limit);
                      const utilization = item.utilization_pct ? parseFloat(item.utilization_pct) : null;

                      return (
                        <tr key={item.customer_id} className={`border-b border-[#1c1c1f]/50 hover:bg-white/[0.01] transition-colors ${item.risk_status.includes("Critical") ? "bg-red-500/[0.015]" : ""}`}>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-zinc-700 font-mono text-[9px] sm:text-[10px]">{i + 1}</td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4">
                            <p className="font-medium text-zinc-200 text-[11px] sm:text-xs">{shortenName(item.customer_name, 38)}</p>
                            <p className="text-[8px] sm:text-[9px] text-zinc-700 font-mono mt-0.5">{item.customer_id}</p>
                          </td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-white text-[11px] sm:text-xs">{formatINR(dueAmount)}</td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-right font-mono text-zinc-500 text-[11px] sm:text-xs">{creditLimit > 0 ? formatINR(creditLimit) : "—"}</td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4">
                            {utilization !== null ? (
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <div className="w-10 sm:w-14 h-1.5 bg-[#1c1c1f] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      utilization > 100 ? "bg-red-500" : utilization > 90 ? "bg-orange-500" : utilization > 75 ? "bg-amber-500" : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${Math.min(utilization, 100)}%`, boxShadow: utilization > 90 ? "0 0 6px rgba(239,68,68,0.3)" : "none" }}
                                  />
                                </div>
                                <span className={`text-[9px] sm:text-[10px] font-mono font-semibold ${utilization > 100 ? "text-red-400" : utilization > 90 ? "text-orange-400" : "text-zinc-500"}`}>
                                  {utilization}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-700 text-[10px] text-center block">—</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded border ${badge.color}`}>
                              <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${badge.dot} ${badge.label === "CRITICAL" ? "phosphor-pulse" : ""}`} />
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && dues.length > 0 && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#1c1c1f] flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-zinc-600">Total Outstanding ({dues.length} customers)</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono">
                  {formatINR(dues.reduce((sum, d) => sum + parseFloat(d.total_due_amount), 0))}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
