import { useState, useRef, useCallback, useEffect } from "react"

export function useShowQOps() {
  const [showQOps, setShowQOps] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const triggerShowQOps = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setShowQOps(true)
    timeoutRef.current = setTimeout(() => setShowQOps(false), 5_000)
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return { showQOps, triggerShowQOps }
}
