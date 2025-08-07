import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'

// Async thunks
export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile
      
      // Check if user is authenticated
      if (!auth.isAuthenticated || !profile) {
        console.log('fetchServices: User not authenticated or no profile')
        return []
      }
      
      let query = supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true })

      // Apply role-based filtering
      if (auth.mode === 'team') {
        query = query.eq('brand_id', auth.brandId)
      } else {
        query = query.eq('stylist_id', profile.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('fetchServices: Database error:', error)
        throw error
      }

      console.log('fetchServices: Successfully fetched', data?.length || 0, 'services')
      return data || []
    } catch (error) {
      console.error('fetchServices: Error fetching services:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const createService = createAsyncThunk(
  'services/createService',
  async (serviceData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile

      const service = {
        ...serviceData,
        stylist_id: profile.id,
        brand_id: auth.brandId
      }

      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()

      if (error) {
        console.error('createService: Database error:', error)
        throw error
      }

      console.log('createService: Successfully created service:', data)
      return data
    } catch (error) {
      console.error('createService: Error creating service:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const updateService = createAsyncThunk(
  'services/updateService',
  async ({ id, serviceData }, { getState, rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('updateService: Database error:', error)
        throw error
      }

      console.log('updateService: Successfully updated service:', data)
      return data
    } catch (error) {
      console.error('updateService: Error updating service:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('deleteService: Database error:', error)
        throw error
      }

      console.log('deleteService: Successfully deleted service:', id)
      return id
    } catch (error) {
      console.error('deleteService: Error deleting service:', error)
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  services: [],
  selectedService: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    category: 'all',
    priceRange: 'all'
  }
}

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setSelectedService: (state, action) => {
      state.selectedService = action.payload
    },
    clearSelectedService: (state) => {
      state.selectedService = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearError: (state) => {
      state.error = null
    },
    // Realtime updates
    serviceAdded: (state, action) => {
      state.services.push(action.payload)
    },
    serviceUpdated: (state, action) => {
      const index = state.services.findIndex(service => service.id === action.payload.id)
      if (index !== -1) {
        state.services[index] = action.payload
      }
    },
    serviceDeleted: (state, action) => {
      state.services = state.services.filter(service => service.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Services
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isLoading = false
        state.services = action.payload
        state.error = null
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Create Service
      .addCase(createService.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.isLoading = false
        state.services.push(action.payload)
        state.error = null
      })
      .addCase(createService.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Update Service
      .addCase(updateService.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.services.findIndex(service => service.id === action.payload.id)
        if (index !== -1) {
          state.services[index] = action.payload
        }
        state.error = null
      })
      .addCase(updateService.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Delete Service
      .addCase(deleteService.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.isLoading = false
        state.services = state.services.filter(service => service.id !== action.payload)
        state.error = null
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { 
  setSelectedService, 
  clearSelectedService, 
  setFilters, 
  clearFilters, 
  clearError,
  serviceAdded,
  serviceUpdated,
  serviceDeleted
} = servicesSlice.actions

// Selectors
export const selectServices = (state) => state.services.services
export const selectSelectedService = (state) => state.services.selectedService
export const selectServicesLoading = (state) => state.services.isLoading
export const selectServicesError = (state) => state.services.error
export const selectServicesFilters = (state) => state.services.filters

export const selectServicesByStylist = (state, stylistId) => {
  return state.services.services.filter(service => service.stylist_id === stylistId)
}

export const selectServiceById = (state, serviceId) => {
  return state.services.services.find(service => service.id === serviceId)
}

export default servicesSlice.reducer 