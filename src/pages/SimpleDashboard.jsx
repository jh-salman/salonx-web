import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectProfile, selectMode } from '../features/auth/authSlice'

const SimpleDashboard = () => {
  const profile = useSelector(selectProfile)
  const mode = useSelector(selectMode)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to SalonX! 🎉
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">User Info</h2>
              <p><strong>Name:</strong> {profile?.full_name || 'N/A'}</p>
              <p><strong>Email:</strong> {profile?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {profile?.phone || 'N/A'}</p>
              <p><strong>Role:</strong> {profile?.role || 'N/A'}</p>
              <p><strong>Mode:</strong> {mode || 'N/A'}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Quick Actions</h2>
              <div className="space-y-2">
                <Link 
                  to="/calendar" 
                  className="block w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-center"
                >
                  View Calendar
                </Link>

              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Status</h2>
            <p className="text-green-600">✅ Authentication successful!</p>
            <p className="text-green-600">✅ App is loading correctly!</p>
            <p className="text-blue-600">ℹ️ This is a simple dashboard for testing</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleDashboard 