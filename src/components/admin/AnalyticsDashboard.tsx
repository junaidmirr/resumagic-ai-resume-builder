import { useState, useEffect, useCallback } from "react";
import { rtdb } from "../../lib/firebase";
import { ref, onValue, off } from "firebase/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  MousePointerClick,
  FileDown,
  Sparkles,
  Globe,
  BarChart2,
  Activity,
  RefreshCw,
  Calendar,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OverviewData {
  totalVisits?: number;
  uniqueVisitors?: number;
  sessionCount?: number;
  totalSignups?: number;
  totalLogins?: number;
  totalTemplateUses?: number;
  totalCareerDocs?: number;
  totalPdfDownloads?: number;
  totalAiCreditsConsumed?: number;
  totalActiveUsers?: number;
  lastUpdated?: number;
}

interface DailyData {
  [date: string]: {
    visits?: number;
    uniqueVisitors?: number;
    signups?: number;
    logins?: number;
    pdfDownloads?: number;
    templateUses?: number;
    careerDocGenerations?: number;
    featureUsage?: number;
    aiCreditsConsumed?: number;
    activeUsers?: number;
  };
}

interface KVData {
  [key: string]: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#64748b",
  "#a78bfa",
];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <h3 className={`text-2xl font-black ${color}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl bg-slate-800/60`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-indigo-400" />
      {title}
    </h4>
  );
}

