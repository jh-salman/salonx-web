import React from 'react'

const LoadingSpinner = ({ size = 'md', color = 'purple', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colorClasses = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500'
  }

  return (
    <div className="flex items-center justify-center space-x-3">
      <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}></div>
      {text && <span className="text-gray-400 text-sm">{text}</span>}
    </div>
  )
}

export default LoadingSpinner 