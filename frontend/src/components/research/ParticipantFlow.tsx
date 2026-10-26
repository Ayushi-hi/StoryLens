import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, FlaskConical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startSession, submitResponse } from "@/services/researchService"
import type { Condition, ResearchSession } from "@/types/research"
import TaskExhibit from "./TaskExhibit"

type Phase = "intro" | "task" | "done"

interface Stored {
  session: ResearchSession
  answered: string[]
}

interface Props {
  preview?: Condition
  storageKey: string
  onExit?: () => void
}

function load(key: string): Stored | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

function save(key: string, value: Stored | null) {
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value))
    else sessionStorage.removeItem(key)
  } catch {
    // storage may be unavailable (private mode); the study still works without resume
  }
}

export default function ParticipantFlow({ preview, storageKey, onExit }: Props) {
  const [session, setSession] = useState<ResearchSession | null>(null)
  const [answered, setAnswered] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>("intro")
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [choice, setChoice] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [reason, setReason] = useState("")
  const startedAt = useRef<Date>(new Date())

  // Resume after a page refresh.
  useEffect(() => {
    const stored = load(storageKey)
    if (!stored) return
    setSession(stored.session)
    setAnswered(stored.answered)
    setPhase(stored.answered.length >= stored.session.tasks.length ? "done" : "task")
  }, [storageKey])

  const task = session?.tasks.find((t) => !answered.includes(t.task_id)) ?? null

  // The timer starts when a new task is shown.
  useEffect(() => {
    if (phase === "task" && task) {
      startedAt.current = new Date()
      setChoice(null)
      setConfidence(null)
      setReason("")
    }
  }, [phase, task?.task_id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function begin() {
    setBusy(true)
    setError(null)
    try {
      const s = await startSession(preview)
      setSession(s)
      setAnswered([])
      save(storageKey, { session: s, answered: [] })
      setPhase("task")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the study.")
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!session || !task || !choice || !confidence) return
    setBusy(true)
    setError(null)
    try {
      const result = await submitResponse({
        session_id: session.session_id,
        task_id: task.task_id,
        answer: choice,
        confidence,
        started_at: startedAt.current.toISOString(),
        ended_at: new Date().toISOString(),
        reason: task.asks_reason && reason.trim() ? reason.trim() : null,
      })
      const next = [...answered, task.task_id]
      setAnswered(next)
      save(storageKey, { session, answered: next })
      if (result.session_complete) setPhase("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answer. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    save(storageKey, null)
    setSession(null)
    setAnswered([])
    setConsent(false)
    setPhase("intro")
    onExit?.()
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-violet-600">
          <FlaskConical className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {preview ? `Preview (${preview.toLowerCase()})` : "Research study"}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Understanding data about an online store</h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
          <p>
            You will look at information from an online store and answer four short questions. There are no trick
            questions, and it is fine to choose "I can&apos;t tell from the data".
          </p>
          <p>
            We record your answers, how long each question takes and how confident you feel. We do not collect your
            name, email or any other personal details. You will be given a random participant ID.
          </p>
          <p>Taking part is voluntary. You can close this page at any time.</p>
        </div>
        {!preview && (
          <label className="mt-5 flex items-start gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            I have read the information above and agree to take part.
          </label>
        )}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button
          onClick={begin}
          disabled={busy || (!preview && !consent)}
          className="mt-6 gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Start
        </Button>
      </div>
    )
  }

  if (phase === "done" || !session) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal-500" />
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Thank you</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your answers have been recorded. You can now close this page.
        </p>
        {session && <p className="mt-3 text-xs text-slate-400">Participant ID: {session.participant_id}</p>}
        {preview && (
          <Button variant="outline" onClick={restart} className="mt-5 rounded-lg">
            Close preview
          </Button>
        )}
      </div>
    )
  }

  if (!task) return null

  const position = answered.length + 1
  const ready = Boolean(choice) && Boolean(confidence)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          Question {position} of {session.tasks.length}
        </span>
        <span>
          {session.participant_id}
          {preview ? " (preview)" : ""}
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
          style={{ width: `${(answered.length / session.tasks.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={task.task_id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{task.prompt}</h2>
          {task.hint && <p className="mt-1 text-sm text-slate-500">{task.hint}</p>}

          <div className="mt-5">
            <TaskExhibit task={task} />
          </div>

          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-semibold text-slate-900">Your answer</legend>
            <div className="space-y-2">
              {task.options.map((o) => (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                    choice === o.id
                      ? "border-violet-500 bg-violet-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`answer-${task.task_id}`}
                    checked={choice === o.id}
                    onChange={() => setChoice(o.id)}
                    className="mt-0.5"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          {task.asks_reason && (
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-semibold text-slate-900">Why? (optional)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="A short reason in your own words"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>
          )}

          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-semibold text-slate-900">How confident are you in your answer?</legend>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Not confident</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConfidence(n)}
                  aria-pressed={confidence === n}
                  className={`h-10 w-10 rounded-full border text-sm font-semibold transition-colors ${
                    confidence === n
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-slate-500">Very confident</span>
            </div>
          </fieldset>

          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <Button
            onClick={submit}
            disabled={!ready || busy}
            className="mt-6 gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {position === session.tasks.length ? "Finish" : "Submit and continue"}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}