import { useEffect, useRef } from "react"
import { animate, useInView } from "framer-motion"
import { formatCompact, formatNumber, formatPercent } from "@/utils/format"

export type CounterKind = "compact" | "number" | "percent"

const FORMATTERS: Record<CounterKind, (n: number) => string> = {
  compact: formatCompact,
  number: formatNumber,
  percent: (n) => formatPercent(n, 2),
}

interface AnimatedCounterProps {
  value: number
  kind?: CounterKind
}

export default function AnimatedCounter({ value, kind = "compact" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || !ref.current) return
    const node = ref.current
    const format = FORMATTERS[kind]
    const controls = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [inView, value, kind])

  return <span ref={ref}>{FORMATTERS[kind](0)}</span>
}