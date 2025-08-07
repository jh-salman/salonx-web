import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import { supabase, supabaseHelpers } from '../../lib/supabase'
import { KPI_TYPES } from '../../lib/constants'

// Async thunks
export const fetchPerformance = createAsyncThunk(
  'performance/fetchPerformance',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth
      
      let query = supabase
        .from('performance_logs')
        .select('*')
        .order('date', { ascending: false })

      // Apply role-based filtering
      if (auth.mode === 'team') {
        query = query.eq('brand_id', auth.brandId)
      } else {
        query = query.eq('stylist_id', profile.id)
      }

      const { data, error } = await query

      if (error) throw error

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createPerformanceLog = createAsyncThunk(
  'performance/createPerformanceLog',
  async (performanceData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      const performance = {
        ...performanceData,
        stylist_id: profile.id,
        brand_id: auth.brandId,
        date: new Date().toISOString().split('T')[0] // Today's date
      }

      const { data, error } = await supabase
        .from('performance_logs')
        .insert(performance)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updatePerformanceLog = createAsyncThunk(
  'performance/updatePerformanceLog',
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      // Check permissions
      const { data: existingLog } = await supabase
        .from('performance_logs')
        .select('stylist_id, brand_id')
        .eq('id', id)
        .single()

      if (!existingLog) {
        throw new Error('Performance log not found')
      }

      // Allow update if user is the stylist or brand owner
      const canUpdate = 
        existingLog.stylist_id === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner' && existingLog.brand_id === auth.brandId)

      if (!canUpdate) {
        throw new Error('Permission denied')
      }

      const { data, error } = await supabase
        .from('performance_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const deletePerformanceLog = createAsyncThunk(
  'performance/deletePerformanceLog',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      // Check permissions
      const { data: existingLog } = await supabase
        .from('performance_logs')
        .select('stylist_id, brand_id')
        .eq('id', id)
        .single()

      if (!existingLog) {
        throw new Error('Performance log not found')
      }

      const canDelete = 
        existingLog.stylist_id === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner' && existingLog.brand_id === auth.brandId)

      if (!canDelete) {
        throw new Error('Permission denied')
      }

      const { error } = await supabase
        .from('performance_logs')
        .delete()
        .eq('id', id)

      if (error) throw error

      return id
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTodayPerformance = createAsyncThunk(
  'performance/fetchTodayPerformance',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth
      const today = new Date().toISOString().split('T')[0]
      
      let query = supabase
        .from('performance_logs')
        .select('*')
        .eq('date', today)

      // Apply role-based filtering
      if (auth.mode === 'team') {
        query = query.eq('brand_id', auth.brandId)
      } else {
        query = query.eq('stylist_id', profile.id)
      }

      const { data, error } = await query

      if (error) throw error

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Initial state
const initialState = {
  performanceLogs: [],
  todayPerformance: null,
  selectedLog: null,
  isLoading: false,
  error: null,
  completionDots: {
    revenue: false,
    retail: false,
    retention: false,
    serviceGain: false
  }
}

// Performance slice
const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    setSelectedLog: (state, action) => {
      state.selectedLog = action.payload
    },
    clearSelectedLog: (state) => {
      state.selectedLog = null
    },
    setCompletionDot: (state, action) => {
      const { kpi, completed } = action.payload
      state.completionDots[kpi] = completed
    },
    clearCompletionDots: (state) => {
      state.completionDots = {
        revenue: false,
        retail: false,
        retention: false,
        serviceGain: false
      }
    },
    clearError: (state) => {
      state.error = null
    },
    // Realtime updates
    performanceLogAdded: (state, action) => {
      state.performanceLogs.unshift(action.payload) // Add to beginning
    },
    performanceLogUpdated: (state, action) => {
      const index = state.performanceLogs.findIndex(log => log.id === action.payload.id)
      if (index !== -1) {
        state.performanceLogs[index] = action.payload
      }
      // Update selected log if it's the same
      if (state.selectedLog && state.selectedLog.id === action.payload.id) {
        state.selectedLog = action.payload
      }
    },
    performanceLogDeleted: (state, action) => {
      state.performanceLogs = state.performanceLogs.filter(log => log.id !== action.payload)
      if (state.selectedLog && state.selectedLog.id === action.payload) {
        state.selectedLog = null
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Performance
      .addCase(fetchPerformance.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPerformance.fulfilled, (state, action) => {
        state.isLoading = false
        state.performanceLogs = action.payload
      })
      .addCase(fetchPerformance.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Create Performance Log
      .addCase(createPerformanceLog.fulfilled, (state, action) => {
        state.performanceLogs.unshift(action.payload)
      })
      .addCase(createPerformanceLog.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update Performance Log
      .addCase(updatePerformanceLog.fulfilled, (state, action) => {
        const index = state.performanceLogs.findIndex(log => log.id === action.payload.id)
        if (index !== -1) {
          state.performanceLogs[index] = action.payload
        }
        if (state.selectedLog && state.selectedLog.id === action.payload.id) {
          state.selectedLog = action.payload
        }
      })
      .addCase(updatePerformanceLog.rejected, (state, action) => {
        state.error = action.payload
      })
      // Delete Performance Log
      .addCase(deletePerformanceLog.fulfilled, (state, action) => {
        state.performanceLogs = state.performanceLogs.filter(log => log.id !== action.payload)
        if (state.selectedLog && state.selectedLog.id === action.payload) {
          state.selectedLog = null
        }
      })
      .addCase(deletePerformanceLog.rejected, (state, action) => {
        state.error = action.payload
      })
      // Fetch Today Performance
      .addCase(fetchTodayPerformance.fulfilled, (state, action) => {
        state.todayPerformance = action.payload[0] || null
      })
      .addCase(fetchTodayPerformance.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const {
  setSelectedLog,
  clearSelectedLog,
  setCompletionDot,
  clearCompletionDots,
  clearError,
  performanceLogAdded,
  performanceLogUpdated,
  performanceLogDeleted
} = performanceSlice.actions

// Selectors
export const selectPerformanceLogs = (state) => state.performance.performanceLogs
export const selectTodayPerformance = (state) => state.performance.todayPerformance
export const selectSelectedLog = (state) => state.performance.selectedLog
export const selectIsLoading = (state) => state.performance.isLoading
export const selectError = (state) => state.performance.error
export const selectCompletionDots = (state) => state.performance.completionDots

// Main performance selector for dashboard
export const selectPerformance = createSelector(
  [selectTodayPerformance, selectPerformanceLogs, selectIsLoading, selectError],
  (todayPerformance, performanceLogs, isLoading, error) => {
    return {
      todayPerformance,
      performanceLogs,
      isLoading,
      error
    }
  }
)

// Filtered selectors
export const selectPerformanceByDate = (state, date) => {
  return state.performance.performanceLogs.filter(log => log.date === date)
}

export const selectPerformanceByStylist = (state, stylistId) => {
  return state.performance.performanceLogs.filter(log => log.stylist_id === stylistId)
}

export const selectKPIValue = (state, kpiType) => {
  const today = state.performance.todayPerformance
  if (!today || !today.kpi_score) return 0
  
  return today.kpi_score[kpiType] || 0
}

export const selectAverageKPI = (state, kpiType, days = 7) => {
  const logs = state.performance.performanceLogs.slice(0, days)
  if (logs.length === 0) return 0
  
  const total = logs.reduce((sum, log) => {
    const value = log.kpi_score?.[kpiType] || 0
    return sum + value
  }, 0)
  
  return Math.round(total / logs.length)
}

export default performanceSlice.reducer 