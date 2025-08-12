import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ConnectionDiagnostic() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    setResults(null)
    
    const diagnosticResults = []
    
    try {
      // Test 1: Check environment variables
      diagnosticResults.push('🔍 Checking environment variables...')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl) {
        diagnosticResults.push('❌ VITE_SUPABASE_URL is missing')
      } else {
        diagnosticResults.push(`✅ VITE_SUPABASE_URL: ${supabaseUrl}`)
      }
      
      if (!supabaseKey) {
        diagnosticResults.push('❌ VITE_SUPABASE_ANON_KEY is missing')
      } else {
        diagnosticResults.push(`✅ VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`)
      }
      
      // Test 2: Test basic network connectivity
      diagnosticResults.push('🔍 Testing network connectivity...')
      try {
        const response = await fetch(supabaseUrl + '/rest/v1/', {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        
        if (response.ok) {
          diagnosticResults.push('✅ Network connectivity successful')
        } else {
          diagnosticResults.push(`❌ Network connectivity failed: ${response.status} ${response.statusText}`)
        }
      } catch (networkError) {
        diagnosticResults.push(`❌ Network connectivity error: ${networkError.message}`)
      }
      
      // Test 3: Test Supabase client initialization
      diagnosticResults.push('🔍 Testing Supabase client...')
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          diagnosticResults.push(`❌ Supabase client error: ${error.message}`)
        } else {
          diagnosticResults.push('✅ Supabase client working')
        }
      } catch (clientError) {
        diagnosticResults.push(`❌ Supabase client initialization error: ${clientError.message}`)
      }
      
      // Test 4: Test database connection
      diagnosticResults.push('🔍 Testing database connection...')
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        
        if (error) {
          diagnosticResults.push(`❌ Database connection failed: ${error.message}`)
          diagnosticResults.push(`🔧 Error details: ${JSON.stringify(error)}`)
        } else {
          diagnosticResults.push('✅ Database connection successful')
        }
      } catch (dbError) {
        diagnosticResults.push(`❌ Database connection error: ${dbError.message}`)
      }
      
      // Test 5: Test storage connection
      diagnosticResults.push('🔍 Testing storage connection...')
      try {
        const { data, error } = await supabase.storage.listBuckets()
        
        if (error) {
          diagnosticResults.push(`❌ Storage connection failed: ${error.message}`)
          diagnosticResults.push(`🔧 Storage error details: ${JSON.stringify(error)}`)
        } else {
          diagnosticResults.push(`✅ Storage connection successful (${data?.length || 0} buckets)`)
        }
      } catch (storageError) {
        diagnosticResults.push(`❌ Storage connection error: ${storageError.message}`)
      }
      
      // Test 6: Test authentication
      diagnosticResults.push('🔍 Testing authentication...')
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          diagnosticResults.push(`❌ Authentication check failed: ${error.message}`)
        } else if (!user) {
          diagnosticResults.push('⚠️ No user authenticated')
        } else {
          diagnosticResults.push(`✅ User authenticated: ${user.email}`)
        }
      } catch (authError) {
        diagnosticResults.push(`❌ Authentication error: ${authError.message}`)
      }
      
      // Test 7: Test realtime connection
      diagnosticResults.push('🔍 Testing realtime connection...')
      try {
        const channel = supabase.channel('test-connection')
        const status = await channel.subscribe()
        
        if (status === 'SUBSCRIBED') {
          diagnosticResults.push('✅ Realtime connection successful')
          channel.unsubscribe()
        } else {
          diagnosticResults.push(`❌ Realtime connection failed: ${status}`)
        }
      } catch (realtimeError) {
        diagnosticResults.push(`❌ Realtime connection error: ${realtimeError.message}`)
      }
      

      
    } catch (error) {
      diagnosticResults.push(`❌ Diagnostic failed: ${error.message}`)
    }
    
    setResults(diagnosticResults)
    setLoading(false)
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white font-semibold mb-4">Supabase Connection Diagnostic</h3>
      
      <button 
        onClick={runDiagnostic}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Connection Diagnostic'}
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
    </div>
  )
} 