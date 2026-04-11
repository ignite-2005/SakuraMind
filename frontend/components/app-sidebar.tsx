"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Mic2,
  FileText,
  Settings,
  Sparkles,
  Menu,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/voice", label: "Voice Analysis", icon: Mic2 },
  { href: "/reports", label: "Previous Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

function NavLinks({
  className,
  closeOnNavigate,
}: {
  className?: string
  closeOnNavigate?: boolean
}) {
  const pathname = usePathname()
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        const content = (
          <>
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                active && "text-primary",
              )}
            />
            <span>{label}</span>
          </>
        )
        const linkClass = cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
          active
            ? "border border-primary/35 bg-primary/15 text-primary shadow-[0_0_28px_rgba(244,114,182,0.28)]"
            : "border border-transparent text-muted-foreground hover:border-rose-300/15 hover:bg-rose-950/25 hover:text-foreground hover:shadow-[0_0_22px_rgba(251,182,206,0.12)]",
        )
        if (closeOnNavigate) {
          return (
            <SheetClose key={href} asChild>
              <Link href={href} className={linkClass}>
                {content}
              </Link>
            </SheetClose>
          )
        }
        return (
          <Link key={href} href={href} className={linkClass}>
            {content}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarAccount({ compact }: { compact?: boolean }) {
  const { user, logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.replace("/")
    router.refresh()
  }

  if (!user) return null

  return (
    <div
      className={cn(
        "rounded-xl border border-rose-200/10 bg-rose-950/20 p-3",
        compact && "mx-0",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Signed in
      </p>
      <p
        className="mt-1 truncate text-xs font-medium text-foreground"
        title={user.email}
      >
        {user.email}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full rounded-lg border-rose-300/25 text-xs text-rose-100 hover:bg-rose-950/50 hover:text-white"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-3.5 w-3.5" />
        Log out
      </Button>
    </div>
  )
}

export function AppSidebar() {
  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-rose-200/10 bg-[oklch(0.09_0.05_350_/_0.72)] backdrop-blur-xl lg:flex">
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-2 border-b border-rose-200/10 px-5 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400/95 via-pink-500/90 to-fuchsia-700/90 shadow-[0_0_32px_rgba(244,114,182,0.45)] ring-1 ring-rose-200/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              SakuraMind
            </p>
            <p className="text-[10px] uppercase tracking-widest text-rose-200/55">
              桜 · Neural Audio
            </p>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
        <div className="space-y-3 border-t border-rose-200/10 p-4">
          <SidebarAccount />
          <p className="text-[10px] text-muted-foreground/80">
            © {new Date().getFullYear()} SakuraMind
          </p>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-rose-200/10 bg-[oklch(0.07_0.05_350_/_0.88)] px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 shadow-[0_0_22px_rgba(244,114,182,0.4)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">SakuraMind</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] border-rose-200/10 bg-[oklch(0.09_0.05_350_/_0.96)] p-0 backdrop-blur-xl"
          >
            <SheetHeader className="border-b border-white/[0.06] p-4 text-left">
              <SheetTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                SakuraMind
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-4">
              <NavLinks closeOnNavigate />
              <SidebarAccount compact />
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  )
}
