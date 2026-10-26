import { useState } from "react"
import { Copy, Eye } from "lucide-react"
import PageHeader from "@/components/common/PageHeader"
import ParticipantFlow from "@/components/research/ParticipantFlow"
import ResultsPanel from "@/components/research/ResultsPanel"
import { Button } from "@/components/ui/button"
import type { Condition } from "@/types/research"

export default function ResearchPage() {
  const [preview, setPreview] = useState<Condition | null>(null)
  const [copied, setCopied] = useState(false)
  const studyLink = `${window.location.origin}/study`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(studyLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable; the link is shown on the page anyway
    }
  }

  if (preview) {
    return (
      <div>
        <PageHeader
          eyebrow="Research"
          title={`Preview: ${preview === "TRADITIONAL" ? "Traditional" : "Storytelling"}`}
          description="Preview sessions are not saved in the results."
        />
        <ParticipantFlow preview={preview} storageKey={`storylens-preview-${preview}`} onExit={() => setPreview(null)} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Research"
        title="Research Mode"
        description="Run the user study and view observed participant results."
      />

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Run the study</h2>
        <p className="mt-1 text-sm text-slate-600">
          Send participants this link. Each person is placed in the Traditional or Storytelling group automatically,
          keeping the groups balanced.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-800">{studyLink}</code>
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 rounded-lg">
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={() => setPreview("TRADITIONAL")}>
            <Eye className="h-4 w-4" />
            Preview Traditional
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={() => setPreview("STORYTELLING")}>
            <Eye className="h-4 w-4" />
            Preview Storytelling
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Before real data collection: pilot with a few people, then reset the test data (stop the backend and run
          python -m scripts.reset_research). This page and its results are not password protected yet.
        </p>
      </section>

      <ResultsPanel />
    </div>
  )
}