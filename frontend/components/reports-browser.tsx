"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, parseISO, endOfDay, startOfDay } from "date-fns"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  CalendarRange,
  Volume2,
  MoreVertical,
  Lock,
  EyeOff,
  Trash2,
  KeyRound,
} from "lucide-react"
import {
  loadReports,
  updateReport,
  deleteReport,
} from "@/lib/reports-storage"
import { REPORTS_MUTATED_EVENT } from "@/lib/reports-mutated"
import {
  isReportUnlockedInSession,
  unlockReportInSession,
  lockReportInSession,
} from "@/lib/report-unlock-session"
import { hashPassword } from "@/lib/auth-client"
import { deleteVoiceRecording, getVoiceRecording } from "@/lib/voice-recording-idb"
import type { EmotionalReport } from "@/lib/types/emotional-report"
import type { EmotionType } from "@/components/emotion-display"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmotionDisplay } from "@/components/emotion-display"
import { VoiceIndicators } from "@/components/voice-indicators"
import { StaticSpectrogramArt } from "@/components/static-spectrogram-art"
import { ScrollArea } from "@/components/ui/scroll-area"

const EMOTIONS: (EmotionType | "all")[] = [
  "all",
  "happy",
  "neutral",
  "sad",
  "angry",
]

const REPORT_LOCK_MIN = 4

function filterReports(
  reports: EmotionalReport[],
  emotion: EmotionType | "all",
  fromStr: string,
  toStr: string,
  showHidden: boolean,
): EmotionalReport[] {
  return reports.filter((r) => {
    if (r.hidden && !showHidden) return false
    if (emotion !== "all" && r.emotion !== emotion) return false
    const d = parseISO(r.createdAt)
    if (fromStr) {
      const from = startOfDay(new Date(fromStr))
      if (d < from) return false
    }
    if (toStr) {
      const to = endOfDay(new Date(toStr))
      if (d > to) return false
    }
    return true
  })
}

function ReportVoicePlayback({
  reportId,
  enabled,
}: {
  reportId: string
  enabled: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setUrl(null)
      setMissing(false)
      return
    }
    setMissing(false)
    void getVoiceRecording(reportId).then((blob) => {
      if (!blob) {
        setMissing(true)
        return
      }
      const u = URL.createObjectURL(blob)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = u
      setUrl(u)
    })
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [reportId, enabled])

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Volume2 className="h-4 w-4 text-primary" />
        Voice recording
      </h3>
      {!enabled ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-muted-foreground">
          No audio was stored for this report (older sessions or failed capture).
        </p>
      ) : missing ? (
        <p className="text-sm text-muted-foreground">
          Audio file not found in local storage.
        </p>
      ) : !url ? (
        <p className="text-sm text-muted-foreground">Loading audio…</p>
      ) : (
        <audio
          controls
          src={url}
          className="h-10 w-full rounded-lg accent-primary"
          preload="metadata"
        />
      )}
    </div>
  )
}

function TrendBadge({ trend }: { trend: EmotionalReport["trendVsPrevious"] }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
        <TrendingUp className="h-3 w-3" />
        Up
      </span>
    )
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-300 ring-1 ring-rose-500/30">
        <TrendingDown className="h-3 w-3" />
        Down
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-white/10">
      <Minus className="h-3 w-3" />
      Flat
    </span>
  )
}

