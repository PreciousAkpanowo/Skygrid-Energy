"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import {
  Sun,
  PlugZap,
  Gauge,
  TrendingUp,
  Tag,
  Users,
  GitMerge,
  Search,
  ArrowRight,
  Bell,
  ShoppingCart,
  PlusCircle,
  Activity,
  Wallet,
  RefreshCw,
  User,
  MapPin,
  Zap,
  Timer,
  BadgeCheck,
  CreditCard,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  MinusCircle,
  List,
  Info,
  ShieldCheck,
  Radio,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Dynamically import ECharts to avoid SSR issues
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// Types
type ActivityItem = {
  id: string;
  ts: number;
  icon: "trade" | "listing" | "system" | "wallet";
  text: string;
};

type TxType = "Bought" | "Sold" | "Top-up" | "Withdrawal";

type TxItem = {
  id: string;
  ts: number;
  type: TxType;
  counterparty: string;
  kwh?: number;
  amountCredits: number;
};

type Listing = {
  id: string;
  neighbor: string;
  distanceKm: number;
  availableKwh: number;
  pricePerKwh: number;
  expiryMins: number;
  offerType: "surplus" | "offer";
};

type LiveActivityItem = {
  id: string;
  ts: number;
  amountKwh: number;
  priceCents: number;
  nodeLabel: string;
};

// Helper components
interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

