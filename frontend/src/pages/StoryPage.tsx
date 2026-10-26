import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import PageHeader from "@/components/common/PageHeader"
import DemoBadge from "@/components/common/DemoBadge"
import StoryBlocks from "@/components/common/StoryBlocks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import CategoryChart from "@/charts/CategoryChart"
import EventDistributionChart from "@/charts/EventDistributionChart"
import FunnelChart from "@/charts/FunnelChart"
import PurchaseTrendChart from "@/charts/PurchaseTrendChart"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getStoryInputs, IS_DEMO } from "@/services/dataService"
import { buildChapters, type Chapter } from "@/utils/chapters"
import type { OverviewBundle } from "@/types/analytics"
import type { FunnelData } from "@/types/story"

const header = (
  <PageHeader
    eyebrow="Story Mode"
    title="Story Mode"
    description="Read the data as a sequence of stories: What, So What, Now What."
    actions={IS_DEMO ? <DemoBadge /> : undefined}
  />
)

function Visual({ chapter, bundle, funnel }: { chapter: Chapter; bundle: OverviewBundle; funnel: FunnelData }) {
  switch (chapter.visual) {
    case "funnel":
      return <FunnelChart funnel={funnel} />
    case "categories":
      return <CategoryChart data={bundle.categories} />
    case "trend":
      return <PurchaseTrendChart data={bundle.daily} />
    case "distribution":
      return <EventDistributionChart data={bundle.distribution} />
  }
}

export default function StoryPage() {
  const navigate = useNavigate()
  const { data, error, loading } = useAsyncData(getStoryInputs)
  const [index, setIndex] = useState(0)

  const chapters = useMemo(
    () => (data ? buildChapters(data.bundle, data.funnel) : []),
    [data]
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [index])

  if (loading) {
    return (
      <div>
        {header}
        <Skeleton className="h-[32rem] rounded-2xl" />
      </div>
    )
  }

  if (error || !data || chapters.length === 0) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load the stories. {error}
        </div>
      </div>
    )
  }

  const chapter = chapters[index]
  const isLast = index === chapters.length - 1

  return (
    <div>
      {header}

      {/* Progress */}
      <div className="mb-6 flex items-center gap-2">
        {chapters.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to story ${i + 1}`}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= index ? "bg-gradient-to-r from-blue-500 to-violet-500" : "bg-slate-200"
            }`}
          />
        ))}
        <span className="ml-2 shrink-0 text-xs font-medium text-slate-500">
          {index + 1} / {chapters.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={chapter.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
            Story {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="mt-1 max-w-3xl text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {chapter.story.headline}
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">{chapter.story.summary}</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Visual chapter={chapter} bundle={data.bundle} funnel={data.funnel} />
          </div>

          <div className="mt-6">
            <StoryBlocks story={chapter.story} />
          </div>
        </motion.article>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          className="gap-1.5 rounded-lg"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        {isLast ? (
          <Button
            className="gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
            onClick={() => navigate("/app/insights")}
          >
            See all insights
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
            onClick={() => setIndex((i) => i + 1)}
          >
            Next Story
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}