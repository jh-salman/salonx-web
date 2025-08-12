import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchClients } from '../../features/clients/clientsSlice'
import { fetchServices } from '../../features/services/servicesSlice'

export default function DataDiagnostic() {
  const dispatch = useDispatch()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  // Get state from Redux
  const auth = useSelector(state => state.auth)
  const clients = useSelector(state => state.clients)
  const services = useSelector(state => state.services)
  const app = useSelector(state => state.app)

  const runDiagnostic = async () => {
    setLoading(true)
    setResults(null)
    
    const diagnosticResults = []
    
    try {
      // Test 1: Authentication
      diagnosticResults.push('🔍 Testing authentication...')
      if (!auth.isAuthenticated) {
        diagnosticResults.push('❌ User not authenticated')
        diagnosticResults.push(`🔧 Auth state: ${JSON.stringify({
          isAuthenticated: auth.isAuthenticated,
          user: auth.user ? 'Present' : 'Missing',
          profile: auth.profile ? 'Present' : 'Missing'
        })}`)
      } else {
        diagnosticResults.push('✅ User authenticated')
        diagnosticResults.push(`👤 User: ${auth.user?.email || 'Unknown'}`)
        diagnosticResults.push(`👤 Profile ID: ${auth.profile?.id || 'Missing'}`)
        diagnosticResults.push(`🏢 Mode: ${auth.mode || 'Unknown'}`)
        diagnosticResults.push(`🏢 Brand ID: ${auth.brandId || 'None'}`)
      }
      
      // Test 2: App State
      diagnosticResults.push('🔍 Testing app state...')
      diagnosticResults.push(`📊 Initial data loaded: ${app.isInitialDataLoaded ? 'Yes' : 'No'}`)
      diagnosticResults.push(`📊 Data loading: ${app.isDataLoading ? 'Yes' : 'No'}`)
      diagnosticResults.push(`📊 Fetching: ${app.isFetching ? 'Yes' : 'No'}`)
      
      // Test 3: Clients State
      diagnosticResults.push('🔍 Testing clients state...')
      diagnosticResults.push(`👥 Clients loading: ${clients.isLoading ? 'Yes' : 'No'}`)
      diagnosticResults.push(`👥 Clients count: ${clients.clients.length}`)
      diagnosticResults.push(`👥 Clients error: ${clients.error || 'None'}`)
      
      // Test 4: Services State
      diagnosticResults.push('🔍 Testing services state...')
      diagnosticResults.push(`🔧 Services loading: ${services.isLoading ? 'Yes' : 'No'}`)
      diagnosticResults.push(`🔧 Services count: ${services.services.length}`)
      diagnosticResults.push(`🔧 Services error: ${services.error || 'None'}`)
      
      // Test 5: Manual fetch test
      if (auth.isAuthenticated) {
        diagnosticResults.push('🔍 Testing manual data fetch...')
        
        try {
          const clientsResult = await dispatch(fetchClients()).unwrap()
          diagnosticResults.push(`✅ Clients fetch successful: ${clientsResult.length} clients`)
        } catch (error) {
          diagnosticResults.push(`❌ Clients fetch failed: ${error}`)
        }
        
        try {
          const servicesResult = await dispatch(fetchServices()).unwrap()
          diagnosticResults.push(`✅ Services fetch successful: ${servicesResult.length} services`)
        } catch (error) {
          diagnosticResults.push(`❌ Services fetch failed: ${error}`)
        }
      }
      
    } catch (error) {
      diagnosticResults.push(`❌ Diagnostic failed: ${error.message}`)
    }
    
    setResults(diagnosticResults)
    setLoading(false)
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white font-semibold mb-4">Data Loading Diagnostic</h3>
      
      <button 
        onClick={runDiagnostic}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Diagnostic'}
      </button>
      
      {results && (
        <div className="mt-4">
          <h4 className="text-white font-medium mb-2">Results:</h4>
          <div className="bg-gray-900 p-3 rounded text-sm max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="mb-1 text-gray-300">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Current State Display */}
      <div className="mt-4">
        <h4 className="text-white font-medium mb-2">Current State:</h4>
        <div className="bg-gray-900 p-3 rounded text-sm">
          <div className="text-gray-300 space-y-1">
            <div>Auth: {auth.isAuthenticated ? '✅' : '❌'}</div>
            <div>Clients: {clients.clients.length} ({clients.isLoading ? 'Loading' : 'Ready'})</div>
            <div>Services: {services.services.length} ({services.isLoading ? 'Loading' : 'Ready'})</div>
            <div>Initial Data: {app.isInitialDataLoaded ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 