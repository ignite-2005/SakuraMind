"use client"

import type { ElementType } from "react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  Mic2,
  Settings,
  Sparkles,
  Target,
  Zap,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { loadReports } from "@/lib/reports-storage"
import { REPORTS_MUTATED_EVENT } from "@/lib/reports-mutated"
import { isReportVisibleInAggregates } from "@/lib/report-visibility"
import type { EmotionalReport } from "@/lib/types/emotional-report"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string
  value: string
  hint?: string
  icon: ElementType
  className?: string
}) {
  return (
    <div
      className={cn(
        "glass-card glass-card-hover relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 transition-all duration-300",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground/90">{hint}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-primary/25 bg-primary/10 p-2.5 text-primary shadow-[0_0_20px_rgba(244,114,182,0.15)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function DashboardOverview() {
  const [reports, setReports] = useState<EmotionalReport[]>([])

  useEffect(() => {
    const sync = () => setReports(loadReports())
    sync()
    const onFocus = () => sync()
    window.addEventListener("focus", onFocus)
    window.addEventListener(REPORTS_MUTATED_EVENT, sync)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener(REPORTS_MUTATED_EVENT, sync)
    }
  }, [])

  const stats = useMemo(() => {
    const visible = reports.filter(isReportVisibleInAggregates)
    const n = visible.length
    const last = visible[0]
    const confidences = visible.map((r) => r.confidence)
    const avgConf =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0
    const balances = visible.map((r) => r.balanceScore)
    const avgBal =
      balances.length > 0
        ? balances.reduce((a, b) => a + b, 0) / balances.length
        : 0
    const withVoice = visible.filter((r) => r.hasVoiceRecording).length

    const chartData = [...visible]
      .slice(0, 12)
      .reverse()
      .map((r, i) => ({
        i: i + 1,
        label: format(parseISO(r.createdAt), "MMM d"),
        balance: r.balanceScore,
      }))

    const emotionCounts = visible.reduce(
      (acc, r) => {
        acc[r.emotion] = (acc[r.emotion] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      n,
      last,
      avgConf,
      avgBal,
      withVoice,
      chartData,
      emotionCounts,
    }
  }, [reports])

  const recentList = useMemo(
    () => reports.filter(isReportVisibleInAggregates).slice(0, 6),
    [reports],
  )

  return (
    <div className="space-y-8 pb-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-rose-950/40 via-background/80 to-violet-950/30 p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(244,114,182,0.12),transparent_55%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Command center
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Neural audio intelligence at a glance
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Monitor session throughput, affect stability, and archival voice
              assets. Deep analysis runs in{" "}
              <Link
                href="/voice"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Voice Analysis
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 font-semibold shadow-[0_0_28px_rgba(244,114,182,0.35)] hover:opacity-95"
            >
              <Link href="/voice" className="gap-2">
                <Mic2 className="h-4 w-4" />
                Voice Analysis
                <ArrowRight className="h-4 w-4 opacity-80" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
            >
              <Link href="/reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              <Link href="/settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sessions logged"
          value={stats.n.toString()}
          hint="Total emotional reports"
          icon={BarChart3}
        />
        <StatCard
          label="Avg confidence"
          value={stats.n ? `${Math.round(stats.avgConf)}%` : "—"}
          hint={stats.last ? `Last: ${stats.last.emotion}` : "No data yet"}
          icon={Target}
        />
        <StatCard
          label="Avg balance"
          value={stats.n ? `${Math.round(stats.avgBal)}` : "—"}
          hint="Composite stability index"
          icon={Activity}
        />
        <StatCard
          label="Voice archives"
          value={stats.withVoice.toString()}
          hint="Clips stored locally"
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="glass-card xl:col-span-2 rounded-2xl border border-white/[0.07] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Balance trajectory
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">Last 12 sessions</span>
          </div>
          <div className="h-[240px] w-full">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="oklch(0.78 0.15 350)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.78 0.15 350)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "oklch(0.55 0.03 350)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "oklch(0.55 0.03 350)" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.12 0.04 350 / 0.95)",
                      border: "1px solid oklch(0.4 0.06 350 / 0.3)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [`${Math.round(v)}`, "Balance"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="oklch(0.78 0.15 350)"
                    strokeWidth={2}
                    fill="url(#balFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Complete a voice session to populate this chart.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Affect distribution
          </h3>
          <div className="space-y-3">
            {(["happy", "neutral", "sad", "angry"] as const).map((e) => {
              const c = stats.emotionCounts[e] || 0
              const pct = stats.n ? Math.round((c / stats.n) * 100) : 0
              return (
                <div key={e}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize text-foreground">{e}</span>
                    <span className="text-muted-foreground">
                      {c} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 to-accent/80 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            Recent activity
          </h3>
          <Link
            href="/reports"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {recentList.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sessions yet — start with Voice Analysis to generate your first
            report.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {recentList.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
              >
                <div>
                  <p className="text-sm font-medium capitalize text-foreground">
                    {r.emotion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(r.createdAt), "PPp")} ·{" "}
                    {Math.round(r.confidence)}% conf · balance {r.balanceScore}
                    {r.hasVoiceRecording ? " · voice clip" : ""}
                  </p>
                </div>
                <span className="rounded-full bg-secondary/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {r.trendVsPrevious}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
