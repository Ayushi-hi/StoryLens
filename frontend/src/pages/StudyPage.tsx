import { Sparkles } from "lucide-react"
import ParticipantFlow from "@/components/research/ParticipantFlow"

export default function StudyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto mb-8 flex max-w-4xl items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-violet-500 to-teal-400">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <span className="font-[Plus_Jakarta_Sans] font-extrabold">StoryLens study</span>
      </div>
      <ParticipantFlow storageKey="storylens-study-session" />
    </div>
  )
}