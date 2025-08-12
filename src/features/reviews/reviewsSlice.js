import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'

export const fetchReviewsByAppointment = createAsyncThunk(
  'reviews/fetchByAppointment',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('appointment_reviews')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return { appointmentId, reviews: data || [] }
    } catch (e) {
      return rejectWithValue(e.message)
    }
  }
)

export const createReview = createAsyncThunk(
  'reviews/create',
  async ({ appointmentId, rating, comment, clientId, stylistId }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('appointment_reviews')
        .insert({ appointment_id: appointmentId, rating, comment, client_id: clientId, stylist_id: stylistId })
        .select()
        .single()
      if (error) throw error
      return data
    } catch (e) {
      return rejectWithValue(e.message)
    }
  }
)

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    byAppointment: {},
    isLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewsByAppointment.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchReviewsByAppointment.fulfilled, (state, action) => {
        state.isLoading = false
        state.byAppointment[action.payload.appointmentId] = action.payload.reviews
      })
      .addCase(fetchReviewsByAppointment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(createReview.fulfilled, (state, action) => {
        const aptId = action.payload.appointment_id
        if (!state.byAppointment[aptId]) state.byAppointment[aptId] = []
        state.byAppointment[aptId].unshift(action.payload)
      })
      .addCase(createReview.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const selectReviewsForAppointment = (state, appointmentId) => state.reviews.byAppointment[appointmentId] || []
export default reviewsSlice.reducer