import React, { useState, useEffect } from 'react'
import SimpleLoading from './SimpleLoading'

const LoadingTimeout = ({ children, timeout = 5000, fallback = null }) => {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  if (showFallback) {
    return fallback || <SimpleLoading message="Loading is taking longer than expected..." />
  }

  return children
}

export default LoadingTimeout 