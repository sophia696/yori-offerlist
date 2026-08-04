"use client"

import * as React from "react"
import { Bell, Search, Sparkles, Sun, Moon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopbarProps {
  onOpenAiCopilot?: () => void
}

export function Topbar({ onOpenAiCopilot }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search campaigns, offers..."
            className="w-full appearance-none bg-background pl-8 shadow-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* AI Copilot Button */}
        <Button
          onClick={() => {
            if (onOpenAiCopilot) {
              onOpenAiCopilot()
            } else {
              window.dispatchEvent(new CustomEvent("open-ai-copilot"))
            }
          }}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all font-medium text-xs shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>Ask AI Copilot</span>
          <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-background/60 rounded border text-[9px] font-mono text-muted-foreground">
            Ctrl+K
          </kbd>
        </Button>

        {/* Theme Switcher Button */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="User" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">AD</AvatarFallback>
              </Avatar>
            </Button>
          } />
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@yorioffers.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
