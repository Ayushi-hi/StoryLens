import {
  LayoutDashboard,
  Route,
  BookOpen,
  Sparkles,
  Search,
  ArrowLeftRight,
  FlaskConical,
  FileText,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", path: "/app/overview", icon: LayoutDashboard },
  { label: "User Journey", path: "/app/journey", icon: Route },
  { label: "Story Mode", path: "/app/story", icon: BookOpen },
  { label: "AI Insights", path: "/app/insights", icon: Sparkles },
  { label: "Explore Data", path: "/app/explore", icon: Search },
  { label: "Traditional vs Storytelling", path: "/app/compare", icon: ArrowLeftRight },
  { label: "Research Mode", path: "/app/research", icon: FlaskConical },
  { label: "Methodology", path: "/app/methodology", icon: FileText },
]