export function ReportsBrowser() {
  const [raw, setRaw] = useState<EmotionalReport[]>([])
  const [emotion, setEmotion] = useState<EmotionType | "all">("all")
  const [fromStr, setFromStr] = useState("")
  const [toStr, setToStr] = useState("")
  const [showHidden, setShowHidden] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const [unlockId, setUnlockId] = useState<string | null>(null)
  const [unlockPwd, setUnlockPwd] = useState("")
  const [unlockErr, setUnlockErr] = useState<string | null>(null)
  const [unlockBusy, setUnlockBusy] = useState(false)

  const [lockReport, setLockReport] = useState<EmotionalReport | null>(null)
  const [lockPwd, setLockPwd] = useState("")
  const [lockConfirm, setLockConfirm] = useState("")
  const [lockErr, setLockErr] = useState<string | null>(null)
  const [lockBusy, setLockBusy] = useState(false)

  const [removeLockReport, setRemoveLockReport] = useState<EmotionalReport | null>(null)
  const [removeLockPwd, setRemoveLockPwd] = useState("")
  const [removeLockErr, setRemoveLockErr] = useState<string | null>(null)
  const [removeLockBusy, setRemoveLockBusy] = useState(false)

  const [deleteReportState, setDeleteReportState] = useState<EmotionalReport | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const refresh = useCallback(() => {
    setRaw(loadReports())
  }, [])

  useEffect(() => {
    refresh()
    const onVis = () => {
      if (document.visibilityState === "visible") refresh()
    }
    const onMut = () => refresh()
    window.addEventListener("focus", refresh)
    window.addEventListener(REPORTS_MUTATED_EVENT, onMut)
    document.addEventListener("visibilitychange", onVis)
    return () => {
      window.removeEventListener("focus", refresh)
      window.removeEventListener(REPORTS_MUTATED_EVENT, onMut)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [refresh])

  const filtered = useMemo(
    () => filterReports(raw, emotion, fromStr, toStr, showHidden),
    [raw, emotion, fromStr, toStr, showHidden],
  )

  const active = useMemo(
    () => raw.find((r) => r.id === openId) ?? null,
    [raw, openId],
  )

  const hiddenFiltersEmpty =
    filtered.length === 0 &&
    raw.length > 0 &&
    !showHidden &&
    filterReports(raw, emotion, fromStr, toStr, true).length > 0 &&
    filterReports(raw, emotion, fromStr, toStr, false).length === 0

  function requestOpenReport(id: string) {
    const r = raw.find((x) => x.id === id)
    if (!r) return
    if (r.lockPasswordHash && !isReportUnlockedInSession(r.id)) {
      setUnlockId(id)
      setUnlockPwd("")
      setUnlockErr(null)
      return
    }
    setOpenId(id)
  }

  async function submitUnlock() {
    if (!unlockId) return
    const r = raw.find((x) => x.id === unlockId)
    if (!r?.lockPasswordHash) {
      setUnlockId(null)
      return
    }
    setUnlockBusy(true)
    setUnlockErr(null)
    const h = await hashPassword(unlockPwd)
    setUnlockBusy(false)
    if (h !== r.lockPasswordHash) {
      setUnlockErr("Incorrect passphrase.")
      return
    }
    unlockReportInSession(r.id)
    setUnlockId(null)
    setUnlockPwd("")
    setOpenId(r.id)
  }

  function toggleHidden(r: EmotionalReport) {
    updateReport(r.id, (cur) => ({ ...cur, hidden: !cur.hidden }))
  }

  async function submitSetLock() {
    if (!lockReport) return
    setLockErr(null)
    if (lockPwd.length < REPORT_LOCK_MIN) {
      setLockErr(`Passphrase must be at least ${REPORT_LOCK_MIN} characters.`)
      return
    }
    if (lockPwd !== lockConfirm) {
      setLockErr("Passphrases do not match.")
      return
    }
    setLockBusy(true)
    const h = await hashPassword(lockPwd)
    lockReportInSession(lockReport.id)
    updateReport(lockReport.id, (cur) => ({ ...cur, lockPasswordHash: h }))
    setLockBusy(false)
    setLockReport(null)
    setLockPwd("")
    setLockConfirm("")
    if (openId === lockReport.id) setOpenId(null)
  }

  async function submitRemoveLock() {
    if (!removeLockReport?.lockPasswordHash) return
    setRemoveLockErr(null)
    setRemoveLockBusy(true)
    const h = await hashPassword(removeLockPwd)
    setRemoveLockBusy(false)
    if (h !== removeLockReport.lockPasswordHash) {
      setRemoveLockErr("Incorrect passphrase.")
      return
    }
    updateReport(removeLockReport.id, (cur) => {
      const { lockPasswordHash: _x, ...rest } = cur
      return rest as EmotionalReport
    })
    lockReportInSession(removeLockReport.id)
    setRemoveLockReport(null)
    setRemoveLockPwd("")
  }

  async function confirmDelete() {
    if (!deleteReportState) return
    setDeleteBusy(true)
    try {
      if (deleteReportState.hasVoiceRecording) {
        await deleteVoiceRecording(deleteReportState.id)
      }
    } catch {
      /* still remove metadata */
    }
    lockReportInSession(deleteReportState.id)
    deleteReport(deleteReportState.id)
    setDeleteBusy(false)
    setDeleteReportState(null)
    if (openId === deleteReportState.id) setOpenId(null)
  }

  return (
    <div className="space-y-6">
      <div className="glass-card glass-card-hover flex flex-col gap-4 rounded-2xl border border-white/[0.07] p-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="emotion-filter" className="text-xs text-muted-foreground">
              Emotion
            </Label>
            <select
              id="emotion-filter"
              value={emotion}
              onChange={(e) =>
                setEmotion(e.target.value as EmotionType | "all")
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-primary/40"
            >
              {EMOTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === "all" ? "All emotions" : m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-date" className="text-xs text-muted-foreground">
              From
            </Label>
            <input
              id="from-date"
              type="date"
              value={fromStr}
              onChange={(e) => setFromStr(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date" className="text-xs text-muted-foreground">
              To
            </Label>
            <input
              id="to-date"
              type="date"
              value={toStr}
              onChange={(e) => setToStr(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              id="show-hidden"
              checked={showHidden}
              onCheckedChange={(v) => setShowHidden(v === true)}
            />
            <span>Show hidden</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEmotion("all")
              setFromStr("")
              setToStr("")
              setShowHidden(false)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-white/10 p-12 text-center text-muted-foreground">
          <CalendarRange className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">No reports match your filters yet.</p>
          {hiddenFiltersEmpty ? (
            <p className="mt-2 text-xs opacity-90">
              You have hidden reports — turn on <strong>Show hidden</strong> to
              reveal them.
            </p>
          ) : (
            <p className="mt-1 text-xs opacity-80">
              Run a voice analysis from Voice Analysis to populate history.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const lockedOpaque =
              !!r.lockPasswordHash && !isReportUnlockedInSession(r.id)
            return (
              <div
                key={r.id}
                className={cn(
                  "glass-card glass-card-hover relative overflow-hidden rounded-2xl border border-white/[0.07] transition-all duration-300",
                  r.hidden && "opacity-85 ring-1 ring-amber-500/20",
                )}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => requestOpenReport(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      requestOpenReport(r.id)
                    }
                  }}
                  className="block w-full cursor-pointer rounded-2xl p-5 pb-12 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="mb-3 flex items-start justify-between gap-2 pr-10">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {format(parseISO(r.createdAt), "MMM d, yyyy · HH:mm")}
                      </p>
                      {lockedOpaque ? (
                        <>
                          <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                            <Lock className="h-5 w-5 shrink-0 text-primary" />
                            Locked report
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Open to enter your passphrase. Details stay private
                            until then.
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-lg font-semibold capitalize text-foreground">
                          {r.emotion}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {r.hidden ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200 ring-1 ring-amber-500/25">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </span>
                      ) : null}
                      {r.lockPasswordHash ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-200 ring-1 ring-violet-500/25">
                          <Lock className="h-3 w-3" />
                          {lockedOpaque ? "Locked" : "Lock on"}
                        </span>
                      ) : null}
                      {!lockedOpaque && r.hasVoiceRecording ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/25">
                          <Volume2 className="h-3 w-3" />
                          Audio
                        </span>
                      ) : null}
                      {!lockedOpaque ? <TrendBadge trend={r.trendVsPrevious} /> : null}
                    </div>
                  </div>
                  {!lockedOpaque ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">
                          Confidence
                        </p>
                        <p className="font-mono text-foreground">
                          {Math.round(r.confidence)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">
                          Balance
                        </p>
                        <p className="font-mono text-foreground">{r.balanceScore}/100</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 py-6 text-center text-xs text-muted-foreground">
                      Content protected
                    </div>
                  )}
                </div>

                <div
                  className="absolute right-2 top-2 z-10"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        aria-label="Report actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        onClick={() => toggleHidden(r)}
                      >
                        <EyeOff className="h-4 w-4" />
                        {r.hidden ? "Unhide from list" : "Hide from list"}
                      </DropdownMenuItem>
                      {r.lockPasswordHash ? (
                        <DropdownMenuItem onClick={() => {
                          setRemoveLockReport(r)
                          setRemoveLockPwd("")
                          setRemoveLockErr(null)
                        }}
                        >
                          <KeyRound className="h-4 w-4" />
                          Remove lock…
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => {
                            setLockReport(r)
                            setLockPwd("")
                            setLockConfirm("")
                            setLockErr(null)
                          }}
                        >
                          <Lock className="h-4 w-4" />
                          Lock with passphrase…
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteReportState(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={unlockId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setUnlockId(null)
            setUnlockPwd("")
            setUnlockErr(null)
          }
        }}
      >
        <DialogContent className="glass-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock report</DialogTitle>
            <DialogDescription>
              Enter the passphrase you set for this session. Unlock lasts for this
              browser tab until you close it or remove the lock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="unlock-pwd">Passphrase</Label>
            <Input
              id="unlock-pwd"
              type="password"
              autoComplete="off"
              value={unlockPwd}
              onChange={(e) => setUnlockPwd(e.target.value)}
              className="bg-background/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitUnlock()
              }}
            />
            {unlockErr ? (
              <p className="text-sm text-destructive" role="alert">
                {unlockErr}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnlockId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-rose-500 to-pink-600"
              disabled={unlockBusy}
              onClick={() => void submitUnlock()}
            >
              {unlockBusy ? "Checking…" : "Unlock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={lockReport !== null}
        onOpenChange={(o) => {
          if (!o) {
            setLockReport(null)
            setLockPwd("")
            setLockConfirm("")
            setLockErr(null)
          }
        }}
      >
        <DialogContent className="glass-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lock report</DialogTitle>
            <DialogDescription>
              A SHA-256 hash of your passphrase is stored locally (not the phrase
              itself). You will need it to view this report again in a new tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="lock-pwd">Passphrase</Label>
              <Input
                id="lock-pwd"
                type="password"
                autoComplete="new-password"
                value={lockPwd}
                onChange={(e) => setLockPwd(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lock-confirm">Confirm passphrase</Label>
              <Input
                id="lock-confirm"
                type="password"
                autoComplete="new-password"
                value={lockConfirm}
                onChange={(e) => setLockConfirm(e.target.value)}
                className="bg-background/50"
              />
            </div>
            {lockErr ? (
              <p className="text-sm text-destructive" role="alert">
                {lockErr}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLockReport(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-rose-500 to-pink-600"
              disabled={lockBusy}
              onClick={() => void submitSetLock()}
            >
              {lockBusy ? "Saving…" : "Save lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeLockReport !== null}
        onOpenChange={(o) => {
          if (!o) {
            setRemoveLockReport(null)
            setRemoveLockPwd("")
            setRemoveLockErr(null)
          }
        }}
      >
        <DialogContent className="glass-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove lock</DialogTitle>
            <DialogDescription>
              Enter the current passphrase to clear the lock from this device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remove-lock-pwd">Passphrase</Label>
            <Input
              id="remove-lock-pwd"
              type="password"
              value={removeLockPwd}
              onChange={(e) => setRemoveLockPwd(e.target.value)}
              className="bg-background/50"
            />
            {removeLockErr ? (
              <p className="text-sm text-destructive" role="alert">
                {removeLockErr}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRemoveLockReport(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeLockBusy}
              onClick={() => void submitRemoveLock()}
            >
              {removeLockBusy ? "Checking…" : "Remove lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteReportState !== null}
        onOpenChange={(o) => !o && !deleteBusy && setDeleteReportState(null)}
      >
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved session from this browser. Any linked voice
              clip in local storage will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBusy}
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent
          showCloseButton
          className="glass-card max-h-[90vh] overflow-hidden border-white/10 bg-[oklch(0.1_0.04_290_/_0.95)] p-0 sm:max-w-3xl"
        >
          {active && (
            <ScrollArea className="max-h-[90vh]">
              <div className="p-6">
                <DialogHeader className="mb-4 text-left">
                  <DialogTitle className="text-xl">
                    Session · {format(parseISO(active.createdAt), "PPpp")}
                  </DialogTitle>
                </DialogHeader>

                <div className="mb-6 flex flex-wrap gap-2 border-b border-white/[0.06] pb-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleHidden(active)}
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    {active.hidden ? "Unhide" : "Hide"}
                  </Button>
                  {active.lockPasswordHash ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setRemoveLockReport(active)
                        setRemoveLockPwd("")
                        setRemoveLockErr(null)
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Remove lock
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setLockReport(active)
                        setLockPwd("")
                        setLockConfirm("")
                        setLockErr(null)
                      }}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Lock
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => setDeleteReportState(active)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Mel spectrogram
                    </h3>
                    {active.spectrogramImage ? (
                      <img
                        src={active.spectrogramImage}
                        alt="Mel spectrogram captured for this session"
                        className="w-full max-h-[220px] rounded-xl border border-white/10 object-cover object-center"
                      />
                    ) : (
                      <StaticSpectrogramArt seed={active.id} />
                    )}
                  </div>

                  <ReportVoicePlayback
                    reportId={active.id}
                    enabled={!!active.hasVoiceRecording}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Emotion result
                      </h3>
                      <EmotionDisplay
                        emotion={active.emotion}
                        confidence={active.confidence}
                        isAnalyzing={false}
                        emotionDistribution={active.emotionDistribution ?? null}
                      />
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Voice signals
                      </h3>
                      <VoiceIndicators
                        pitchVariation={active.pitchVariation}
                        speechEnergy={active.speechEnergy}
                        rhythmStability={active.rhythmStability ?? null}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      AI interpretation
                    </h3>
                    <p className="rounded-xl border border-white/[0.06] bg-black/25 p-4 text-sm leading-relaxed text-foreground/90">
                      {active.aiInterpretation}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Quick insights
                    </h3>
                    <ul className="space-y-2">
                      {active.quickInsights.map((line, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
