import React, { useState, useEffect } from 'react'

const LoadingState = ({ message = "Loading...", timeout = 3000 }) => {
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-300 mb-2">{message}</p>
        {showTimeout && (
          <p className="text-sm text-gray-500">
            This is taking longer than usual...
          </p>
        )}
      </div>
    </div>
  )
}

export default LoadingState 