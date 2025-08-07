import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createSelector } from '@reduxjs/toolkit'
import { supabase, supabaseHelpers } from '../../lib/supabase'
import { BRANDING_SECTIONS } from '../../lib/constants'

// Async thunks
export const fetchBranding = createAsyncThunk(
  'branding/fetchBranding',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth
      
      let query = supabase
        .from('branding_content')
        .select('*')
        .order('section', { ascending: true })

      // Apply role-based filtering
      if (auth.mode === 'team') {
        query = query.eq('brand_id', auth.brandId)
      } else {
        query = query.eq('user_id', profile.id)
      }

      const { data, error } = await query

      if (error) throw error

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createBranding = createAsyncThunk(
  'branding/createBranding',
  async (brandingData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      const branding = {
        ...brandingData,
        user_id: profile.id,
        brand_id: auth.brandId
      }

      const { data, error } = await supabase
        .from('branding_content')
        .insert(branding)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateBranding = createAsyncThunk(
  'branding/updateBranding',
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      // Check permissions
      const { data: existingBranding } = await supabase
        .from('branding_content')
        .select('user_id, brand_id')
        .eq('id', id)
        .single()

      if (!existingBranding) {
        throw new Error('Branding content not found')
      }

      // Allow update if user is the owner or brand owner
      const canUpdate = 
        existingBranding.user_id === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner' && existingBranding.brand_id === auth.brandId)

      if (!canUpdate) {
        throw new Error('Permission denied')
      }

      const { data, error } = await supabase
        .from('branding_content')
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

export const deleteBranding = createAsyncThunk(
  'branding/deleteBranding',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      // Check permissions
      const { data: existingBranding } = await supabase
        .from('branding_content')
        .select('user_id, brand_id')
        .eq('id', id)
        .single()

      if (!existingBranding) {
        throw new Error('Branding content not found')
      }

      const canDelete = 
        existingBranding.user_id === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner' && existingBranding.brand_id === auth.brandId)

      if (!canDelete) {
        throw new Error('Permission denied')
      }

      const { error } = await supabase
        .from('branding_content')
        .delete()
        .eq('id', id)

      if (error) throw error

      return id
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchBrandInfo = createAsyncThunk(
  'branding/fetchBrandInfo',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      
      if (auth.mode !== 'team') {
        return null
      }

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', auth.brandId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Initial state
const initialState = {
  brandingContent: [],
  brandInfo: null,
  selectedSection: null,
  isLoading: false,
  error: null
}

// Branding slice
const brandingSlice = createSlice({
  name: 'branding',
  initialState,
  reducers: {
    setSelectedSection: (state, action) => {
      state.selectedSection = action.payload
    },
    clearSelectedSection: (state) => {
      state.selectedSection = null
    },
    clearError: (state) => {
      state.error = null
    },
    // Realtime updates
    brandingAdded: (state, action) => {
      state.brandingContent.push(action.payload)
    },
    brandingUpdated: (state, action) => {
      const index = state.brandingContent.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.brandingContent[index] = action.payload
      }
    },
    brandingDeleted: (state, action) => {
      state.brandingContent = state.brandingContent.filter(item => item.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Branding
      .addCase(fetchBranding.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBranding.fulfilled, (state, action) => {
        state.isLoading = false
        state.brandingContent = action.payload
      })
      .addCase(fetchBranding.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Create Branding
      .addCase(createBranding.fulfilled, (state, action) => {
        state.brandingContent.push(action.payload)
      })
      .addCase(createBranding.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update Branding
      .addCase(updateBranding.fulfilled, (state, action) => {
        const index = state.brandingContent.findIndex(item => item.id === action.payload.id)
        if (index !== -1) {
          state.brandingContent[index] = action.payload
        }
      })
      .addCase(updateBranding.rejected, (state, action) => {
        state.error = action.payload
      })
      // Delete Branding
      .addCase(deleteBranding.fulfilled, (state, action) => {
        state.brandingContent = state.brandingContent.filter(item => item.id !== action.payload)
      })
      .addCase(deleteBranding.rejected, (state, action) => {
        state.error = action.payload
      })
      // Fetch Brand Info
      .addCase(fetchBrandInfo.fulfilled, (state, action) => {
        state.brandInfo = action.payload
      })
      .addCase(fetchBrandInfo.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const {
  setSelectedSection,
  clearSelectedSection,
  clearError,
  brandingAdded,
  brandingUpdated,
  brandingDeleted
} = brandingSlice.actions

// Selectors
export const selectBrandingContent = (state) => state.branding.brandingContent
export const selectBrandInfo = (state) => state.branding.brandInfo
export const selectSelectedSection = (state) => state.branding.selectedSection
export const selectIsLoading = (state) => state.branding.isLoading
export const selectError = (state) => state.branding.error

// Main branding selector for dashboard
export const selectBranding = createSelector(
  [selectBrandInfo, selectBrandingContent],
  (brandInfo, brandingContent) => {
    // Return the first branding content item or brand info
    const firstBranding = brandingContent[0]
    
    return {
      brand_name: brandInfo?.name || firstBranding?.brand_name || 'SalonX',
      logo_url: brandInfo?.logo_url || firstBranding?.logo_url || null,
      tagline: firstBranding?.tagline || 'Professional Salon Management',
      brand_id: brandInfo?.id || firstBranding?.brand_id,
      user_id: firstBranding?.user_id
    }
  }
)

// Filtered selectors
export const selectBrandingBySection = (state, section) => {
  return state.branding.brandingContent.find(item => item.section === section)
}

export const selectDashboardBranding = (state) => {
  return state.branding.brandingContent.filter(item => 
    item.section === BRANDING_SECTIONS.DASHBOARD_TOP
  )
}

export const selectCheckoutBranding = (state) => {
  return state.branding.brandingContent.filter(item => 
    item.section === BRANDING_SECTIONS.CHECKOUT_AREA
  )
}

export default brandingSlice.reducer 