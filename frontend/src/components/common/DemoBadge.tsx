import { FlaskConical } from "lucide-react"

export default function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      <FlaskConical className="h-3 w-3" />
      Demo Data
    </span>
  )
}