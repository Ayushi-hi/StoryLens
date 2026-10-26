import { NavLink } from "react-router-dom"
import { Sparkles } from "lucide-react"
import { NAV_ITEMS } from "@/utils/nav"
import { cn } from "@/lib/utils"

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <NavLink to="/" className="flex items-center gap-2.5 px-5 py-6" onClick={onNavigate}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-teal-400">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <span className="font-[Plus_Jakarta_Sans] text-lg font-extrabold tracking-tight text-white">
          StoryLens
        </span>
      </NavLink>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-slate-400">
        <p className="font-semibold text-slate-200">Verified facts first</p>
        <p className="mt-1">
          Numbers come from the analytics layer. AI only explains them.
        </p>
      </div>
    </div>
  )
}