import React from 'react'

const QuickLoading = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
    </div>
  )
}

export default QuickLoading 