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
      
      console.log('fetchAppointments: Starting fetch with auth:', { mode: auth.mode, brandId: auth.brandId, profileId: profile?.id })
      
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
        .order('date', { ascending: true })

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
      return data || []
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

      // Validate required fields
      if (!appointmentData.client_id) {
        throw new Error('Client is required')
      }
      if (!appointmentData.service_id) {
        throw new Error('Service is required')
      }
      if (!appointmentData.date) {
        throw new Error('Date is required')
      }

      const appointment = {
        ...appointmentData,
        stylist_id: profile.id,
        brand_id: auth.brandId,
        created_by: profile.id,
        status: APPOINTMENT_STATUS.SCHEDULED,
        parked: false,
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

      // Check permissions first
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('stylist_id, created_by')
        .eq('id', id)
        .single()

      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }

      const canPark = 
        existingAppointment.stylist_id === profile.id ||
        existingAppointment.created_by === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner')

      if (!canPark) {
        throw new Error('Permission denied')
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          parked: true,
          status: APPOINTMENT_STATUS.PARKED,
          service_id: null,
          date: null,
          duration: null
        })
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

      // Check permissions first
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('stylist_id, created_by')
        .eq('id', id)
        .single()

      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }

      const canUnpark = 
        existingAppointment.stylist_id === profile.id ||
        existingAppointment.created_by === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner')

      if (!canUnpark) {
        throw new Error('Permission denied')
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          parked: false,
          status: APPOINTMENT_STATUS.SCHEDULED 
        })
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

