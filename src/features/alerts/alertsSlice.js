import { createSlice, createSelector } from '@reduxjs/toolkit'

// Initial state
const initialState = {
  alerts: [],
  nextId: 1
}

// Alert types
export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Calendar slice
const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action) => {
      const { type, message, title, duration = 5000, dismissible = true } = action.payload
      const alert = {
        id: state.nextId++,
        type,
        message,
        title,
        duration,
        dismissible,
        timestamp: Date.now()
      }
      state.alerts.push(alert)
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload)
    },
    clearAlerts: (state) => {
      state.alerts = []
    },
    clearAlertsByType: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.type !== action.payload)
    },
    // Convenience methods
    addSuccess: (state, action) => {
      const { message, title, duration, dismissible } = action.payload
      alertsSlice.caseReducers.addAlert(state, {
        payload: {
          type: ALERT_TYPES.SUCCESS,
          message,
          title: title || 'Success',
          duration,
          dismissible
        }
      })
    },
    addError: (state, action) => {
      const { message, title, duration, dismissible } = action.payload
      alertsSlice.caseReducers.addAlert(state, {
        payload: {
          type: ALERT_TYPES.ERROR,
          message,
          title: title || 'Error',
          duration,
          dismissible
        }
      })
    },
    addWarning: (state, action) => {
      const { message, title, duration, dismissible } = action.payload
      alertsSlice.caseReducers.addAlert(state, {
        payload: {
          type: ALERT_TYPES.WARNING,
          message,
          title: title || 'Warning',
          duration,
          dismissible
        }
      })
    },
    addInfo: (state, action) => {
      const { message, title, duration, dismissible } = action.payload
      alertsSlice.caseReducers.addAlert(state, {
        payload: {
          type: ALERT_TYPES.INFO,
          message,
          title: title || 'Information',
          duration,
          dismissible
        }
      })
    }
  }
})

export const {
  addAlert,
  removeAlert,
  clearAlerts,
  clearAlertsByType,
  addSuccess,
  addError,
  addWarning,
  addInfo
} = alertsSlice.actions

// Selectors
export const selectAlerts = (state) => state.alerts.alerts

export const selectAlertsByType = createSelector(
  [selectAlerts, (state, type) => type],
  (alerts, type) => alerts.filter(alert => alert.type === type)
)

export const selectSuccessAlerts = (state) => selectAlertsByType(state, ALERT_TYPES.SUCCESS)
export const selectErrorAlerts = (state) => selectAlertsByType(state, ALERT_TYPES.ERROR)
export const selectWarningAlerts = (state) => selectAlertsByType(state, ALERT_TYPES.WARNING)
export const selectInfoAlerts = (state) => selectAlertsByType(state, ALERT_TYPES.INFO)

export const selectActiveAlerts = createSelector(
  [selectAlerts],
  (alerts) => {
    const now = Date.now()
    return alerts.filter(alert => {
      if (!alert.duration) return true
      return (now - alert.timestamp) < alert.duration
    })
  }
)

export default alertsSlice.reducer 