const AnimatedNumber = ({ value, decimals = 0, suffix, className }: AnimatedNumberProps) => {
  const [display, setDisplay] = useState<number>(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(value);
  const fromRef = useRef<number>(value);
  const toRef = useRef<number>(value);

  const clamp = useCallback((v: number, min: number, max: number) => Math.max(min, Math.min(max, v)), []);

  useEffect(() => {
    if (toRef.current === value) return;
    fromRef.current = display;
    toRef.current = value;
    startRef.current = performance.now();

    const tick = (t: number) => {
      const elapsed = t - startRef.current;
      const duration = 520;
      const p = clamp(elapsed / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplay(next);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clamp, display, value]);

  const formatted = (Math.round(display * Math.pow(10, decimals)) / Math.pow(10, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      <span>{formatted}</span>
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
};

interface MetricTileProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  valueNode: React.ReactNode;
  helper: string;
}

const MetricTile = ({ icon: Icon, label, valueNode, helper }: MetricTileProps) => {
  return (
    <Card className="shadow-sm border bg-background/70 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl border border-border bg-background/60 flex items-center justify-center">
            <Icon size={18} className="text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground m-0 text-sm">{label}</p>
            <div className="mt-1">
              <p className="text-foreground m-0 text-xl lg:text-2xl font-semibold">{valueNode}</p>
            </div>
            <div className="mt-1">
              <p className="text-foreground m-0 text-xs opacity-80">{helper}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface FlowMiniCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}

const FlowMiniCard = ({ icon: Icon, title, desc }: FlowMiniCardProps) => {
  return (
    <Card className="shadow-sm border bg-background/70 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg border border-border bg-background/70 flex items-center justify-center">
            <Icon size={18} className="text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground m-0 text-sm font-semibold">{title}</p>
            <p className="text-foreground m-0 text-xs opacity-80">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface InfoTileProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  hint: string;
}

const InfoTile = ({ icon: Icon, label, value, badge, hint }: InfoTileProps) => {
  return (
    <Card className="shadow-sm border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl border border-border bg-background/60 flex items-center justify-center">
              <Icon size={18} className="text-foreground" />
            </div>
            <div>
              <p className="text-foreground m-0 text-sm">{label}</p>
              <div className="mt-1">
                <p className="text-foreground m-0 text-xl font-semibold">{value}</p>
              </div>
            </div>
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        <div className="mt-2">
          <p className="text-foreground m-0 text-xs opacity-80">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export function SolarNeighborTradingHome() {
  // Utility functions
  const formatTime = useCallback((d: Date) => {
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  }, []);

  const clamp = useCallback((v: number, min: number, max: number) => Math.max(min, Math.min(max, v)), []);

  const uid = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const now = useCallback(() => Date.now(), []);

  const centsToCredits = useCallback((pricePerKwh: number) => pricePerKwh, []);

  const toLocalCurrency = useCallback((credits: number) => credits / 100, []);

  const formatRelativeTime = useCallback(
    (ts: number) => {
      const diffMs = now() - ts;
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 10) return "Just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin === 1) return "1 min ago";
      if (diffMin < 60) return `${diffMin} mins ago`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH === 1) return "1 hour ago";
      if (diffH < 24) return `${diffH} hours ago`;
      const diffD = Math.floor(diffH / 24);
      if (diffD === 1) return "1 day ago";
      return `${diffD} days ago`;
    },
    [now]
  );

  // Seeded data
  const seededNames = useMemo(
    () => ["Alex", "Priya", "Mateo", "Sam", "Leila", "Noah", "Aisha", "Jun", "Mina", "Omar", "Iris", "Theo"],
    []
  );

  const seededStreets = useMemo(
    () => ["Cedar Ln", "Skyview Ave", "Solaris Ct", "Wren St", "Azure Blvd", "Orchard Way"],
    []
  );

  const initialListings = useMemo<Listing[]>(
    () => [
      { id: "l1", neighbor: "Priya", distanceKm: 0.4, availableKwh: 6.8, pricePerKwh: 18, expiryMins: 42, offerType: "surplus" },
      { id: "l2", neighbor: "Alex", distanceKm: 0.9, availableKwh: 3.2, pricePerKwh: 16, expiryMins: 25, offerType: "surplus" },
      { id: "l3", neighbor: "Leila", distanceKm: 1.3, availableKwh: 9.5, pricePerKwh: 20, expiryMins: 68, offerType: "surplus" },
      { id: "l4", neighbor: "Mateo", distanceKm: 0.7, availableKwh: 2.4, pricePerKwh: 14, expiryMins: 31, offerType: "surplus" },
      { id: "l5", neighbor: "Noah", distanceKm: 2.6, availableKwh: 5.1, pricePerKwh: 22, expiryMins: 54, offerType: "offer" },
      { id: "l6", neighbor: "Aisha", distanceKm: 4.1, availableKwh: 12.0, pricePerKwh: 19, expiryMins: 90, offerType: "surplus" },
      { id: "l7", neighbor: "Jun", distanceKm: 1.9, availableKwh: 4.6, pricePerKwh: 17, expiryMins: 47, offerType: "offer" },
    ],
    []
  );

  // Icon helpers
  const iconForActivity = useCallback((kind: ActivityItem["icon"]) => {
    if (kind === "trade") return ShoppingCart;
    if (kind === "listing") return PlusCircle;
    if (kind === "wallet") return Wallet;
    return Activity;
  }, []);

  const badgeForNet = useCallback((netW: number) => {
    if (netW >= 200) return { label: "Surplus", variant: "secondary" as const };
    if (netW <= -200) return { label: "Deficit", variant: "destructive" as const };
    return { label: "Balanced", variant: "outline" as const };
  }, []);

  // State
  const [metrics, setMetrics] = useState(() => ({
    tradedKwhToday: 1486,
    avgLocalPrice: 17.8,
    activeTraders: 92,
  }));

  const [range, setRange] = useState<"1h" | "24h" | "7d">("24h");
  const [livePower, setLivePower] = useState(() => ({
    solarW: 1820,
    loadW: 1410,
  }));

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const base = Date.now();
    return [
      { id: "a1", ts: base - 1000 * 60 * 6, icon: "listing", text: "New listing posted on Skyview Ave (4.5 kWh at 17¢/kWh)" },
      { id: "a2", ts: base - 1000 * 60 * 4, icon: "trade", text: "Alex sold 3.2 kWh to Priya — settled instantly" },
      { id: "a3", ts: base - 1000 * 60 * 2, icon: "system", text: "Price signal updated: neighborhood average now 17–19¢/kWh" },
    ];
  });

  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [radius, setRadius] = useState<"0.5" | "1" | "5">("1");
  const [maxPrice, setMaxPrice] = useState<number>(20);
  const [marketMode, setMarketMode] = useState<"all" | "surplus" | "offers">("all");
  const [walletCredits, setWalletCredits] = useState<number>(12500);

  const [transactions, setTransactions] = useState<TxItem[]>(() => {
    const base = Date.now();
    return [
      { id: "t1", ts: base - 1000 * 60 * 180, type: "Top-up", counterparty: "PayNow", amountCredits: 5000 },
      { id: "t2", ts: base - 1000 * 60 * 95, type: "Bought", counterparty: "Mateo", kwh: 2.1, amountCredits: 294 },
      { id: "t3", ts: base - 1000 * 60 * 55, type: "Sold", counterparty: "Leila", kwh: 1.6, amountCredits: 272 },
      { id: "t4", ts: base - 1000 * 60 * 20, type: "Bought", counterparty: "Priya", kwh: 3.0, amountCredits: 540 },
    ];
  });

  const [txFilter, setTxFilter] = useState<"all" | "purchases" | "sales" | "wallet">("all");
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [buyQty, setBuyQty] = useState<number>(1);
  const [postOpen, setPostOpen] = useState(false);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [fundsOpen, setFundsOpen] = useState<"add" | "withdraw" | null>(null);
  const [fundAmount, setFundAmount] = useState<number>(2500);
  const [fundProvider, setFundProvider] = useState<string>("PayNow");
  const [fundStep, setFundStep] = useState<"details" | "confirm" | "done">("details");

  // Live Activity Feed state
  const [liveFeedItems, setLiveFeedItems] = useState<LiveActivityItem[]>([]);
  const [highlightedLiveId, setHighlightedLiveId] = useState<string | null>(null);
  const liveActivityRef = useRef<HTMLElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  // Computed values
  const selectedListing = useMemo(() => {
    if (!selectedListingId) return null;
    return listings.find((l) => l.id === selectedListingId) || null;
  }, [listings, selectedListingId]);

  const netW = useMemo(() => livePower.solarW - livePower.loadW, [livePower]);
  const netBadge = useMemo(() => badgeForNet(netW), [badgeForNet, netW]);

  const filteredListings = useMemo(() => {
    const r = parseFloat(radius);
    return listings
      .filter((l) => l.distanceKm <= r)
      .filter((l) => l.pricePerKwh <= maxPrice)
      .filter((l) => {
        if (marketMode === "all") return true;
        if (marketMode === "surplus") return l.offerType === "surplus";
        return l.offerType === "offer";
      })
      .sort((a, b) => a.pricePerKwh - b.pricePerKwh);
  }, [listings, maxPrice, marketMode, radius]);

  const visibleTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => b.ts - a.ts);
    const filtered = sorted.filter((t) => {
      if (txFilter === "all") return true;
      if (txFilter === "purchases") return t.type === "Bought";
      if (txFilter === "sales") return t.type === "Sold";
      return t.type === "Top-up" || t.type === "Withdrawal";
    });
    return filtered.slice(0, 8);
  }, [transactions, txFilter]);

  const addActivity = useCallback(
    (item: Omit<ActivityItem, "id" | "ts"> & { ts?: number }) => {
      const withMeta: ActivityItem = {
        id: uid(),
        ts: item.ts ?? now(),
        icon: item.icon,
        text: item.text,
      };
      setActivities((prev) => {
        const next = [withMeta, ...prev];
        return next.slice(0, 18);
      });
    },
    [now, uid]
  );

  // Effects for live updates
  useEffect(() => {
    const t = window.setInterval(() => {
      setMetrics((m) => {
        const deltaKwh = Math.round(6 + Math.random() * 18);
        const avg = clamp(m.avgLocalPrice + (Math.random() - 0.5) * 0.3, 14.5, 24.0);
        const traders = Math.round(clamp(m.activeTraders + (Math.random() - 0.5) * 6, 55, 160));
        return {
          tradedKwhToday: m.tradedKwhToday + deltaKwh,
          avgLocalPrice: Math.round(avg * 10) / 10,
          activeTraders: traders,
        };
      });
    }, 3800);
    return () => window.clearInterval(t);
  }, [clamp]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setLivePower((p) => {
        const nextSolar = clamp(p.solarW + (Math.random() - 0.45) * 240, 120, 4200);
        const nextLoad = clamp(p.loadW + (Math.random() - 0.5) * 200, 260, 3600);
        return { solarW: Math.round(nextSolar), loadW: Math.round(nextLoad) };
      });
    }, 2400);
    return () => window.clearInterval(t);
  }, [clamp]);

  useEffect(() => {
    const templates = [
      () => ({ icon: "listing" as const, text: `New listing posted on ${seededStreets[Math.floor(Math.random() * seededStreets.length)]} (${(2 + Math.random() * 9).toFixed(1)} kWh at ${14 + Math.floor(Math.random() * 10)}¢/kWh)` }),
      () => ({ icon: "trade" as const, text: `${seededNames[Math.floor(Math.random() * seededNames.length)]} sold ${(1 + Math.random() * 4).toFixed(1)} kWh to ${seededNames[Math.floor(Math.random() * seededNames.length)]} — instant settlement` }),
      () => ({ icon: "system" as const, text: `Grid signal: afternoon demand rising — consider posting surplus for faster matching` }),
      () => ({ icon: "wallet" as const, text: `Settlement batch check complete — all local trades confirmed` }),
    ];

    const t = window.setInterval(() => {
      const pick = templates[Math.floor(Math.random() * templates.length)];
      addActivity(pick());
    }, 6200);

    return () => window.clearInterval(t);
  }, [addActivity, seededNames, seededStreets]);

  useEffect(() => {
    if (!selectedListing) return;
    setBuyQty((q) => clamp(q, 0.1, Math.max(0.1, selectedListing.availableKwh)));
  }, [clamp, selectedListing]);

  useEffect(() => {
    if (!fundsOpen) return;
    setFundProvider("PayNow");
    setFundAmount(fundsOpen === "add" ? 2500 : 1500);
    setFundStep("details");
  }, [fundsOpen]);

  // Live Activity Feed event listener
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<any>;
      const detail = custom.detail || {};
      const amountRaw = typeof detail.amount === "string" ? parseFloat(detail.amount) : 0;
      const priceRaw = typeof detail.price === "string" ? parseFloat(detail.price) : 0;
      const nodeLabel = typeof detail.node === "string" && detail.node.trim() ? detail.node : "Unknown node";

      const item: LiveActivityItem = {
        id: uid(),
        ts: now(),
        amountKwh: Math.max(0, Math.round(amountRaw * 10) / 10),
        priceCents: Math.max(0, Math.round(priceRaw * 100)),
        nodeLabel,
      };

      setLiveFeedItems((prev) => [item, ...prev].slice(0, 20));

      setHighlightedLiveId(item.id);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedLiveId((current) => (current === item.id ? null : current));
      }, 2000);

      if (liveActivityRef.current) {
        liveActivityRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    window.addEventListener("energy:posted", handler as EventListener);
    return () => {
      window.removeEventListener("energy:posted", handler as EventListener);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [now, uid]);

  // Chart data builder
  const buildSeries = useCallback(
    (r: "1h" | "24h" | "7d") => {
      const base = new Date();
      const points = r === "1h" ? 12 : r === "24h" ? 24 : 28;
      const stepMinutes = r === "1h" ? 5 : r === "24h" ? 60 : 6 * 60;

      const labels: string[] = [];
      const gen: number[] = [];
      const con: number[] = [];

      for (let i = points - 1; i >= 0; i -= 1) {
        const d = new Date(base.getTime() - i * stepMinutes * 60 * 1000);
        labels.push(r === "7d" ? `${d.getMonth() + 1}/${d.getDate()}` : formatTime(d));

        const hour = d.getHours() + d.getMinutes() / 60;
        const solarFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
        const dayVariance = 0.8 + Math.random() * 0.3;
        const g = 0.4 + solarFactor * 3.5 * dayVariance;

        const loadBase = 0.9 + (hour < 7 ? 0.3 : 0) + (hour > 18 ? 0.6 : 0.2);
        const loadNoise = (Math.random() - 0.5) * 0.25;
        const c = Math.max(0.5, loadBase + loadNoise);

        gen.push(Math.round(g * 10) / 10);
        con.push(Math.round(c * 10) / 10);
      }

      return { labels, gen, con };
    },
    [formatTime]
  );

  const chartData = useMemo(() => buildSeries(range), [buildSeries, range]);

  const chartOption = useMemo(() => {
    const gradientGen = {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "rgba(56, 189, 248, 0.55)" },
        { offset: 1, color: "rgba(56, 189, 248, 0.02)" },
      ],
    };

    const gradientCon = {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "rgba(15, 118, 110, 0.38)" },
        { offset: 1, color: "rgba(15, 118, 110, 0.03)" },
      ],
    };

    return {
      animation: true,
      animationDuration: 450,
      grid: { left: 6, right: 10, top: 16, bottom: 26, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "line" } },
      legend: { data: ["Generation", "Consumption"], top: 0, right: 0 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: chartData.labels,
        axisLabel: { color: "rgba(2, 6, 23, 0.6)", margin: 14 },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value} kW", color: "rgba(2, 6, 23, 0.6)" },
        splitLine: { lineStyle: { color: "rgba(2, 6, 23, 0.08)" } },
      },
      series: [
        {
          name: "Generation",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2, color: "rgba(56, 189, 248, 1)" },
          areaStyle: { color: gradientGen },
          data: chartData.gen,
        },
        {
          name: "Consumption",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2, color: "rgba(15, 118, 110, 1)" },
          areaStyle: { color: gradientCon },
          data: chartData.con,
        },
      ],
    };
  }, [chartData.con, chartData.gen, chartData.labels]);

  // Action handlers
  const openBuy = useCallback(
    (id: string) => {
      setSelectedListingId(id);
      const l = listings.find((x) => x.id === id);
      setBuyQty(l ? clamp(1, 0.1, l.availableKwh) : 1);
      setBuyOpen(true);
    },
    [clamp, listings]
  );

  const confirmBuy = useCallback(() => {
    if (!selectedListing) return;
    const qty = clamp(buyQty, 0.1, selectedListing.availableKwh);
    const settlesAt = selectedListing.pricePerKwh;
    const costCredits = Math.round(qty * centsToCredits(settlesAt));

    if (costCredits > walletCredits) {
      addActivity({ icon: "system", text: `Trade failed: insufficient credits for ${qty.toFixed(1)} kWh from ${selectedListing.neighbor}` });
      return;
    }

    setWalletCredits((w) => w - costCredits);

    setListings((prev) =>
      prev
        .map((l) => {
          if (l.id !== selectedListing.id) return l;
          const next = Math.max(0, Math.round((l.availableKwh - qty) * 10) / 10);
          return { ...l, availableKwh: next };
        })
        .filter((l) => l.availableKwh > 0)
    );

    const tx: TxItem = {
      id: uid(),
      ts: now(),
      type: "Bought",
      counterparty: selectedListing.neighbor,
      kwh: Math.round(qty * 10) / 10,
      amountCredits: costCredits,
    };

    setTransactions((prev) => [tx, ...prev].slice(0, 24));

    addActivity({
      icon: "trade",
      text: `You bought ${qty.toFixed(1)} kWh from ${selectedListing.neighbor} at ${settlesAt}¢/kWh — settled for ${costCredits} credits`,
    });

    setBuyOpen(false);
  }, [addActivity, buyQty, centsToCredits, clamp, now, selectedListing, uid, walletCredits]);

  const buyCostPreview = useMemo(() => {
    if (!selectedListing) return { costCredits: 0, settlesAt: 0, qty: 0 };
    const qty = clamp(buyQty, 0.1, selectedListing.availableKwh);
    const settlesAt = selectedListing.pricePerKwh;
    const costCredits = Math.round(qty * centsToCredits(settlesAt));
    return { costCredits, settlesAt, qty };
  }, [buyQty, centsToCredits, clamp, selectedListing]);

  const createListing = useCallback(
    (availableKwh: number, minPrice: number, windowMins: number) => {
      const neighbor = "You";
      const l: Listing = {
        id: uid(),
        neighbor,
        distanceKm: 0,
        availableKwh: Math.round(availableKwh * 10) / 10,
        pricePerKwh: Math.round(minPrice),
        expiryMins: Math.round(windowMins),
        offerType: "surplus",
      };
      setListings((prev) => [l, ...prev]);
      addActivity({ icon: "listing", text: `You posted ${l.availableKwh.toFixed(1)} kWh at ${l.pricePerKwh}¢/kWh — visible to nearby neighbors` });
      setPostSuccess(`Listing posted: ${l.availableKwh.toFixed(1)} kWh at ${l.pricePerKwh}¢/kWh`);
      window.setTimeout(() => setPostSuccess(null), 3500);
    },
    [addActivity, uid]
  );

  // Post form
  const postForm = useForm({
    defaultValues: {
      availableKwh: "5.0",
      minPrice: "18",
      windowMins: "60",
    },
  });

  const submitPost = postForm.handleSubmit((vals) => {
    const kwh = clamp(parseFloat(vals.availableKwh || "0") || 0, 0.1, 999);
    const price = clamp(parseFloat(vals.minPrice || "0") || 0, 10, 50);
    const windowM = clamp(parseFloat(vals.windowMins || "0") || 0, 10, 240);
    createListing(kwh, price, windowM);
    setPostOpen(false);
    postForm.reset({ availableKwh: "5.0", minPrice: "18", windowMins: "60" });
  });

  // Funding dialog content
  const FundingDialogContent = () => {
    const isAdd = fundsOpen === "add";
    const title = isAdd ? "Add Funds" : "Withdraw";
    const Icon = isAdd ? CreditCard : Banknote;
    const stepLabel = fundStep === "details" ? "Details" : fundStep === "confirm" ? "Confirm" : "Done";
    const canProceed = fundAmount > 0 && (isAdd || fundAmount <= walletCredits);

    const complete = () => {
      if (!fundsOpen) return;
      if (fundsOpen === "add") {
        setWalletCredits((w) => w + Math.round(fundAmount));
        const tx: TxItem = { id: uid(), ts: now(), type: "Top-up", counterparty: fundProvider, amountCredits: Math.round(fundAmount) };
        setTransactions((prev) => [tx, ...prev].slice(0, 24));
        addActivity({ icon: "wallet", text: `Wallet topped up by ${Math.round(fundAmount)} credits via ${fundProvider}` });
      } else {
        setWalletCredits((w) => w - Math.round(fundAmount));
        const tx: TxItem = { id: uid(), ts: now(), type: "Withdrawal", counterparty: fundProvider, amountCredits: Math.round(fundAmount) };
        setTransactions((prev) => [tx, ...prev].slice(0, 24));
        addActivity({ icon: "wallet", text: `Withdrawal initiated: ${Math.round(fundAmount)} credits to ${fundProvider}` });
      }
      setFundStep("done");
    };

    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl border border-border bg-background/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Icon size={18} className="text-foreground" />
            </div>
            <div>
              <h3 className="text-foreground m-0 font-semibold">{title}</h3>
              <p className="text-foreground m-0 text-sm">Simulated payment flow — balances update locally in this prototype.</p>
            </div>
          </div>
          <Badge variant="outline" className="text-foreground">
            {stepLabel}
          </Badge>
        </div>

        {fundStep !== "done" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-foreground m-0 font-medium">Amount</h4>
                    <p className="text-foreground m-0 text-sm">Credits are a stand-in for local cents (100 credits = 1.00).</p>
                  </div>
                  <Input
                    value={String(fundAmount)}
                    onChange={(e) => setFundAmount(clamp(parseInt(e.target.value || "0", 10) || 0, 0, 250000))}
                    inputMode="numeric"
                  />
                  {!isAdd && fundAmount > walletCredits ? (
                    <Alert variant="destructive" className="border">
                      <p className="text-foreground m-0">Withdrawal exceeds your current balance.</p>
                    </Alert>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-foreground m-0 font-medium">Provider</h4>
                    <p className="text-foreground m-0 text-sm">Choose a simulated provider to simulate a real integration.</p>
                  </div>
                  <Select value={fundProvider} onValueChange={(v) => setFundProvider(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PayNow">PayNow</SelectItem>
                      <SelectItem value="CloudBank">CloudBank</SelectItem>
                      <SelectItem value="SolarCredits">SolarCredits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert className="border">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <BadgeCheck size={18} className="text-foreground" />
              </div>
              <p className="text-foreground m-0">All set. Your wallet balance updated successfully (simulated).</p>
            </div>
          </Alert>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
          <p className="text-foreground m-0">
            Current balance: <strong>{walletCredits.toLocaleString()}</strong> credits (~
            <strong>{toLocalCurrency(walletCredits).toFixed(2)}</strong>)
          </p>
          <div className="flex items-center justify-end gap-2">
            {fundStep === "details" ? (
              <Button
                variant="secondary"
                className="transition-all duration-200"
                onClick={() => setFundStep("confirm")}
                disabled={!canProceed}
              >
                Continue
              </Button>
            ) : null}
            {fundStep === "confirm" ? (
              <>
                <Button variant="outline" className="transition-all duration-200" onClick={() => setFundStep("details")}>
                  Back
                </Button>
                <Button className="transition-all duration-200" onClick={complete} disabled={!canProceed}>
                  Confirm
                </Button>
              </>
            ) : null}
            {fundStep === "done" ? (
              <DialogClose asChild>
                <Button className="transition-all duration-200">Close</Button>
              </DialogClose>
            ) : null}
          </div>
        </div>

        {fundStep === "confirm" ? (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h4 className="text-foreground m-0 font-medium">Review</h4>
              <p className="text-foreground m-0">
                {isAdd ? "You are adding" : "You are withdrawing"} <strong>{Math.round(fundAmount).toLocaleString()}</strong> credits via{" "}
                <strong>{fundProvider}</strong>.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  };

  // Row components
  const ListingRow = ({ listing }: { listing: Listing }) => {
    const isDisabled = listing.availableKwh <= 0;
    return (
      <div className="group rounded-xl border border-border bg-background/70 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]">
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-center">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-foreground" />
              <p className="text-foreground m-0 font-semibold">{listing.neighbor}</p>
              {listing.offerType === "offer" ? (
                <Badge variant="outline" className="text-foreground">
                  Offer
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-foreground">
                  Surplus
                </Badge>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-foreground opacity-80" />
              <p className="text-foreground m-0 text-sm">{listing.distanceKm.toFixed(1)} km</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-foreground opacity-80" />
              <p className="text-foreground m-0 text-sm">
                <strong>{listing.availableKwh.toFixed(1)}</strong> kWh
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-foreground opacity-80" />
              <p className="text-foreground m-0 text-sm">
                <strong>{listing.pricePerKwh}</strong>¢/kWh
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-foreground opacity-80" />
              <p className="text-foreground m-0 text-sm">Expires in {listing.expiryMins}m</p>
            </div>
          </div>

          <div className="lg:col-span-1 flex lg:justify-end">
            <Button className="transition-all duration-200 w-full lg:w-auto" disabled={isDisabled} onClick={() => openBuy(listing.id)}>
              <span className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary-foreground" />
                <span>Buy</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const ActivityRow = ({ item }: { item: ActivityItem }) => {
    const Icon = iconForActivity(item.icon);
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-background/70 backdrop-blur-sm p-3 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="mt-0.5 h-8 w-8 rounded-lg border border-border bg-background/60 flex items-center justify-center">
          <Icon size={16} className="text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground m-0 text-sm">{item.text}</p>
          <div className="mt-1">
            <p className="text-foreground m-0 text-xs opacity-75">{formatTime(new Date(item.ts))}</p>
          </div>
        </div>
      </div>
    );
  };

  const TxRow = ({ tx }: { tx: TxItem }) => {
    const typeMeta: Record<TxType, { icon: React.ComponentType<{ size?: number; className?: string }>; variant: "secondary" | "destructive" | "outline" }> = {
      Bought: { icon: ArrowDownLeft, variant: "secondary" },
      Sold: { icon: ArrowUpRight, variant: "secondary" },
      "Top-up": { icon: PlusCircle, variant: "outline" },
      Withdrawal: { icon: MinusCircle, variant: "outline" },
    };

    const meta = typeMeta[tx.type];
    const Icon = meta.icon;

    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/70 backdrop-blur-sm p-3 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 h-8 w-8 rounded-lg border border-border bg-background/60 flex items-center justify-center">
            <Icon size={16} className="text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={meta.variant} className="text-foreground">
                {tx.type}
              </Badge>
              <p className="text-foreground m-0 text-sm">
                {tx.type === "Top-up" || tx.type === "Withdrawal" ? tx.counterparty : `with ${tx.counterparty}`}
              </p>
            </div>
            <div className="mt-1">
              <p className="text-foreground m-0 text-xs opacity-75">
                {formatTime(new Date(tx.ts))}
                {typeof tx.kwh === "number" ? ` • ${tx.kwh.toFixed(1)} kWh` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-foreground m-0 text-sm font-semibold">{tx.amountCredits.toLocaleString()} credits</p>
          <p className="text-foreground m-0 text-xs opacity-75">~{toLocalCurrency(tx.amountCredits).toFixed(2)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen">
      {/* 1) Hero & Core Flow */}
      <section id="dashboard" className="w-full bg-gradient-to-b from-sky-50 to-transparent">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-7">
              <h1 className="text-foreground m-0 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Sell your extra solar power to neighbors
              </h1>
              <p className="text-foreground m-0 mt-3 lg:mt-4 text-base sm:text-lg leading-relaxed">
                Post energy → neighbors buy → instant settlement → notifications. Turn surplus into credits while your community keeps more energy local.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button className="transition-all duration-200" onClick={() => setPostOpen(true)}>
                  <span className="flex items-center gap-2">
                    <Zap size={16} className="text-primary-foreground" />
                    <span>Start Trading</span>
                  </span>
                </Button>
                <Button
                  variant="secondary"
                  className="transition-all duration-200"
                  onClick={() => addActivity({ icon: "system", text: "How it works: listings match locally and settle instantly (simulated)" })}
                >
                  <span className="flex items-center gap-2">
                    <Info size={16} className="text-foreground" />
                    <span>See How It Works</span>
                  </span>
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricTile
                  icon={TrendingUp}
                  label="Community traded today"
                  valueNode={<AnimatedNumber value={metrics.tradedKwhToday} suffix=" kWh" className="text-foreground" />}
                  helper="Rolling total across your neighborhood"
                />
                <MetricTile
                  icon={Tag}
                  label="Average local price"
                  valueNode={<AnimatedNumber value={metrics.avgLocalPrice} decimals={1} suffix="¢/kWh" className="text-foreground" />}
                  helper="Auto-updated from recent matches"
                />
                <MetricTile
                  icon={Users}
                  label="Active traders"
                  valueNode={<AnimatedNumber value={metrics.activeTraders} className="text-foreground" />}
                  helper="Buying, selling, and browsing right now"
                />
              </div>

              <div className="mt-6">
                <p className="text-foreground m-0 text-sm opacity-80">
                  Prototype note: values update with simulated data to mimic a live energy network.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <Card id="learn" className="shadow-sm border bg-background/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base flex items-center gap-2">
                    <GitMerge size={16} className="text-foreground" />
                    <span>Core flow</span>
                  </CardTitle>
                  <CardDescription className="text-foreground">Four steps to local trading with instant settlement.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <FlowMiniCard icon={Sun} title="Post Energy" desc="Share surplus kWh and your minimum price." />
                      </div>
                      <div className="hidden lg:flex items-center justify-center w-10">
                        <div className="flex items-center gap-2">
                          <div className="h-px w-6 border-t border-dashed border-border" />
                          <ArrowRight size={16} className="text-foreground opacity-70" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <FlowMiniCard icon={Search} title="Browse Listings" desc="Neighbors discover offers by distance & price." />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <FlowMiniCard icon={ShoppingCart} title="Match & Pay" desc="Buyer picks quantity; settlement is instant." />
                      </div>
                      <div className="hidden lg:flex items-center justify-center w-10">
                        <div className="flex items-center gap-2">
                          <div className="h-px w-6 border-t border-dashed border-border" />
                          <ArrowRight size={16} className="text-foreground opacity-70" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <FlowMiniCard icon={Bell} title="Get Notified" desc="Receipts, balance updates, and alerts." />
                      </div>
                    </div>

                    <Separator />

                    <p className="text-foreground m-0 text-sm">
                      Built for an energy-tech feel: clear pricing, transparent settlement, and a real-time neighborhood feed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Live Activity Feed (global window event: energy:posted) */}
      <section ref={liveActivityRef as any} id="live-activity" className="w-full">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-foreground m-0 text-2xl lg:text-3xl font-semibold">Live Activity Feed</h2>
              <p className="text-foreground m-0 mt-2 text-sm lg:text-base opacity-85">
                Frontend-only feed that listens for the <code className="text-sm bg-muted px-1 py-0.5 rounded">energy:posted</code> window event and appends recent activity.
              </p>
            </div>
            <Badge variant="outline" className="text-foreground flex items-center gap-1">
              <Radio size={14} className="text-foreground" />
              <span>Listening for events</span>
            </Badge>
          </div>

          <div className="mt-4">
            <Card className="shadow-sm border bg-background/60 backdrop-blur-sm">
              <CardContent className="p-4">
                {liveFeedItems.length === 0 ? (
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg border border-border bg-background/70 flex items-center justify-center">
                        <Zap size={18} className="text-foreground" />
                      </div>
                      <div>
                        <p className="text-foreground m-0 text-sm font-semibold">No live events yet</p>
                        <p className="text-foreground m-0 text-xs opacity-80">
                          No live activity yet. Post an energy offer to see it appear here in real time.
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-foreground">
                      <span className="text-xs">Waiting for activity</span>
                    </Badge>
                  </div>
                ) : (
                  <ScrollArea className="h-44">
                    <div className="space-y-3 pr-2">
                      {liveFeedItems.map((item) => {
                        const priceLabel = item.priceCents > 0 ? `${(item.priceCents / 100).toFixed(2)}/MWh` : "Price pending";
                        const statusVariant = item.priceCents <= 0 ? "outline" : item.priceCents <= 1800 ? "secondary" : "destructive";
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start justify-between gap-3 rounded-xl border border-border bg-background/70 p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] ${
                              highlightedLiveId === item.id ? "ring-2 ring-primary/70 bg-primary/10" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="mt-0.5 h-8 w-8 rounded-lg border border-border bg-background/60 flex items-center justify-center">
                                <Zap size={16} className="text-foreground" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant={statusVariant as any} className="text-foreground">
                                    <span className="text-xs">{priceLabel}</span>
                                  </Badge>
                                  <p className="text-foreground m-0 text-sm">
                                    <strong>{item.amountKwh.toFixed(1)} MWh</strong> posted by{" "}
                                    <span>{item.nodeLabel}</span>
                                  </p>
                                </div>
                                <div className="mt-1">
                                  <p className="text-foreground m-0 text-xs opacity-75">{formatRelativeTime(item.ts)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-foreground">
                                <span className="text-xs">Live</span>
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 2) Live Energy Dashboard */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-foreground m-0 text-2xl lg:text-3xl font-semibold">Live Energy Dashboard</h2>
              <p className="text-foreground m-0 mt-2 text-sm lg:text-base opacity-85">
                Monitor your home and watch neighborhood activity update in near real time.
              </p>
            </div>
            <Badge variant="outline" className="text-foreground">
              Real-time simulated updates
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-border bg-background/60 backdrop-blur-sm shadow-sm p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-foreground m-0 text-lg font-semibold">Your Home: Generation vs Consumption</h3>
                    <p className="text-foreground m-0 mt-1 text-sm opacity-80">
                      Past {range === "1h" ? "hour" : range === "24h" ? "24 hours" : "7 days"}
                    </p>
                  </div>

                  <ToggleGroup
                    type="single"
                    value={range}
                    onValueChange={(v) => {
                      if (v === "1h" || v === "24h" || v === "7d") setRange(v);
                    }}
                    className="bg-background/50 border border-border rounded-xl p-1"
                  >
                    <ToggleGroupItem value="1h">1h</ToggleGroupItem>
                    <ToggleGroupItem value="24h">24h</ToggleGroupItem>
                    <ToggleGroupItem value="7d">7d</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="mt-4 h-[300px]">
                  <ReactECharts option={chartOption} style={{ width: "100%", height: "100%" }} />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="shadow-sm border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Sun size={16} className="text-foreground" />
                        <p className="text-foreground m-0 text-sm">Today&apos;s peak</p>
                      </div>
                      <div className="mt-1">
                        <p className="text-foreground m-0 text-lg font-semibold">{Math.max(...chartData.gen).toFixed(1)} kW</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <PlugZap size={16} className="text-foreground" />
                        <p className="text-foreground m-0 text-sm">Average load</p>
                      </div>
                      <div className="mt-1">
                        <p className="text-foreground m-0 text-lg font-semibold">
                          {(chartData.con.reduce((a, b) => a + b, 0) / Math.max(1, chartData.con.length)).toFixed(1)} kW
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-foreground" />
                        <p className="text-foreground m-0 text-sm">Self-sufficiency</p>
                      </div>
                      <div className="mt-1">
                        <p className="text-foreground m-0 text-lg font-semibold">
                          {Math.round((chartData.gen.reduce((a, b) => a + b, 0) / Math.max(1, chartData.con.reduce((a, b) => a + b, 0))) * 100)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <InfoTile
                icon={Sun}
                label="Current solar generation"
                value={<AnimatedNumber value={livePower.solarW / 1000} decimals={2} suffix=" kW" className="text-foreground" />}
                hint="Updates every few seconds — simulating inverter telemetry"
              />
              <InfoTile
                icon={PlugZap}
                label="Current household load"
                value={<AnimatedNumber value={livePower.loadW / 1000} decimals={2} suffix=" kW" className="text-foreground" />}
                hint="Estimated from smart meter readings (simulated)"
              />
              <InfoTile
                icon={Gauge}
                label="Net position"
                value={<AnimatedNumber value={netW / 1000} decimals={2} suffix=" kW" className="text-foreground" />}
                badge={
                  <Badge variant={netBadge.variant} className="text-foreground">
                    {netBadge.label}
                  </Badge>
                }
                hint={netW >= 0 ? "Surplus is eligible to post to neighbors" : "You're drawing from the grid / neighborhood"}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-foreground m-0 text-lg font-semibold">Neighborhood Activity</h3>
                <p className="text-foreground m-0 mt-1 text-sm opacity-80">Auto-updates with listings, trades, and system signals.</p>
              </div>
              <Button
                variant="outline"
                className="transition-all duration-200"
                onClick={() => addActivity({ icon: "system", text: "Manual refresh: activity stream re-synced (simulated)" })}
              >
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-foreground" />
                  <span>Refresh</span>
                </span>
              </Button>
            </div>

            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {activities.map((a) => (
                <ActivityRow key={a.id} item={a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3) Marketplace & Trading */}
      <section id="marketplace" className="w-full bg-sky-50/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-foreground m-0 text-2xl lg:text-3xl font-semibold">Marketplace & Trading</h2>
              <p className="text-foreground m-0 mt-2 text-sm lg:text-base opacity-85">
                Filter nearby listings, buy a quantity, and watch the dashboard update instantly.
              </p>
            </div>
            <Button variant="link" className="transition-all duration-200 px-0" onClick={() => setPostOpen(true)}>
              <span className="flex items-center gap-2">
                <PlusCircle size={16} className="text-foreground" />
                <span className="text-foreground">Post new energy listing</span>
              </span>
            </Button>
          </div>

          {postSuccess ? (
            <div className="mt-4">
              <Alert className="border bg-background/70 backdrop-blur-sm shadow-sm">
                <div className="flex items-start gap-3">
                  <BadgeCheck size={18} className="text-foreground" />
                  <p className="text-foreground m-0">{postSuccess}</p>
                </div>
              </Alert>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-border bg-background/60 backdrop-blur-sm shadow-sm p-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-end">
              <div className="lg:col-span-3 space-y-2">
                <p className="text-foreground m-0 text-sm font-semibold">Radius</p>
                <Select value={radius} onValueChange={(v) => (v === "0.5" || v === "1" || v === "5" ? setRadius(v) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5 km</SelectItem>
                    <SelectItem value="1">1 km</SelectItem>
                    <SelectItem value="5">5 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-foreground m-0 text-sm font-semibold">Max price</p>
                  <Badge variant="outline" className="text-foreground">
                    {maxPrice}¢/kWh
                  </Badge>
                </div>
                <Slider
                  value={[maxPrice]}
                  onValueChange={(v) => {
                    const n = Array.isArray(v) ? v[0] : maxPrice;
                    setMaxPrice(clamp(Math.round(n), 12, 30));
                  }}
                  min={12}
                  max={30}
                  step={1}
                />
              </div>

              <div className="lg:col-span-4 space-y-2">
                <p className="text-foreground m-0 text-sm font-semibold">Show</p>
                <ToggleGroup
                  type="single"
                  value={marketMode}
                  onValueChange={(v) => {
                    if (v === "all" || v === "surplus" || v === "offers") setMarketMode(v);
                  }}
                  className="bg-background/50 border border-border rounded-xl p-1 w-full justify-between"
                >
                  <ToggleGroupItem value="all" className="flex-1">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="surplus" className="flex-1">
                    Surplus
                  </ToggleGroupItem>
                  <ToggleGroupItem value="offers" className="flex-1">
                    Offers
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-foreground m-0 text-sm">
                Showing <strong>{filteredListings.length}</strong> listings within <strong>{radius} km</strong> at up to{" "}
                <strong>{maxPrice}¢/kWh</strong>.
              </p>
              <p className="text-foreground m-0 text-sm opacity-80">
                Wallet: <strong>{walletCredits.toLocaleString()}</strong> credits
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {filteredListings.slice(0, 8).map((l) => (
                <ListingRow key={l.id} listing={l} />
              ))}
              {filteredListings.length === 0 ? (
                <Alert className="border bg-background/70 backdrop-blur-sm shadow-sm">
                  <div className="flex items-start gap-3">
                    <Search size={18} className="text-foreground" />
                    <p className="text-foreground m-0">No listings match your filters. Try increasing radius or max price.</p>
                  </div>
                </Alert>
              ) : null}
            </div>
          </div>

          {/* Buy Side Panel */}
          <Sheet open={buyOpen} onOpenChange={(o) => setBuyOpen(o)}>
            <SheetContent className="w-full lg:max-w-lg">
              <SheetHeader>
                <SheetTitle className="text-foreground flex items-center gap-2">
                  <ShoppingCart size={18} className="text-foreground" />
                  <span>Buy energy</span>
                </SheetTitle>
                <SheetDescription className="text-foreground">Review the trade, set quantity, and confirm. Settlement is simulated.</SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-4">
                {selectedListing ? (
                  <>
                    <Card className="shadow-sm border bg-background/70 backdrop-blur-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-foreground m-0 text-sm">Listing</p>
                            <p className="text-foreground m-0 text-lg font-semibold">{selectedListing.neighbor}</p>
                          </div>
                          <Badge variant="outline" className="text-foreground">
                            {selectedListing.distanceKm.toFixed(1)} km
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-border bg-background/60 p-3">
                            <div className="flex items-center gap-2">
                              <Zap size={16} className="text-foreground" />
                              <p className="text-foreground m-0 text-sm">Available</p>
                            </div>
                            <div className="mt-1">
                              <p className="text-foreground m-0 text-base font-semibold">{selectedListing.availableKwh.toFixed(1)} kWh</p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/60 p-3">
                            <div className="flex items-center gap-2">
                              <Tag size={16} className="text-foreground" />
                              <p className="text-foreground m-0 text-sm">Price</p>
                            </div>
                            <div className="mt-1">
                              <p className="text-foreground m-0 text-base font-semibold">{selectedListing.pricePerKwh}¢/kWh</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-foreground m-0 text-sm opacity-85">
                          Price matching: even if your max is higher, the trade settles at the listing price.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-foreground m-0 text-sm font-semibold">Quantity</p>
                          <Badge variant="secondary" className="text-foreground">
                            {buyCostPreview.qty.toFixed(1)} kWh
                          </Badge>
                        </div>

                        <Slider
                          value={[buyQty]}
                          onValueChange={(v) => {
                            const n = Array.isArray(v) ? v[0] : buyQty;
                            setBuyQty(Math.round(clamp(n, 0.1, selectedListing.availableKwh) * 10) / 10);
                          }}
                          min={0.1}
                          max={Math.max(0.1, selectedListing.availableKwh)}
                          step={0.1}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-border bg-background/60 p-3">
                            <p className="text-foreground m-0 text-sm">Total cost</p>
                            <p className="text-foreground m-0 text-base font-semibold">{buyCostPreview.costCredits.toLocaleString()} credits</p>
                          </div>
                          <div className="rounded-xl border border-border bg-background/60 p-3">
                            <p className="text-foreground m-0 text-sm">Wallet after</p>
                            <p className="text-foreground m-0 text-base font-semibold">
                              {Math.max(0, walletCredits - buyCostPreview.costCredits).toLocaleString()} credits
                            </p>
                          </div>
                        </div>

                        {buyCostPreview.costCredits > walletCredits ? (
                          <Alert variant="destructive" className="border">
                            <p className="text-foreground m-0">Insufficient credits. Add funds to complete this trade.</p>
                          </Alert>
                        ) : null}
                      </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="secondary" className="transition-all duration-200" onClick={() => setFundsOpen("add")}>
                        <span className="flex items-center gap-2">
                          <PlusCircle size={16} className="text-foreground" />
                          <span>Add Funds</span>
                        </span>
                      </Button>
                      <Button className="transition-all duration-200" onClick={confirmBuy} disabled={buyCostPreview.costCredits > walletCredits}>
                        <span className="flex items-center gap-2">
                          <BadgeCheck size={16} className="text-primary-foreground" />
                          <span>Confirm Trade</span>
                        </span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <Skeleton className="w-full h-40" />
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Post Listing Panel */}
          <Sheet open={postOpen} onOpenChange={(o) => setPostOpen(o)}>
            <SheetContent className="w-full lg:max-w-lg">
              <SheetHeader>
                <SheetTitle className="text-foreground flex items-center gap-2">
                  <PlusCircle size={18} className="text-foreground" />
                  <span>Post a new listing</span>
                </SheetTitle>
                <SheetDescription className="text-foreground">Set available kWh, minimum price, and the availability window.</SheetDescription>
              </SheetHeader>

              <div className="mt-5">
                <Form {...postForm}>
                  <form onSubmit={submitPost} className="space-y-4">
                    <Card className="shadow-sm border bg-background/70 backdrop-blur-sm">
                      <CardContent className="p-4 space-y-4">
                        <FormField
                          control={postForm.control}
                          name="availableKwh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Available kWh</FormLabel>
                              <FormControl>
                                <Input {...field} inputMode="decimal" />
                              </FormControl>
                              <FormDescription className="text-foreground">How much surplus you want to sell.</FormDescription>
                              <FormMessage className="text-foreground" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={postForm.control}
                          name="minPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Minimum price per kWh (¢)</FormLabel>
                              <FormControl>
                                <Input {...field} inputMode="numeric" />
                              </FormControl>
                              <FormDescription className="text-foreground">
                                Buyers can set a higher max, but settlement uses your listing price.
                              </FormDescription>
                              <FormMessage className="text-foreground" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={postForm.control}
                          name="windowMins"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Availability window (minutes)</FormLabel>
                              <FormControl>
                                <Input {...field} inputMode="numeric" />
                              </FormControl>
                              <FormDescription className="text-foreground">Listings expire automatically in the marketplace.</FormDescription>
                              <FormMessage className="text-foreground" />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-2">
                      <SheetClose asChild>
                        <Button variant="outline" className="transition-all duration-200">
                          Cancel
                        </Button>
                      </SheetClose>
                      <Button className="transition-all duration-200" type="submit">
                        <span className="flex items-center gap-2">
                          <BadgeCheck size={16} className="text-primary-foreground" />
                          <span>Post Listing</span>
                        </span>
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>

          {/* Funding Modals */}
          <Dialog open={fundsOpen !== null} onOpenChange={(o) => (o ? null : setFundsOpen(null))}>
            <DialogContent className="sm:max-w-xl bg-background/70 backdrop-blur-sm">
              <FundingDialogContent />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* 4) Wallet & Transactions Strip */}
      <section id="wallet" className="w-full">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div>
            <h2 className="text-foreground m-0 text-2xl lg:text-3xl font-semibold">Wallet & Transactions</h2>
            <p className="text-foreground m-0 mt-2 text-sm lg:text-base opacity-85">
              A lightweight wallet for instant settlement — simulated for this prototype.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-5 rounded-2xl border border-border bg-background/60 backdrop-blur-sm shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl border border-border bg-background/60 flex items-center justify-center shadow-sm">
                    <Wallet size={18} className="text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-foreground m-0 text-lg font-semibold">Wallet summary</h3>
                    <p className="text-foreground m-0 mt-1 text-sm opacity-80">
                      Settlement uses a simulated payment integration (credits only).
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-foreground">
                  Prototype
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-background/70 p-4 shadow-sm">
                  <p className="text-foreground m-0 text-sm opacity-80">Balance (credits)</p>
                  <p className="text-foreground m-0 mt-1 text-2xl font-bold tracking-tight">{walletCredits.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4 shadow-sm">
                  <p className="text-foreground m-0 text-sm opacity-80">Equivalent local currency</p>
                  <p className="text-foreground m-0 mt-1 text-2xl font-bold tracking-tight">{toLocalCurrency(walletCredits).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button className="transition-all duration-200" onClick={() => setFundsOpen("add")}>
                  <span className="flex items-center gap-2">
                    <PlusCircle size={16} className="text-primary-foreground" />
                    <span>Add Funds</span>
                  </span>
                </Button>
                <Button variant="secondary" className="transition-all duration-200" onClick={() => setFundsOpen("withdraw")}>
                  <span className="flex items-center gap-2">
                    <Banknote size={16} className="text-foreground" />
                    <span>Withdraw</span>
                  </span>
                </Button>
              </div>

              <div className="mt-5">
                <Alert className="border bg-background/70 backdrop-blur-sm shadow-sm">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-foreground" />
                    <p className="text-foreground m-0">
                      Settlement is simulated. In a production system, this would connect to a payment provider and a metering/verification layer.
                    </p>
                  </div>
                </Alert>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-border bg-background/60 backdrop-blur-sm shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-foreground m-0 text-lg font-semibold">Transaction history</h3>
                  <p className="text-foreground m-0 mt-1 text-sm opacity-80">Last 6–8 items from trades and wallet actions.</p>
                </div>

                <ToggleGroup
                  type="single"
                  value={txFilter}
                  onValueChange={(v) => {
                    if (v === "all" || v === "purchases" || v === "sales" || v === "wallet") setTxFilter(v);
                  }}
                  className="bg-background/50 border border-border rounded-xl p-1"
                >
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="purchases">Purchases</ToggleGroupItem>
                  <ToggleGroupItem value="sales">Sales</ToggleGroupItem>
                  <ToggleGroupItem value="wallet">Wallet</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {visibleTransactions.slice(0, 8).map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
                {visibleTransactions.length === 0 ? (
                  <Alert className="border bg-background/70 backdrop-blur-sm shadow-sm">
                    <div className="flex items-start gap-3">
                      <List size={18} className="text-foreground" />
                      <p className="text-foreground m-0">No transactions match this filter yet.</p>
                    </div>
                  </Alert>
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-foreground m-0 text-xs opacity-80">
                  Informational: All balances, prices, and payments are simulated in this prototype. No real settlement occurs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}