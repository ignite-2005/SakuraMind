"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { BrightnessProvider } from "@/components/brightness-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <BrightnessProvider>
        <AuthProvider>{children}</AuthProvider>
      </BrightnessProvider>
    </ThemeProvider>
  )
}
