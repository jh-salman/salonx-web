import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectActiveAlerts, removeAlert } from '../../features/alerts/alertsSlice'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const AlertContainer = () => {
  const dispatch = useDispatch()
  const alerts = useSelector(selectActiveAlerts)

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'info':
        return <Info className="w-5 h-5" />
      default:
        return null
    }
  }

  const getAlertClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/30 text-green-300'
      case 'error':
        return 'bg-red-900/20 border-red-500/30 text-red-300'
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
      case 'info':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-300'
      default:
        return 'bg-gray-800 border-gray-600 text-gray-300'
    }
  }

  const handleDismiss = (alertId) => {
    dispatch(removeAlert(alertId))
  }

  // Auto-dismiss alerts with duration
  useEffect(() => {
    alerts.forEach(alert => {
      if (alert.duration && alert.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeAlert(alert.id))
        }, alert.duration)

        return () => clearTimeout(timer)
      }
    })
  }, [alerts, dispatch])

  if (alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start p-4 rounded-lg border shadow-sm animate-slide-up ${getAlertClasses(alert.type)}`}
        >
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {getAlertIcon(alert.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            {alert.title && (
              <h4 className="text-sm font-medium mb-1">
                {alert.title}
              </h4>
            )}
            <p className="text-sm">
              {typeof alert.message === 'string' ? alert.message : alert.message?.message || 'An error occurred'}
            </p>
          </div>
          
          {alert.dismissible && (
            <button
              onClick={() => handleDismiss(alert.id)}
              className="flex-shrink-0 ml-3 p-1 rounded-md hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default AlertContainer 