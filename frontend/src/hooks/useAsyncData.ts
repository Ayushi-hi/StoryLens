import { useEffect, useState } from "react"

// Loads data once and exposes loading / error state.
// `loader` must be a stable function (defined outside the component).
export function useAsyncData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loader()
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Something went wrong")
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loader])

  return { data, error, loading }
}