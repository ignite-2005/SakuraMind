"use client"

import { CherryBlossoms } from "@/components/cherry-blossoms"

export function DashboardBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 sakura-app-gradient" aria-hidden />
      <div
        className="absolute inset-0 bg-noise opacity-[0.32] mix-blend-overlay"
        aria-hidden
      />
      {/* Cherry-blossom sky glow */}
      <div
        className="absolute -top-40 left-1/2 h-[560px] w-[min(100%,720px)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(244,166,205,0.22)_0%,rgba(180,100,150,0.12)_40%,transparent_70%)] blur-2xl"
        aria-hidden
      />
      <div
        className="absolute -top-32 left-[12%] h-[480px] w-[480px] animate-[float_12s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.2)_0%,transparent_68%)] blur-3xl"
        aria-hidden
      />
      <div
        className="absolute right-[-5%] top-1/4 h-[440px] w-[440px] animate-[float_14s_ease-in-out_infinite_reverse] rounded-full bg-[radial-gradient(circle,rgba(251,182,206,0.18)_0%,transparent_70%)] blur-3xl"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 h-[400px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(90,40,70,0.35)_0%,transparent_72%)] blur-3xl"
        aria-hidden
      />
      <div className="particles" aria-hidden />
      <CherryBlossoms className="z-[1] opacity-90" count={28} />
    </div>
  )
}
