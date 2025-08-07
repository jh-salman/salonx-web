import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchAppointments } from '../appointments/appointmentsSlice'
import { fetchClients } from '../clients/clientsSlice'
import { fetchServices } from '../services/servicesSlice'
import { fetchBranding } from '../branding/brandingSlice'
import { fetchPerformance } from '../performance/performanceSlice'
import { fetchWaitlist } from '../waitlist/waitlistSlice'

// Async thunk to fetch all initial data
export const fetchInitialData = createAsyncThunk(
  'app/fetchInitialData',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      console.log('fetchInitialData: Starting initial data fetch...')
      
      // Check if data is already loaded
      const state = getState()
      const isAlreadyLoaded = state.app.isInitialDataLoaded
      const isCurrentlyLoading = state.app.isDataLoading
      
      if (isAlreadyLoaded) {
        console.log('fetchInitialData: Data already loaded, skipping fetch')
        return { success: true, cached: true }
      }
      
      if (isCurrentlyLoading) {
        console.log('fetchInitialData: Data is currently loading, skipping fetch')
        return { success: true, loading: true }
      }
      
      // Check localStorage for data loaded state
      const savedDataState = localStorage.getItem('salonx-data-loaded')
      if (savedDataState) {
        try {
          const parsed = JSON.parse(savedDataState)
          if (parsed.isInitialDataLoaded) {
            console.log('fetchInitialData: Data already loaded according to localStorage, skipping fetch')
            return { success: true, cached: true }
          }
        } catch (error) {
          console.warn('fetchInitialData: Error parsing saved data state:', error)
        }
      }
      
      // Fetch all data in parallel with individual error handling
      const promises = [
        dispatch(fetchAppointments()).catch(error => {
          console.warn('fetchInitialData: fetchAppointments failed:', error)
          // Don't throw, just return error object
          return { error: error.message || 'Failed to fetch appointments' }
        }),
        dispatch(fetchClients()).catch(error => {
          console.warn('fetchInitialData: fetchClients failed:', error)
          return { error: error.message || 'Failed to fetch clients' }
        }),
        dispatch(fetchServices()).catch(error => {
          console.warn('fetchInitialData: fetchServices failed:', error)
          return { error: error.message || 'Failed to fetch services' }
        }),
        dispatch(fetchBranding()).catch(error => {
          console.warn('fetchInitialData: fetchBranding failed:', error)
          return { error: error.message || 'Failed to fetch branding' }
        }),
        dispatch(fetchPerformance()).catch(error => {
          console.warn('fetchInitialData: fetchPerformance failed:', error)
          return { error: error.message || 'Failed to fetch performance' }
        }),
        dispatch(fetchWaitlist()).catch(error => {
          console.warn('fetchInitialData: fetchWaitlist failed:', error)
          return { error: error.message || 'Failed to fetch waitlist' }
        })
      ]
      
      // Wait for at least one promise to complete with a reasonable timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 3000)
      )
      
      try {
        const results = await Promise.race([
          Promise.any(promises),
          timeoutPromise
        ])
        
        console.log('fetchInitialData: At least one data fetch completed')
        
        // Mark as loaded even if some failed
        console.log('fetchInitialData: Marking data as loaded')
      } catch (error) {
        console.warn('fetchInitialData: All promises failed or timed out:', error)
        // Even if all failed, mark as loaded to prevent infinite loading
        console.log('fetchInitialData: Marking data as loaded despite timeout')
      }
      
      return { success: true }
    } catch (error) {
      console.error('fetchInitialData: Error fetching initial data:', error)
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk to check if data is loaded
export const checkDataLoaded = createAsyncThunk(
  'app/checkDataLoaded',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState()
      
      // Check if all required data is loaded
      const isDataLoaded = (
        state.appointments.appointments.length > 0 ||
        state.clients.clients.length > 0 ||
        state.services.services.length > 0 ||
        state.branding.brandingContent.length > 0
      )
      
      return { isDataLoaded }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  isInitialDataLoaded: false,
  isDataLoading: false,
  dataLoadError: null,
  lastDataFetch: null,
  dataFetchCount: 0,
  isFetching: false // Prevent duplicate calls
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInitialDataLoaded: (state, action) => {
      state.isInitialDataLoaded = action.payload
    },
    setDataLoading: (state, action) => {
      state.isDataLoading = action.payload
    },
    clearDataLoadError: (state) => {
      state.dataLoadError = null
    },
    resetDataState: (state) => {
      state.isInitialDataLoaded = false
      state.isDataLoading = false
      state.dataLoadError = null
      state.lastDataFetch = null
      state.dataFetchCount = 0
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Initial Data
      .addCase(fetchInitialData.pending, (state) => {
        state.isDataLoading = true
        state.isFetching = true
        state.dataLoadError = null
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.isDataLoading = false
        state.isFetching = false
        state.isInitialDataLoaded = true
        state.lastDataFetch = new Date().toISOString()
        state.dataFetchCount += 1
        state.dataLoadError = null
        
        // Save to localStorage to persist data loading state
        localStorage.setItem('salonx-data-loaded', JSON.stringify({
          isInitialDataLoaded: true,
          lastDataFetch: state.lastDataFetch,
          dataFetchCount: state.dataFetchCount
        }))
        
        console.log('appSlice: Initial data fetch completed successfully')
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.isDataLoading = false
        state.isFetching = false
        state.dataLoadError = action.payload
        // Even if some data failed to load, mark as loaded to prevent infinite loading
        state.isInitialDataLoaded = true
        console.log('appSlice: Initial data fetch failed, but marking as loaded:', action.payload)
      })
      // Check Data Loaded
      .addCase(checkDataLoaded.fulfilled, (state, action) => {
        state.isInitialDataLoaded = action.payload.isDataLoaded
      })
  }
})

export const { 
  setInitialDataLoaded, 
  setDataLoading, 
  clearDataLoadError, 
  resetDataState 
} = appSlice.actions

// Selectors
export const selectIsInitialDataLoaded = (state) => state.app.isInitialDataLoaded
export const selectIsDataLoading = (state) => state.app.isDataLoading
export const selectDataLoadError = (state) => state.app.dataLoadError
export const selectLastDataFetch = (state) => state.app.lastDataFetch
export const selectDataFetchCount = (state) => state.app.dataFetchCount

export default appSlice.reducer 