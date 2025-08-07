import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase, supabaseHelpers } from '../../lib/supabase'

// Async thunks
export const fetchWaitlist = createAsyncThunk(
  'waitlist/fetchWaitlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth
      
      let query = supabase
        .from('waitlist')
        .select(`
          *,
          clients (
            id,
            full_name,
            phone
          ),
          services (
            id,
            name,
            price
          )
        `)
        .order('created_at', { ascending: true })

      // Apply role-based filtering
      if (auth.mode === 'team') {
        query = query.eq('brand_id', auth.brandId)
      } else {
        query = query.eq('stylist_id', profile.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('fetchWaitlist: Error fetching waitlist:', error)
        console.error('fetchWaitlist: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // Transform data to include client and service names
      const transformedData = data.map(item => ({
        ...item,
        client_name: item.clients?.full_name || 'Unknown Client',
        service_name: item.services?.name || 'Unknown Service',
        service_price: item.services?.price || 0
      }))

      console.log('fetchWaitlist: Fetched waitlist items:', transformedData)
      return transformedData
    } catch (error) {
      console.error('fetchWaitlist: Error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const addToWaitlist = createAsyncThunk(
  'waitlist/addToWaitlist',
  async (waitlistData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      const waitlistItem = {
        ...waitlistData,
        stylist_id: profile.id,
        brand_id: auth.brandId,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('waitlist')
        .insert(waitlistItem)
        .select(`
          *,
          clients (
            id,
            full_name,
            phone
          ),
          services (
            id,
            name,
            price
          )
        `)
        .single()

      if (error) {
        console.error('addToWaitlist: Error adding to waitlist:', error)
        throw error
      }

      // Transform the response
      return {
        ...data,
        client_name: data.clients?.full_name || 'Unknown Client',
        service_name: data.services?.name || 'Unknown Service',
        service_price: data.services?.price || 0
      }
    } catch (error) {
      console.error('addToWaitlist: Error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const removeFromWaitlist = createAsyncThunk(
  'waitlist/removeFromWaitlist',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      // Check permissions
      const { data: existingItem } = await supabase
        .from('waitlist')
        .select('stylist_id, brand_id')
        .eq('id', id)
        .single()

      if (!existingItem) {
        throw new Error('Waitlist item not found')
      }

      const canRemove = 
        existingItem.stylist_id === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner' && existingItem.brand_id === auth.brandId)

      if (!canRemove) {
        throw new Error('Permission denied')
      }

      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id)

      if (error) throw error

      return id
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const promoteToAppointment = createAsyncThunk(
  'waitlist/promoteToAppointment',
  async (waitlistItem, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      // Create appointment from waitlist item
      const appointmentData = {
        client_id: waitlistItem.client_id,
        service_id: waitlistItem.service_id,
        stylist_id: profile.id,
        brand_id: auth.brandId,
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: 'scheduled',
        notes: `Promoted from waitlist - ${waitlistItem.notes || ''}`,
        price: waitlistItem.service_price || 0
      }

      // Insert appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single()

      if (appointmentError) throw appointmentError

      // Remove from waitlist
      const { error: waitlistError } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', waitlistItem.id)

      if (waitlistError) throw waitlistError

      // Dispatch to update appointments state
      dispatch({ type: 'appointments/appointmentAdded', payload: appointment })

      return { appointment, waitlistId: waitlistItem.id }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Initial state
const initialState = {
  waitlist: [],
  isLoading: false,
  error: null
}

// Waitlist slice
const waitlistSlice = createSlice({
  name: 'waitlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // Realtime updates
    waitlistItemAdded: (state, action) => {
      const transformedItem = {
        ...action.payload,
        client_name: action.payload.clients?.full_name || 'Unknown Client',
        service_name: action.payload.services?.name || 'Unknown Service',
        service_price: action.payload.services?.price || 0
      }
      state.waitlist.push(transformedItem)
    },
    waitlistItemUpdated: (state, action) => {
      const index = state.waitlist.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        const transformedItem = {
          ...action.payload,
          client_name: action.payload.clients?.full_name || 'Unknown Client',
          service_name: action.payload.services?.name || 'Unknown Service',
          service_price: action.payload.services?.price || 0
        }
        state.waitlist[index] = transformedItem
      }
    },
    waitlistItemRemoved: (state, action) => {
      state.waitlist = state.waitlist.filter(item => item.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Waitlist
      .addCase(fetchWaitlist.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWaitlist.fulfilled, (state, action) => {
        state.isLoading = false
        state.waitlist = action.payload
      })
      .addCase(fetchWaitlist.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Add to Waitlist
      .addCase(addToWaitlist.fulfilled, (state, action) => {
        state.waitlist.push(action.payload)
      })
      .addCase(addToWaitlist.rejected, (state, action) => {
        state.error = action.payload
      })
      // Remove from Waitlist
      .addCase(removeFromWaitlist.fulfilled, (state, action) => {
        state.waitlist = state.waitlist.filter(item => item.id !== action.payload)
      })
      .addCase(removeFromWaitlist.rejected, (state, action) => {
        state.error = action.payload
      })
      // Promote to Appointment
      .addCase(promoteToAppointment.fulfilled, (state, action) => {
        state.waitlist = state.waitlist.filter(item => item.id !== action.payload.waitlistId)
      })
      .addCase(promoteToAppointment.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const {
  clearError,
  waitlistItemAdded,
  waitlistItemUpdated,
  waitlistItemRemoved
} = waitlistSlice.actions

// Selectors
export const selectWaitlist = (state) => state.waitlist.waitlist
export const selectIsLoading = (state) => state.waitlist.isLoading
export const selectError = (state) => state.waitlist.error

// Filtered selectors
export const selectWaitlistByStylist = (state, stylistId) => {
  return state.waitlist.waitlist.filter(item => item.stylist_id === stylistId)
}

export const selectWaitlistByService = (state, serviceId) => {
  return state.waitlist.waitlist.filter(item => item.service_id === serviceId)
}

export const selectWaitlistCount = (state) => state.waitlist.waitlist.length

export default waitlistSlice.reducer 