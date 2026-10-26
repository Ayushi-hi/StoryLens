import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </motion.div>
  )
}