import { Database, Download, Menu, SlidersHorizontal, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <Badge variant="secondary" className="hidden gap-1.5 rounded-lg px-3 py-1.5 sm:inline-flex">
        <Database className="h-3.5 w-3.5" />
        eCommerce Multi-Category Store
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
        <Button
          size="sm"
          className="gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Story</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </header>
  )
}