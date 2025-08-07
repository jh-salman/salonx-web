import React from 'react'

const TestPage = () => {
  console.log('TestPage: Rendering test page')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          SalonX Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this, the app is loading correctly!
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>✅ React is working</p>
          <p>✅ TailwindCSS is working</p>
          <p>✅ Component rendering is working</p>
        </div>
      </div>
    </div>
  )
}

export default TestPage 