export const unparkAppointmentWithDetails = createAsyncThunk(
  'appointments/unparkAppointmentWithDetails',
  async ({ id, serviceId, date, duration }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile

      console.log('unparkAppointmentWithDetails: Unparking appointment with details:', { id, serviceId, date, duration })

      // Check permissions first
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('stylist_id, created_by')
        .eq('id', id)
        .single()

      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }

      const canUnpark = 
        existingAppointment.stylist_id === profile.id ||
        existingAppointment.created_by === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner')

      if (!canUnpark) {
        throw new Error('Permission denied')
      }

      // Validate required fields
      if (!serviceId || !date || !duration) {
        throw new Error('Service, date, and duration are required to unpark appointment')
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          parked: false,
          status: APPOINTMENT_STATUS.SCHEDULED,
          service_id: serviceId,
          date: date,
          duration: duration
        })
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
        console.error('unparkAppointmentWithDetails: Error unparking appointment:', error)
        throw error
      }

      console.log('unparkAppointmentWithDetails: Successfully unparked appointment:', data)
      return data
    } catch (error) {
      console.error('unparkAppointmentWithDetails: Error:', error)
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
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    resetLoadingState: (state) => {
      state.isLoading = false
      state.error = null
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload }
    },
    // Optimistic updates for instant UI feedback
    optimisticCreateAppointment: (state, action) => {
      const appointment = action.payload
      // Add to appointments array
      state.appointments.push(appointment)
      // Add to appropriate list based on parked status
      if (!appointment.parked) {
        state.activeAppointments.push(appointment)
      } else {
        state.parkedAppointments.push(appointment)
      }
    },
    optimisticUpdateAppointment: (state, action) => {
      const { id, updates } = action.payload
      console.log('optimisticUpdateAppointment called with:', { id, updates })
      
      const index = state.appointments.findIndex(apt => apt.id === id)
      console.log('Found appointment at index:', index)
      
      if (index !== -1) {
        const originalAppointment = state.appointments[index]
        console.log('Original appointment:', originalAppointment)
        
        const updatedAppointment = { ...state.appointments[index], ...updates }
        state.appointments[index] = updatedAppointment
        console.log('Updated appointment:', updatedAppointment)
        
        // Update in active/parked lists
        const activeIndex = state.activeAppointments.findIndex(apt => apt.id === id)
        const parkedIndex = state.parkedAppointments.findIndex(apt => apt.id === id)
        
        console.log('Active index:', activeIndex, 'Parked index:', parkedIndex)
        console.log('Updated appointment parked status:', updatedAppointment.parked)
        
        if (updatedAppointment.parked) {
          // Move to parked list
          console.log('Moving to parked list')
          if (activeIndex !== -1) {
            state.activeAppointments.splice(activeIndex, 1)
            console.log('Removed from active list')
          }
          if (parkedIndex === -1) {
            state.parkedAppointments.push(updatedAppointment)
            console.log('Added to parked list')
          } else {
            state.parkedAppointments[parkedIndex] = updatedAppointment
            console.log('Updated in parked list')
          }
        } else {
          // Move to active list
          console.log('Moving to active list')
          if (parkedIndex !== -1) {
            state.parkedAppointments.splice(parkedIndex, 1)
            console.log('Removed from parked list')
          }
          if (activeIndex === -1) {
            state.activeAppointments.push(updatedAppointment)
            console.log('Added to active list')
          } else {
            state.activeAppointments[activeIndex] = updatedAppointment
            console.log('Updated in active list')
          }
        }
        
        console.log('Final state counts - appointments:', state.appointments.length, 'active:', state.activeAppointments.length, 'parked:', state.parkedAppointments.length)
      } else {
        console.log('Appointment not found in state')
      }
    },
    optimisticDeleteAppointment: (state, action) => {
      const appointmentId = action.payload
      
      // Remove from all arrays
      state.appointments = state.appointments.filter(apt => apt.id !== appointmentId)
      state.activeAppointments = state.activeAppointments.filter(apt => apt.id !== appointmentId)
      state.parkedAppointments = state.parkedAppointments.filter(apt => apt.id !== appointmentId)
      
      // Clear selected appointment if it was deleted
      if (state.selectedAppointment && state.selectedAppointment.id === appointmentId) {
        state.selectedAppointment = null
      }
    },
    // Cleanup temporary appointments
    cleanupTemporaryAppointments: (state) => {
      state.appointments = state.appointments.filter(apt => !apt.id || !apt.id.startsWith('temp_'))
      state.activeAppointments = state.activeAppointments.filter(apt => !apt.id || !apt.id.startsWith('temp_'))
      state.parkedAppointments = state.parkedAppointments.filter(apt => !apt.id || !apt.id.startsWith('temp_'))
    },
    // Realtime updates with conflict resolution
    appointmentAdded: (state, action) => {
      console.log('appointmentsSlice: appointmentAdded called with:', action.payload)
      const appointment = action.payload
      
      console.log('appointmentsSlice: Before adding - appointments count:', state.appointments.length)
      console.log('appointmentsSlice: Before adding - active appointments count:', state.activeAppointments.length)
      console.log('appointmentsSlice: Before adding - parked appointments count:', state.parkedAppointments.length)
      
      // Check if appointment already exists (including temporary appointments)
      const existingIndex = state.appointments.findIndex(apt => apt.id === appointment.id)
      const tempIndex = state.appointments.findIndex(apt => 
        apt.id && apt.id.startsWith('temp_') && 
        apt.date === appointment.date && 
        apt.client_id === appointment.client_id &&
        apt.service_id === appointment.service_id
      )
      
      if (existingIndex === -1 && tempIndex === -1) {
        // New appointment
        state.appointments.push(appointment)
        if (!appointment.parked) {
          state.activeAppointments.push(appointment)
        } else {
          state.parkedAppointments.push(appointment)
        }
        console.log('appointmentsSlice: Appointment added to state')
      } else if (tempIndex !== -1) {
        // Replace temporary appointment with real one
        console.log('appointmentsSlice: Replacing temporary appointment with real one')
        state.appointments[tempIndex] = appointment
        
        // Update in active/parked lists
        const activeIndex = state.activeAppointments.findIndex(apt => apt.id === state.appointments[tempIndex].id)
        const parkedIndex = state.parkedAppointments.findIndex(apt => apt.id === state.appointments[tempIndex].id)
        
        if (appointment.parked) {
          // Move to parked list
          if (activeIndex !== -1) {
            state.activeAppointments[activeIndex] = appointment
          } else if (parkedIndex === -1) {
            state.parkedAppointments.push(appointment)
          } else {
            state.parkedAppointments[parkedIndex] = appointment
          }
        } else {
          // Move to active list
          if (parkedIndex !== -1) {
            state.parkedAppointments[parkedIndex] = appointment
          } else if (activeIndex === -1) {
            state.activeAppointments.push(appointment)
          } else {
            state.activeAppointments[activeIndex] = appointment
          }
        }
      } else {
        // Update existing appointment with realtime data
        console.log('appointmentsSlice: Appointment already exists, updating instead')
        state.appointments[existingIndex] = appointment
        
        // Update in active/parked lists
        const activeIndex = state.activeAppointments.findIndex(apt => apt.id === appointment.id)
        const parkedIndex = state.parkedAppointments.findIndex(apt => apt.id === appointment.id)
        
        if (appointment.parked) {
          // Move to parked list
          if (activeIndex !== -1) {
            state.activeAppointments.splice(activeIndex, 1)
          }
          if (parkedIndex === -1) {
            state.parkedAppointments.push(appointment)
          } else {
            state.parkedAppointments[parkedIndex] = appointment
          }
        } else {
          // Move to active list
          if (parkedIndex !== -1) {
            state.parkedAppointments.splice(parkedIndex, 1)
          }
          if (activeIndex === -1) {
            state.activeAppointments.push(appointment)
          } else {
            state.activeAppointments[activeIndex] = appointment
          }
        }
      }
      
      console.log('appointmentsSlice: After adding - appointments count:', state.appointments.length)
      console.log('appointmentsSlice: After adding - active appointments count:', state.activeAppointments.length)
      console.log('appointmentsSlice: After adding - parked appointments count:', state.parkedAppointments.length)
    },
    appointmentUpdated: (state, action) => {
      console.log('appointmentsSlice: appointmentUpdated called with:', action.payload)
      const appointment = action.payload
      
      console.log('appointmentsSlice: Before updating - appointments count:', state.appointments.length)
      console.log('appointmentsSlice: Before updating - active appointments count:', state.activeAppointments.length)
      console.log('appointmentsSlice: Before updating - parked appointments count:', state.parkedAppointments.length)
      
      const index = state.appointments.findIndex(apt => apt.id === appointment.id)
      
      if (index !== -1) {
        state.appointments[index] = appointment
        
        // Update active/parked lists
        const activeIndex = state.activeAppointments.findIndex(apt => apt.id === appointment.id)
        const parkedIndex = state.parkedAppointments.findIndex(apt => apt.id === appointment.id)
        
        if (appointment.parked) {
          // Move to parked list
          if (activeIndex !== -1) {
            state.activeAppointments.splice(activeIndex, 1)
          }
          if (parkedIndex === -1) {
            state.parkedAppointments.push(appointment)
          } else {
            state.parkedAppointments[parkedIndex] = appointment
          }
        } else {
          // Move to active list
          if (parkedIndex !== -1) {
            state.parkedAppointments.splice(parkedIndex, 1)
          }
          if (activeIndex === -1) {
            state.activeAppointments.push(appointment)
          } else {
            state.activeAppointments[activeIndex] = appointment
          }
        }
        console.log('appointmentsSlice: Appointment updated in state')
      } else {
        console.log('appointmentsSlice: Appointment not found, adding instead')
        state.appointments.push(appointment)
        if (!appointment.parked) {
          state.activeAppointments.push(appointment)
        } else {
          state.parkedAppointments.push(appointment)
        }
      }
      
      console.log('appointmentsSlice: After updating - appointments count:', state.appointments.length)
      console.log('appointmentsSlice: After updating - active appointments count:', state.activeAppointments.length)
      console.log('appointmentsSlice: After updating - parked appointments count:', state.parkedAppointments.length)
    },
    appointmentDeleted: (state, action) => {
      console.log('appointmentsSlice: appointmentDeleted called with ID:', action.payload)
      const appointmentId = action.payload
      
      console.log('appointmentsSlice: Before deletion - appointments count:', state.appointments.length)
      console.log('appointmentsSlice: Before deletion - active appointments count:', state.activeAppointments.length)
      console.log('appointmentsSlice: Before deletion - parked appointments count:', state.parkedAppointments.length)
      
      // Remove from all arrays
      const originalAppointmentsLength = state.appointments.length
      const originalActiveLength = state.activeAppointments.length
      const originalParkedLength = state.parkedAppointments.length
      
      state.appointments = state.appointments.filter(apt => apt.id !== appointmentId)
      state.activeAppointments = state.activeAppointments.filter(apt => apt.id !== appointmentId)
      state.parkedAppointments = state.parkedAppointments.filter(apt => apt.id !== appointmentId)
      
      // Clear selected appointment if it was deleted
      if (state.selectedAppointment && state.selectedAppointment.id === appointmentId) {
        state.selectedAppointment = null
      }
      
      console.log('appointmentsSlice: After deletion - appointments count:', state.appointments.length, '(removed:', originalAppointmentsLength - state.appointments.length, ')')
      console.log('appointmentsSlice: After deletion - active appointments count:', state.activeAppointments.length, '(removed:', originalActiveLength - state.activeAppointments.length, ')')
      console.log('appointmentsSlice: After deletion - parked appointments count:', state.parkedAppointments.length, '(removed:', originalParkedLength - state.parkedAppointments.length, ')')
      console.log('appointmentsSlice: Appointment removed from state successfully')
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
        console.log('appointmentsSlice: fetchAppointments.fulfilled - loaded', action.payload.length, 'appointments')
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        console.error('appointmentsSlice: fetchAppointments.rejected -', action.payload)
      })
      // Create Appointment - Use optimistic updates for instant UI feedback
      .addCase(createAppointment.pending, (state, action) => {
        state.isLoading = true
        state.error = null
        // Don't add optimistic update here - let the component handle it
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false
        console.log('appointmentsSlice: createAppointment.fulfilled - appointment created, realtime will handle UI update:', action.payload)
        // Realtime will handle the UI update, so we don't manually update state here
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        console.error('appointmentsSlice: createAppointment.rejected -', action.payload)
        
        // Remove any temporary appointments that failed to create
        state.appointments = state.appointments.filter(apt => !apt.id || !apt.id.startsWith('temp_'))
        state.activeAppointments = state.activeAppointments.filter(apt => !apt.id || !apt.id.startsWith('temp_'))
        state.parkedAppointments = state.parkedAppointments.filter(apt => !apt.id || !apt.id.startsWith('temp_'))
      })
      // Update Appointment - Use optimistic updates for instant UI feedback
      .addCase(updateAppointment.pending, (state, action) => {
        state.isLoading = true
        state.error = null
        // Don't add optimistic update here - let the component handle it
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.isLoading = false
        console.log('appointmentsSlice: updateAppointment.fulfilled - appointment updated, realtime will handle UI update:', action.payload)
        // Realtime will handle the UI update, so we don't manually update state here
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        console.error('appointmentsSlice: updateAppointment.rejected -', action.payload)
      })
      // Delete Appointment - Use optimistic updates for instant UI feedback
      .addCase(deleteAppointment.pending, (state, action) => {
        state.isLoading = true
        state.error = null
        // Don't add optimistic update here - let the component handle it
      })
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.isLoading = false
        console.log('appointmentsSlice: deleteAppointment.fulfilled - appointment deleted, realtime will handle UI update:', action.payload)
        // Realtime will handle the UI update, so we don't manually update state here
      })
      .addCase(deleteAppointment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        console.error('appointmentsSlice: deleteAppointment.rejected -', action.payload)
      })
      // Park/Unpark - Use optimistic updates for instant UI feedback
      .addCase(parkAppointment.pending, (state, action) => {
        state.isLoading = true
        state.error = null
        // Don't add optimistic update here - let the component handle it
      })
      .addCase(parkAppointment.fulfilled, (state, action) => {
        state.isLoading = false
        console.log('appointmentsSlice: parkAppointment.fulfilled - appointment parked, realtime will handle UI update:', action.payload)
        // Realtime will handle the UI update, so we don't manually update state here
      })
      .addCase(parkAppointment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        console.error('appointmentsSlice: parkAppointment.rejected -', action.payload)
      })
      .addCase(unparkAppointment.pending, (state, action) => {
        state.isLoading = true
        state.error = null
        // Don't add optimistic update here - let the component handle it
      })
      .addCase(unparkAppointment.fulfilled, (state, action) => {
        state.isLoading = false
        console.log('appointmentsSlice: unparkAppointment.fulfilled - appointment unparked, realtime will handle UI update:', action.payload)
        // Realtime will handle the UI update, so we don't manually update state here
      })
      .addCase(unparkAppointment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        console.error('appointmentsSlice: unparkAppointment.rejected -', action.payload)
      })
      .addCase(unparkAppointmentWithDetails.pending, (state, action) => {
        state.isLoading = true
        state.error = null
        // Don't add optimistic update here - let the component handle it
      })
      .addCase(unparkAppointmentWithDetails.fulfilled, (state, action) => {
        state.isLoading = false
        console.log('appointmentsSlice: unparkAppointmentWithDetails.fulfilled - appointment unparked with details, realtime will handle UI update:', action.payload)
        // Realtime will handle the UI update, so we don't manually update state here
      })
      .addCase(unparkAppointmentWithDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        console.error('appointmentsSlice: unparkAppointmentWithDetails.rejected -', action.payload)
      })
  }
})

export const {
  setSelectedAppointment,
  clearSelectedAppointment,
  setFilters,
  clearFilters,
  clearError,
  setLoading,
  resetLoadingState,
  updateProfile,
  optimisticCreateAppointment,
  optimisticUpdateAppointment,
  optimisticDeleteAppointment,
  cleanupTemporaryAppointments,
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