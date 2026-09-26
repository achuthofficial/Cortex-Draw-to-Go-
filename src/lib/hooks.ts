import { useEffect, useState } from 'react'
import { useUi } from '@/store/ui'

/** Simulated fetch latency so skeleton states are visible; honours the "simulate errors" toggle in Settings. */
export function useSimulatedLoad(ms = 450) {
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const simulateErrors = useUi((s) => s.simulateErrors)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms, attempt])
  return { loading, error: !loading && simulateErrors, retry: () => setAttempt((a) => a + 1) }
}

export function useInterval(fn: () => void, ms: number | null) {
  useEffect(() => {
    if (ms === null) return
    const t = setInterval(fn, ms)
    return () => clearInterval(t)
  }, [fn, ms])
}
