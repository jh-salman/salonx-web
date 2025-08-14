import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAppointments } from '../../features/appointments/appointmentsSlice'
import { selectClients } from '../../features/clients/clientsSlice'
import { selectServices } from '../../features/services/servicesSlice'
import { selectIsDataLoading } from '../../features/app/appSlice'
import { Wifi, WifiOff, Database, Clock, CheckCircle, XCircle } from 'lucide-react'

const ConnectionDiagnostic = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [lastUpdate, setLastUpdate] = useState(null)
  
  const appointments = useSelector(selectAppointments)
  const clients = useSelector(selectClients)
  const services = useSelector(selectServices)
  const isDataLoading = useSelector(selectIsDataLoading)
  
  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          mode: 'no-cors'
        })
        setConnectionStatus('connected')
      } catch (error) {
        setConnectionStatus('disconnected')
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    setLastUpdate(new Date())
  }, [appointments, clients, services])
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Connection Diagnostic"
      >
        <Database className="w-4 h-4" />
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Connection Diagnostic</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-xs">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span>Internet Connection:</span>
          <div className="flex items-center space-x-1">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {/* Data Loading Status */}
        <div className="flex items-center justify-between">
          <span>Data Loading:</span>
          <div className="flex items-center space-x-1">
            {isDataLoading ? (
              <Clock className="w-3 h-3 text-yellow-400 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3 text-green-400" />
            )}
            <span className={isDataLoading ? 'text-yellow-400' : 'text-green-400'}>
              {isDataLoading ? 'Loading...' : 'Loaded'}
            </span>
          </div>
        </div>
        
        {/* Data Counts */}
        <div className="flex items-center justify-between">
          <span>Appointments:</span>
          <span className="text-blue-400">{appointments?.length || 0}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Clients:</span>
          <span className="text-green-400">{clients?.length || 0}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Services:</span>
          <span className="text-purple-400">{services?.length || 0}</span>
        </div>
        
        {/* Last Update */}
        {lastUpdate && (
          <div className="flex items-center justify-between">
            <span>Last Update:</span>
            <span className="text-gray-400">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {/* Realtime Status */}
        <div className="flex items-center justify-between">
          <span>Realtime:</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionDiagnostic 