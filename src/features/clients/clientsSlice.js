import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase, supabaseHelpers } from '../../lib/supabase'

// Async thunks
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile
      
      // Check if user is authenticated
      if (!auth.isAuthenticated || !profile) {
        console.log('fetchClients: User not authenticated or no profile')
        return []
      }
      
      let query = supabase
        .from('clients')
        .select('*')
        .order('full_name', { ascending: true })

      // Apply role-based filtering
      if (auth.mode === 'team') {
        query = query.eq('brand_id', auth.brandId)
      } else {
        query = query.eq('stylist_id', profile.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('fetchClients: Database error:', error)
        throw error
      }

      console.log('fetchClients: Successfully fetched', data?.length || 0, 'clients')
      return data || []
    } catch (error) {
      console.error('fetchClients: Error fetching clients:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData, { getState, rejectWithValue }) => {
    try {
      console.log('createClient: Starting thunk...')
      console.log('createClient: Client data:', clientData)
      
      const { auth } = getState()
      const profile = auth.profile
      
      console.log('createClient: Auth state:', auth)
      console.log('createClient: Profile:', profile)

      const client = {
        ...clientData,
        stylist_id: profile.id,
        brand_id: auth.brandId
      }
      
      console.log('createClient: Final client object:', client)

      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single()

      console.log('createClient: Database response:', { data, error })

      if (error) {
        console.error('createClient: Database error:', error)
        throw error
      }

      console.log('createClient: Successfully created client:', data)
      return data
    } catch (error) {
      console.error('createClient: Error creating client:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const profile = auth.profile

      // Check permissions
      const { data: existingClient } = await supabase
        .from('clients')
        .select('stylist_id')
        .eq('id', id)
        .single()

      if (!existingClient) {
        throw new Error('Client not found')
      }

      // Allow update if user is the stylist or brand owner
      const canUpdate = 
        existingClient.stylist_id === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner')

      if (!canUpdate) {
        throw new Error('Permission denied')
      }

      const { data, error } = await supabase
        .from('clients')
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

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth

      // Check permissions
      const { data: existingClient } = await supabase
        .from('clients')
        .select('stylist_id')
        .eq('id', id)
        .single()

      if (!existingClient) {
        throw new Error('Client not found')
      }

      const canDelete = 
        existingClient.stylist_id === profile.id ||
        (auth.mode === 'team' && auth.profile.role === 'owner')

      if (!canDelete) {
        throw new Error('Permission denied')
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error

      return id
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const searchClients = createAsyncThunk(
  'clients/searchClients',
  async (searchTerm, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const { profile } = auth
      
      let query = supabase
        .from('clients')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('full_name', { ascending: true })

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
  clients: [],
  selectedClient: null,
  searchResults: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  }
}

// Clients slice
const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setSelectedClient: (state, action) => {
      state.selectedClient = action.payload
    },
    clearSelectedClient: (state) => {
      state.selectedClient = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        sortBy: 'name',
        sortOrder: 'asc'
      }
    },
    clearError: (state) => {
      state.error = null
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },
    // Manual reset for debugging
    resetLoadingState: (state) => {
      console.log('clientsSlice: Manually resetting loading state')
      state.isLoading = false
      state.error = null
    },
    // Realtime updates
    clientAdded: (state, action) => {
      state.clients.push(action.payload)
    },
    clientUpdated: (state, action) => {
      const index = state.clients.findIndex(client => client.id === action.payload.id)
      if (index !== -1) {
        state.clients[index] = action.payload
      }
      // Update selected client if it's the same
      if (state.selectedClient && state.selectedClient.id === action.payload.id) {
        state.selectedClient = action.payload
      }
    },
    clientDeleted: (state, action) => {
      state.clients = state.clients.filter(client => client.id !== action.payload)
      if (state.selectedClient && state.selectedClient.id === action.payload) {
        state.selectedClient = null
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Clients
      .addCase(fetchClients.pending, (state) => {
        console.log('clientsSlice: Setting loading to true')
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        console.log('clientsSlice: Setting loading to false, loaded', action.payload?.length || 0, 'clients')
        state.isLoading = false
        state.clients = action.payload
      })
      .addCase(fetchClients.rejected, (state, action) => {
        console.log('clientsSlice: Setting loading to false due to error:', action.payload)
        state.isLoading = false
        state.error = action.payload
      })
      // Create Client
      .addCase(createClient.pending, (state) => {
        console.log('clientsSlice: Creating client, setting loading to true')
        state.isLoading = true
        state.error = null
      })
      .addCase(createClient.fulfilled, (state, action) => {
        console.log('clientsSlice: Client created, setting loading to false')
        state.isLoading = false
        state.clients.push(action.payload)
      })
      .addCase(createClient.rejected, (state, action) => {
        console.log('clientsSlice: Client creation failed, setting loading to false:', action.payload)
        state.isLoading = false
        state.error = action.payload
      })
      // Update Client
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.clients.findIndex(client => client.id === action.payload.id)
        if (index !== -1) {
          state.clients[index] = action.payload
        }
        if (state.selectedClient && state.selectedClient.id === action.payload.id) {
          state.selectedClient = action.payload
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.error = action.payload
      })
      // Delete Client
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter(client => client.id !== action.payload)
        if (state.selectedClient && state.selectedClient.id === action.payload) {
          state.selectedClient = null
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.error = action.payload
      })
      // Search Clients
      .addCase(searchClients.pending, (state) => {
        state.isLoading = true
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.isLoading = false
        state.searchResults = action.payload
      })
      .addCase(searchClients.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const {
  setSelectedClient,
  clearSelectedClient,
  setFilters,
  clearFilters,
  clearError,
  clearSearchResults,
  resetLoadingState,
  clientAdded,
  clientUpdated,
  clientDeleted
} = clientsSlice.actions

// Selectors
export const selectClients = (state) => state.clients.clients
export const selectSelectedClient = (state) => state.clients.selectedClient
export const selectSearchResults = (state) => state.clients.searchResults
export const selectIsLoading = (state) => state.clients.isLoading
export const selectError = (state) => state.clients.error
export const selectFilters = (state) => state.clients.filters

// Filtered selectors
export const selectClientsByStylist = (state, stylistId) => {
  return state.clients.clients.filter(client => client.stylist_id === stylistId)
}

export const selectClientById = (state, clientId) => {
  return state.clients.clients.find(client => client.id === clientId)
}

export default clientsSlice.reducer 