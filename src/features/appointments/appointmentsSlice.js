import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase, supabaseHelpers } from '../../lib/supabase'
import { APPOINTMENT_STATUS, APPOINTMENT_COLOR_CLASSES } from '../../lib/constants'

// Helper function to get appointment color class
export const getAppointmentColorClass = (appointment) => {
  const status = appointment.status || APPOINTMENT_STATUS.SCHEDULED
  return APPOINTMENT_COLOR_CLASSES[status] || APPOINTMENT_COLOR_CLASSES.SCHEDULED
}

// Helper function to get appointment status color
export const getAppointmentStatusColor = (status) => {
  return APPOINTMENT_COLOR_CLASSES[status] || APPOINTMENT_COLOR_CLASSES.SCHEDULED
}

// Async thunks
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            full_name,
            phone,
            email
          ),
          services (
            id,
            name,
            price,
            duration
          )
        `)
        .order('appointment_date', { ascending: true })

      // Apply role-based filtering
      if (auth.mode === 'team') {
        query = query.eq('brand_id', auth.brandId)
      } else {
        query = query.eq('stylist_id', profile.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('fetchAppointments: Error fetching appointments:', error)
        console.error('fetchAppointments: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('fetchAppointments: Fetched appointments:', data)
      console.log('fetchAppointments: Number of appointments:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('fetchAppointments: First appointment:', data[0])
      }
      return data
    } catch (error) {
      console.error('fetchAppointments: Error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData, { getState, rejectWithValue }) => {
    try {
      console.log('createAppointment: Starting appointment creation...')
      const { auth } = getState()
      const profile = auth.profile

      const appointment = {
        ...appointmentData,
        stylist_id: profile.id,
        brand_id: auth.brandId,
        created_by: profile.id,
        status: APPOINTMENT_STATUS.SCHEDULED,
        // Convert appointment_date to date if it exists
        date: appointmentData.appointment_date ? new Date(appointmentData.appointment_date + 'T' + appointmentData.appointment_time).toISOString() : appointmentData.date
      }

      console.log('createAppointment: Appointment data:', appointment)

      // Add retry logic for appointment creation
      let appointmentError = null
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries && appointmentError === null) {
        try {
          console.log('createAppointment: Creating appointment, attempt:', retryCount + 1)
          const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
            .select(`
              *,
              clients (
                id,
                full_name,
                phone,
                email
              ),
              services (
                id,
                name,
                price,
                duration
              )
            `)
            .single()

          if (error) {
            appointmentError = error
            console.error('createAppointment: Appointment creation error:', error)
            
            // If it's an RLS error, wait a bit and retry
            if (error.message.includes('row-level security') || error.message.includes('violates row-level security')) {
              retryCount++
              if (retryCount >= maxRetries) {
                throw error
              }
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000))
              continue
            }
            throw error
          }

          console.log('createAppointment: Appointment created successfully:', data)
          return data
        } catch (error) {
          appointmentError = error
          console.error('createAppointment: Appointment creation catch error:', error)
          retryCount++
          if (retryCount >= maxRetries) {
            throw error
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (appointmentError) throw appointmentError
    } catch (error) {
      console.error('createAppointment: Final error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile

      console.log('updateAppointment: Updating appointment:', id, updates)

      // Check permissions
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('stylist_id, brand_id, created_by')
        .eq('id', id)
        .single()

      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }

      // Allow update if user is the stylist, creator, or brand owner
      const canUpdate = 
        existingAppointment.stylist_id === profile.id ||
        existingAppointment.created_by === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner')

      if (!canUpdate) {
        throw new Error('Permission denied')
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          clients (
            id,
            full_name,
            phone,
            email
          ),
          services (
            id,
            name,
            price,
            duration
          )
        `)
        .single()

      if (error) {
        console.error('updateAppointment: Error updating appointment:', error)
        throw error
      }

      console.log('updateAppointment: Successfully updated appointment:', data)
      return data
    } catch (error) {
      console.error('updateAppointment: Error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const deleteAppointment = createAsyncThunk(
  'appointments/deleteAppointment',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile

      console.log('deleteAppointment: Deleting appointment:', id)

      // Check permissions
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('stylist_id, created_by')
        .eq('id', id)
        .single()

      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }

      const canDelete = 
        existingAppointment.stylist_id === profile.id ||
        existingAppointment.created_by === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner')

      if (!canDelete) {
        throw new Error('Permission denied')
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('deleteAppointment: Error deleting appointment:', error)
        throw error
      }

      console.log('deleteAppointment: Successfully deleted appointment:', id)
      return id
    } catch (error) {
      console.error('deleteAppointment: Error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const parkAppointment = createAsyncThunk(
  'appointments/parkAppointment',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile

      console.log('parkAppointment: Parking appointment:', id)

      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          parked: true,
          status: APPOINTMENT_STATUS.PARKED 
        })
        .eq('id', id)
        .eq('stylist_id', profile.id)
        .select(`
          *,
          clients (
            id,
            full_name,
            phone,
            email
          ),
          services (
            id,
            name,
            price,
            duration
          )
        `)
        .single()

      if (error) {
        console.error('parkAppointment: Error parking appointment:', error)
        throw error
      }

      console.log('parkAppointment: Successfully parked appointment:', data)
      return data
    } catch (error) {
      console.error('parkAppointment: Error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const unparkAppointment = createAsyncThunk(
  'appointments/unparkAppointment',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile

      console.log('unparkAppointment: Unparking appointment:', id)

      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          parked: false,
          status: APPOINTMENT_STATUS.SCHEDULED 
        })
        .eq('id', id)
        .eq('stylist_id', profile.id)
        .select(`
          *,
          clients (
            id,
            full_name,
            phone,
            email
          ),
          services (
            id,
            name,
            price,
            duration
          )
        `)
        .single()

      if (error) {
        console.error('unparkAppointment: Error unparking appointment:', error)
        throw error
      }

      console.log('unparkAppointment: Successfully unparked appointment:', data)
      return data
    } catch (error) {
      console.error('unparkAppointment: Error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// Initial state
const initialState = {
  appointments: [],
  activeAppointments: [],
  parkedAppointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,
  filters: {
    status: null,
    date: null,
    stylist: null
  }
}

// Appointments slice
const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setSelectedAppointment: (state, action) => {
      state.selectedAppointment = action.payload
    },
    clearSelectedAppointment: (state) => {
      state.selectedAppointment = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        status: null,
        date: null,
        stylist: null
      }
    },
    clearError: (state) => {
      state.error = null
    },
    // Realtime updates
    appointmentAdded: (state, action) => {
      state.appointments.push(action.payload)
      if (!action.payload.parked) {
        state.activeAppointments.push(action.payload)
      } else {
        state.parkedAppointments.push(action.payload)
      }
    },
    appointmentUpdated: (state, action) => {
      const index = state.appointments.findIndex(apt => apt.id === action.payload.id)
      if (index !== -1) {
        state.appointments[index] = action.payload
        
        // Update active/parked lists
        const activeIndex = state.activeAppointments.findIndex(apt => apt.id === action.payload.id)
        const parkedIndex = state.parkedAppointments.findIndex(apt => apt.id === action.payload.id)
        
        if (action.payload.parked) {
          if (activeIndex !== -1) {
            state.activeAppointments.splice(activeIndex, 1)
          }
          if (parkedIndex === -1) {
            state.parkedAppointments.push(action.payload)
          } else {
            state.parkedAppointments[parkedIndex] = action.payload
          }
        } else {
          if (parkedIndex !== -1) {
            state.parkedAppointments.splice(parkedIndex, 1)
          }
          if (activeIndex === -1) {
            state.activeAppointments.push(action.payload)
          } else {
            state.activeAppointments[activeIndex] = action.payload
          }
        }
      }
    },
    appointmentDeleted: (state, action) => {
      state.appointments = state.appointments.filter(apt => apt.id !== action.payload)
      state.activeAppointments = state.activeAppointments.filter(apt => apt.id !== action.payload)
      state.parkedAppointments = state.parkedAppointments.filter(apt => apt.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false
        state.appointments = action.payload
        state.activeAppointments = action.payload.filter(apt => !apt.parked)
        state.parkedAppointments = action.payload.filter(apt => apt.parked)
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Create Appointment
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.appointments.push(action.payload)
        if (!action.payload.parked) {
          state.activeAppointments.push(action.payload)
        } else {
          state.parkedAppointments.push(action.payload)
        }
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update Appointment
      .addCase(updateAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
        }
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.error = action.payload
      })
      // Delete Appointment
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter(apt => apt.id !== action.payload)
        state.activeAppointments = state.activeAppointments.filter(apt => apt.id !== action.payload)
        state.parkedAppointments = state.parkedAppointments.filter(apt => apt.id !== action.payload)
      })
      .addCase(deleteAppointment.rejected, (state, action) => {
        state.error = action.payload
      })
      // Park/Unpark
      .addCase(parkAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
          
          // Move from active to parked
          const activeIndex = state.activeAppointments.findIndex(apt => apt.id === action.payload.id)
          if (activeIndex !== -1) {
            state.activeAppointments.splice(activeIndex, 1)
          }
          
          const parkedIndex = state.parkedAppointments.findIndex(apt => apt.id === action.payload.id)
          if (parkedIndex === -1) {
            state.parkedAppointments.push(action.payload)
          } else {
            state.parkedAppointments[parkedIndex] = action.payload
          }
        }
      })
      .addCase(parkAppointment.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(unparkAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
          
          // Move from parked to active
          const parkedIndex = state.parkedAppointments.findIndex(apt => apt.id === action.payload.id)
          if (parkedIndex !== -1) {
            state.parkedAppointments.splice(parkedIndex, 1)
          }
          
          const activeIndex = state.activeAppointments.findIndex(apt => apt.id === action.payload.id)
          if (activeIndex === -1) {
            state.activeAppointments.push(action.payload)
          } else {
            state.activeAppointments[activeIndex] = action.payload
          }
        }
      })
      .addCase(unparkAppointment.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const {
  setSelectedAppointment,
  clearSelectedAppointment,
  setFilters,
  clearFilters,
  clearError,
  appointmentAdded,
  appointmentUpdated,
  appointmentDeleted
} = appointmentsSlice.actions

// Selectors
export const selectAppointments = (state) => state.appointments.appointments
export const selectActiveAppointments = (state) => state.appointments.activeAppointments
export const selectParkedAppointments = (state) => state.appointments.parkedAppointments
export const selectSelectedAppointment = (state) => state.appointments.selectedAppointment
export const selectIsLoading = (state) => state.appointments.isLoading
export const selectError = (state) => state.appointments.error
export const selectFilters = (state) => state.appointments.filters

// Color-based selectors
export const selectAppointmentsByStatus = (state, status) => {
  return state.appointments.appointments.filter(apt => apt.status === status)
}

export const selectAppointmentsByDate = (state, date) => {
  return state.appointments.appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date).toDateString()
    const filterDate = new Date(date).toDateString()
    return aptDate === filterDate
  })
}

export const selectAppointmentColorClass = (state, appointmentId) => {
  const appointment = state.appointments.appointments.find(apt => apt.id === appointmentId)
  if (!appointment) return APPOINTMENT_COLOR_CLASSES.SCHEDULED
  return getAppointmentColorClass(appointment)
}

export const selectAppointmentsByColor = (state, colorClass) => {
  return state.appointments.appointments.filter(apt => {
    const aptColorClass = getAppointmentColorClass(apt)
    return aptColorClass.includes(colorClass)
  })
}

export default appointmentsSlice.reducer 