// Custom Recharts tooltip
const DarkTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-slate-400 mb-1 font-semibold">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? "#a5b4fc" }}>
          {p.name}:{" "}
          <span className="font-bold">{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewData>({});
  const [daily, setDaily] = useState<DailyData>({});
  const [features, setFeatures] = useState<KVData>({});
  const [templates, setTemplates] = useState<KVData>({});
  const [careerDocs, setCareerDocs] = useState<KVData>({});
  const [pages, setPages] = useState<KVData>({});
  const [signupMethods, setSignupMethods] = useState<KVData>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Subscribe to Firebase RTDB in realtime
  useEffect(() => {
    const analyticsRef = ref(rtdb, "analytics");
    setLoading(true);

    const unsub = onValue(
      analyticsRef,
      (snap) => {
        const data = snap.val() ?? {};
        setOverview(data.overview ?? {});
        setDaily(data.daily ?? {});
        setFeatures(data.features ?? {});
        setTemplates(data.templates ?? {});
        setCareerDocs(data.careerDocs ?? {});
        setPages(data.pages ?? {});
        setSignupMethods(data.signupMethods ?? {});
        setLoading(false);
        setLastRefresh(new Date());
      },
      () => setLoading(false),
    );

    return () => off(analyticsRef, "value", unsub);
  }, []);

  // ── Build chart data ────────────────────────────────────────────────────

  // Last 14 days daily chart
  const dailyChartData = useCallback(() => {
    const days: {
      date: string;
      label: string;
      visits: number;
      signups: number;
      logins: number;
      downloads: number;
    }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      const row = daily[key] ?? {};
      days.push({
        date: key,
        label,
        visits: row.visits ?? 0,
        signups: row.signups ?? 0,
        logins: row.logins ?? 0,
        downloads: row.pdfDownloads ?? 0,
      });
    }
    return days;
  }, [daily]);

  // Feature bar data
  const featureBarData = Object.entries(features)
    .map(([name, count]) => ({
      name: name
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim(),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Template pie data
  const templatePieData = Object.entries(templates)
    .map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Career docs bar
  const careerDocBarData = Object.entries(careerDocs)
    .map(([name, count]) => ({
      name: name.replace(/_/g, " "),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Pages bar data
  const pagesBarData = Object.entries(pages)
    .map(([name, count]) => ({
      name: name.replace(/_/g, " ").replace(/^\//, ""),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Signup method pie
  const signupPieData = Object.entries(signupMethods).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // ── Derived ──────────────────────────────────────────────────────────────

  const conversionRate =
    overview.uniqueVisitors && overview.totalSignups
      ? ((overview.totalSignups / overview.uniqueVisitors) * 100).toFixed(1)
      : "0.0";

  const returningRate =
    overview.totalLogins && overview.totalSignups
      ? (
          (overview.totalLogins /
            (overview.totalLogins + (overview.totalSignups ?? 0))) *
          100
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="ml-3 text-slate-400 text-sm font-medium">
          Loading analytics...
        </p>
      </div>
    );
  }

  const chartDataArr = dailyChartData();

  const totalDownloads = Math.max(
    overview.totalPdfDownloads ?? 0,
    features.pdfDownload ?? 0,
    Object.values(daily).reduce((acc, d) => acc + (d.pdfDownloads ?? 0), 0),
  );

  const totalTemplates = Math.max(
    overview.totalTemplateUses ?? 0,
    features.resumeTemplate ?? 0,
    Object.values(templates).reduce((acc, val) => acc + (val ?? 0), 0),
  );

  const totalCareerDocsCount = Math.max(
    overview.totalCareerDocs ?? 0,
    features.careerDoc ?? 0,
    Object.values(careerDocs).reduce((acc, val) => acc + (val ?? 0), 0),
  );

  const totalAiCredits = Math.max(
    overview.totalAiCreditsConsumed ?? 0,
    features.aiCreditsUsed ?? 0,
    Object.values(daily).reduce(
      (acc, d) => acc + (d.aiCreditsConsumed ?? 0),
      0,
    ),
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white">
            Realtime Analytics
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Last updated: {lastRefresh.toLocaleTimeString()} · Live from
            Firebase RTDB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Visits"
          value={overview.totalVisits ?? 0}
          icon={Globe}
          color="text-indigo-400"
        />
        <StatCard
          label="Unique Visitors"
          value={overview.uniqueVisitors ?? 0}
          icon={Users}
          color="text-cyan-400"
        />
        <StatCard
          label="Total Signups"
          value={overview.totalSignups ?? 0}
          icon={TrendingUp}
          color="text-emerald-400"
          sub={`${conversionRate}% conversion`}
        />
        <StatCard
          label="Total Logins"
          value={overview.totalLogins ?? 0}
          icon={MousePointerClick}
          color="text-amber-400"
          sub={`${returningRate}% returning`}
        />
        <StatCard
          label="PDF Downloads"
          value={totalDownloads}
          icon={FileDown}
          color="text-violet-400"
        />
        <StatCard
          label="Templates Used"
          value={totalTemplates}
          icon={BarChart2}
          color="text-rose-400"
        />
        <StatCard
          label="Career Docs Generated"
          value={totalCareerDocsCount}
          icon={Sparkles}
          color="text-orange-400"
        />
        <StatCard
          label="AI Credits Consumed"
          value={totalAiCredits}
          icon={Activity}
          color="text-pink-400"
        />
      </div>

      {/* 14-Day Traffic Line Chart */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <SectionTitle
          icon={Calendar}
          title="Last 14 Days — Traffic & Conversions"
        />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={chartDataArr}
            margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<DarkTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#94a3b8" }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="visits"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name="Visits"
            />
            <Line
              type="monotone"
              dataKey="signups"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Signups"
            />
            <Line
              type="monotone"
              dataKey="logins"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Logins"
            />
            <Line
              type="monotone"
              dataKey="downloads"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              name="PDF Downloads"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Usage + Template Pie — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Feature Usage Bar */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <SectionTitle icon={BarChart2} title="Feature Usage (All Time)" />
          {featureBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={featureBarData}
                layout="vertical"
                margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  name="Uses"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No feature data yet" />
          )}
        </div>

        {/* Template Pie */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <SectionTitle icon={Sparkles} title="Template Popularity" />
          {templatePieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={templatePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {templatePieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 overflow-hidden">
                {templatePieData.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-[10px] text-slate-300 truncate">
                      {t.name}
                    </span>
                    <span className="ml-auto text-[10px] font-bold text-slate-400 shrink-0">
                      {t.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text="No template data yet" />
          )}
        </div>
      </div>

      {/* Career Doc Types + Pages — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Career Doc Types */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <SectionTitle icon={Activity} title="Career Document Types" />
          {careerDocBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={careerDocBarData}
                margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  name="Generated"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No career doc data yet" />
          )}
        </div>

        {/* Page Visits */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <SectionTitle icon={Globe} title="Top Pages by Visits" />
          {pagesBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={pagesBarData}
                layout="vertical"
                margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#22d3ee"
                  radius={[0, 4, 4, 0]}
                  name="Visits"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No page data yet" />
          )}
        </div>
      </div>

      {/* Signup Methods + Daily detail table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Signup Methods Pie */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <SectionTitle icon={Users} title="Signup Methods" />
          {signupPieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={signupPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {signupPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {signupPieData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-slate-300">{s.name}</span>
                    <span className="ml-auto text-xs font-bold text-white">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text="No signup method data yet" />
          )}
        </div>

        {/* Recent Daily Summary Table */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-auto">
          <SectionTitle icon={Calendar} title="Daily Summary — Last 7 Days" />
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="text-left pb-2 font-bold">Date</th>
                <th className="text-right pb-2 font-bold">Visits</th>
                <th className="text-right pb-2 font-bold">Signups</th>
                <th className="text-right pb-2 font-bold">Logins</th>
                <th className="text-right pb-2 font-bold">PDFs</th>
              </tr>
            </thead>
            <tbody>
              {chartDataArr
                .slice(-7)
                .reverse()
                .map((row) => (
                  <tr
                    key={row.date}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-1.5 text-slate-400">{row.label}</td>
                    <td className="py-1.5 text-right text-indigo-400 font-bold">
                      {row.visits.toLocaleString()}
                    </td>
                    <td className="py-1.5 text-right text-emerald-400 font-bold">
                      {row.signups.toLocaleString()}
                    </td>
                    <td className="py-1.5 text-right text-amber-400 font-bold">
                      {row.logins.toLocaleString()}
                    </td>
                    <td className="py-1.5 text-right text-violet-400 font-bold">
                      {row.downloads.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-slate-600 text-xs">
      {text} — start using the app to populate this chart.
    </div>
  );
}
