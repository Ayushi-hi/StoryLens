import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="flex items-center gap-2 font-[Plus_Jakarta_Sans] text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-teal-400">
              <Sparkles className="h-5 w-5" />
            </span>
            StoryLens
          </span>
          <Link to="/app/overview" className="text-sm text-slate-300 hover:text-white">
            Dashboard
          </Link>
        </nav>

        <section className="relative mx-auto max-w-4xl px-6 pb-32 pt-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold leading-tight sm:text-6xl"
          >
            Turn Millions of Events <br />
            Into <span className="text-gradient">Stories</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg"
          >
            An AI-powered data storytelling platform that transforms complex big-data
            analytics into simple insights for everyone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 text-white hover:opacity-90">
              <Link to="/app/story">
                Explore the Story <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl border-white/20 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white">
              <Link to="/app/overview">View Dashboard</Link>
            </Button>
          </motion.div>
        </section>
      </div>
    </div>
  )
}