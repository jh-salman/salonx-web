import React from 'react'
import { useSelector } from 'react-redux'

const DebugPage = () => {
  const auth = useSelector(state => state.auth)
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Debug Info</h1>
        <div className="space-y-4 text-sm">
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Authentication State:</h2>
            <div className="bg-gray-100 p-3 rounded">
              <p><strong>isAuthenticated:</strong> {auth.isAuthenticated.toString()}</p>
              <p><strong>isLoading:</strong> {auth.isLoading.toString()}</p>
              <p><strong>Mode:</strong> {auth.mode || 'null'}</p>
              <p><strong>Brand ID:</strong> {auth.brandId || 'null'}</p>
            </div>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">User Data:</h2>
            <div className="bg-gray-100 p-3 rounded">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(auth.user, null, 2)}
              </pre>
            </div>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Profile Data:</h2>
            <div className="bg-gray-100 p-3 rounded">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(auth.profile, null, 2)}
              </pre>
            </div>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Error:</h2>
            <div className="bg-gray-100 p-3 rounded">
              <p>{auth.error || 'No error'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugPage 