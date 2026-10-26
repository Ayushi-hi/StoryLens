import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Check, Database, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GenerateStoryResponse, Story } from "@/types/story"
import StoryBlocks from "./StoryBlocks"

const STEPS = [
  "Analyzing verified metrics...",
  "Finding important patterns...",
  "Generating explanation...",
]

type Phase = "idle" | "loading" | "ready" | "fallback"

interface AiStoryPanelProps {
  generate: () => Promise<GenerateStoryResponse>
  fallback: Story // used if the request itself fails (for example, the server is down)
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AiStoryPanel({ generate, fallback }: AiStoryPanelProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<GenerateStoryResponse | null>(null)

  useEffect(() => {
    if (phase !== "loading") return
    const timer = window.setInterval(() => setStep((s) => Math.min(s + 1, 2)), 800)
    return () => window.clearInterval(timer)
  }, [phase])

  function handleGenerate() {
    setPhase("loading")
    setStep(0)
    // wait(2400) keeps the loading sequence readable even when the answer is instant (cache).
    Promise.all([generate(), wait(2400)])
      .then(([res]) => {
        setResult(res)
        setStep(3)
        setPhase(res.status === "fallback" ? "fallback" : "ready")
      })
      .catch(() => {
        setResult({ story: fallback, status: "fallback", model: null, message: null })
        setPhase("fallback")
      })
  }

  const story = result?.story

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-teal-400">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Story</h2>
            <p className="text-xs text-slate-500">An explanation of the numbers above in plain language</p>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={phase === "loading"}
          className="gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          {phase === "idle" ? "Generate AI Story" : "Regenerate"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.ul
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-3"
          >
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={`flex items-center gap-2.5 text-sm ${i <= step ? "text-slate-800" : "text-slate-300"}`}
              >
                {i < step ? (
                  <Check className="h-4 w-4 text-teal-500" />
                ) : i === step ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-slate-200" />
                )}
                {label}
              </li>
            ))}
          </motion.ul>
        )}

        {(phase === "ready" || phase === "fallback") && story && result && (
          <motion.div
            key="story"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            {phase === "fallback" && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>
                    AI storytelling is temporarily unavailable. Showing an explanation calculated directly from the
                    verified metrics.
                  </p>
                  {result.message && <p className="mt-1 text-xs text-amber-800/80">{result.message}</p>}
                </div>
              </div>
            )}

            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              {phase === "fallback"
                ? "Automatic explanation"
                : result.status === "demo"
                  ? "Template story (demo mode)"
                  : "AI-Generated Story"}
            </p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">{story.headline}</h3>
            <p className="mb-5 mt-1 text-sm text-slate-600">{story.summary}</p>
            <StoryBlocks story={story} />

            {result.status === "cached" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Database className="h-3.5 w-3.5" />
                Reused from cache: same data, same filters, same model.
              </p>
            )}
            {result.status === "ai" && result.model && (
              <p className="mt-2 text-xs text-slate-400">Model: {result.model}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}