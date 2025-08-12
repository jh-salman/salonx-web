import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase, supabaseHelpers } from '../../lib/supabase'
import { APP_MODES, USER_ROLES } from '../../lib/constants'
import { performSignout, clearAllAuthData } from '../../lib/authHelpers'

// Async thunks
export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, fullName, phone, role, brandName, mode }, { rejectWithValue }) => {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      })

      if (authError) throw authError

      const user = authData.user

      // If email confirmation is required, there may be no active session
      // In that case, we cannot create profile/brand due to RLS. Prompt user to confirm email first.
      if (!authData.session) {
        return {
          awaitingConfirmation: true,
          user: user,
          profile: null,
          mode: null,
          brandId: null
        }
      }

      // Create profile first (before brand creation)
      let profileData = null
      let profileError = null
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries && !profileData) {
        try {
          console.log('signUp: Creating profile, attempt:', retryCount + 1)
          
          // Use upsert to handle existing profiles
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: fullName,
              email: email,
              phone: phone,
              role: role
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single()

          if (error) {
            profileError = error
            console.error('signUp: Profile creation error:', error)
            
            // If it's a duplicate key error, try to get existing profile
            if (error.message.includes('duplicate key') || error.message.includes('violates unique constraint')) {
              console.log('signUp: Profile already exists, fetching existing profile...')
              try {
                const { data: existingProfile, error: fetchError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single()
                
                if (fetchError) {
                  console.error('signUp: Error fetching existing profile:', fetchError)
                  throw fetchError
                }
                
                console.log('signUp: Found existing profile:', existingProfile)
                profileData = existingProfile
                break
              } catch (fetchError) {
                console.error('signUp: Error handling existing profile:', fetchError)
                throw fetchError
              }
            }
            
            // If it's an RLS error, wait a bit and retry
            if (error.message.includes('row-level security') || error.message.includes('violates row-level security')) {
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
              retryCount++
              continue
            }
            throw error
          }

          profileData = data
          console.log('signUp: Profile created successfully:', profileData)
          break
        } catch (error) {
          profileError = error
          console.error('signUp: Profile creation catch error:', error)
          if (retryCount >= maxRetries - 1) {
            throw error
          }
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (profileError) throw profileError

      // Create brand if team mode (AFTER profile is created)
      let brandId = null
      if (mode === APP_MODES.TEAM && brandName) {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .insert({
            name: brandName,
            owner_id: user.id
          })
          .select()
          .single()

        if (brandError) throw brandError
        brandId = brandData.id

        // Create user_brands relationship with retry logic
        let userBrandError = null
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries && userBrandError === null) {
          try {
            console.log('signUp: Creating user_brands relationship, attempt:', retryCount + 1)
            const { error } = await supabase
              .from('user_brands')
              .insert({
                user_id: user.id,
                brand_id: brandId,
                role: role
              })

            if (error) {
              userBrandError = error
              console.error('signUp: user_brands insert error:', error)
              retryCount++
              if (retryCount >= maxRetries) {
                throw error
              }
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000))
            } else {
              console.log('signUp: user_brands relationship created successfully')
              break
            }
          } catch (error) {
            userBrandError = error
            retryCount++
            if (retryCount >= maxRetries) {
              throw error
            }
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        if (userBrandError) throw userBrandError
      }



      return {
        user,
        profile: profileData,
        mode: mode,
        brandId: brandId,
        awaitingConfirmation: false
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('signIn: Starting signin process...')
      
      // Test connection first
      const isConnected = await supabaseHelpers.testConnection()
      if (!isConnected) {
        throw new Error('Unable to connect to server. Please check your internet connection.')
      }
      
      // Add timeout to prevent hanging - increased to 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Signin timeout - please try again')), 30000)
      })
      
      const signinPromise = supabase.auth.signInWithPassword({
        email,
        password
      })
      
      const response = await Promise.race([signinPromise, timeoutPromise])
      const { data, error } = response

      if (error) {
        console.error('signIn: Supabase auth error:', error)
        throw error
      }

      console.log('signIn: Auth successful, getting user data...')
      const user = data.user
      
      if (!user) {
        throw new Error('No user data received')
      }

      // Get user profile with retry logic and increased timeout
      let profile = null
      let retryCount = 0
      const maxRetries = 5

      while (retryCount < maxRetries && !profile) {
        try {
          console.log('signIn: Getting profile, attempt:', retryCount + 1)
          
          // Add timeout for profile fetch
          const profileTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
          })
          
          const profilePromise = supabaseHelpers.getUserProfile(user.id)
          profile = await Promise.race([profilePromise, profileTimeoutPromise])
          break
        } catch (error) {
          console.error('signIn: Profile fetch error:', error)
          retryCount++
          if (retryCount >= maxRetries) {
            throw new Error('Failed to fetch user profile after multiple attempts')
          }
          // Wait before retry - increased wait time
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      if (!profile) {
        throw new Error('User profile not found')
      }

      console.log('signIn: Profile fetched, checking team mode...')

      // Get user's brand from user_brands table with timeout
      let brandId = null
      let isTeam = false
      
      try {
        const teamTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Team mode check timeout')), 10000)
        })
        
        const teamPromise = supabaseHelpers.isTeamMode(profile)
        isTeam = await Promise.race([teamPromise, teamTimeoutPromise])
        
        if (isTeam) {
          const { data: userBrands, error: brandError } = await supabase
            .from('user_brands')
            .select('brand_id')
            .eq('user_id', user.id)
            .single()
          
          if (brandError) {
            console.warn('signIn: Brand fetch error:', brandError)
          } else {
            brandId = userBrands?.brand_id || null
          }
        }
      } catch (error) {
        console.warn('signIn: Team mode check error:', error)
        // Continue without brand data
      }

      console.log('signIn: Signin successful')
      return {
        user,
        profile,
        mode: isTeam ? APP_MODES.TEAM : APP_MODES.SINGLE,
        brandId: brandId
      }
    } catch (error) {
      console.error('signIn: Error during signin:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      console.log('signOut: Starting signout process...')
      
      // Clear localStorage immediately
      localStorage.removeItem('salonx-auth')
      localStorage.removeItem('salonx-data-loaded')
      
      // Clear any other potential auth-related localStorage items
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('salonx')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear all app data immediately
      dispatch({ type: 'app/resetDataState' })
      
      // Use the comprehensive signout helper
      const result = await performSignout()
      
      if (!result.success) {
        console.warn('signOut: performSignout failed, but continuing with logout')
      }
      
      console.log('signOut: Successfully signed out')
      return null
    } catch (error) {
      console.error('signOut: Error during signout:', error)
      // Even if performSignout fails, clear localStorage and continue
      localStorage.removeItem('salonx-auth')
      localStorage.removeItem('salonx-data-loaded')
      
      // Clear any other potential auth-related localStorage items
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('salonx')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Don't reject, just return null to ensure logout completes
      return null
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      console.log('checkAuth: Starting authentication check...')
      
      // Check localStorage first
      const savedAuth = localStorage.getItem('salonx-auth')
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth)
          console.log('checkAuth: Found saved auth:', parsed)
          
          // If we have valid saved auth, use it
          if (parsed.user && parsed.profile && parsed.isAuthenticated === true) {
            console.log('checkAuth: Using saved auth state')
            return {
              user: parsed.user,
              profile: parsed.profile,
              mode: parsed.mode,
              brandId: parsed.brandId
            }
          } else {
            console.log('checkAuth: Invalid saved auth data, clearing localStorage')
            localStorage.removeItem('salonx-auth')
          }
        } catch (error) {
          console.error('checkAuth: Error parsing saved auth:', error)
        }
      }
      
      const user = await supabaseHelpers.getCurrentUser()
      
      console.log('checkAuth: User found:', user)
      if (!user) {
        console.log('checkAuth: No user found, returning unauthenticated state')
        return { user: null, profile: null, mode: null, brandId: null }
      }

      const profile = await supabaseHelpers.getUserProfile(user.id)

      // Get user's brand from user_brands table
      let brandId = null
      const isTeam = await supabaseHelpers.isTeamMode(profile)
      if (isTeam) {
        const { data: userBrands } = await supabase
          .from('user_brands')
          .select('brand_id')
          .eq('user_id', user.id)
          .single()
        
        brandId = userBrands?.brand_id || null
      }

      return {
        user,
        profile,
        mode: isTeam ? APP_MODES.TEAM : APP_MODES.SINGLE,
        brandId: brandId
      }
    } catch (error) {
      console.error('checkAuth: Error during authentication check:', error)
      // Don't reject for auth session missing, just return unauthenticated state
      if (error.message.includes('Auth session missing') || error.message.includes('timeout')) {
        console.log('checkAuth: Auth session missing or timeout, returning unauthenticated state')
        return { user: null, profile: null, mode: null, brandId: null }
      }
      return rejectWithValue(error.message)
    }
  }
)

// Get initial state from localStorage if available
const getInitialState = () => {
  try {
    const savedAuth = localStorage.getItem('salonx-auth')
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth)
      console.log('getInitialState: Parsed saved auth:', parsed)
      
      // Validate that we have all required fields for authentication
      const hasValidAuth = parsed.user && parsed.profile && parsed.isAuthenticated === true
      
      if (hasValidAuth) {
        console.log('getInitialState: Found valid auth data in localStorage')
        return {
          user: parsed.user,
          profile: parsed.profile,
          mode: parsed.mode || null,
          brandId: parsed.brandId || null,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }
      } else {
        console.log('getInitialState: Invalid auth data in localStorage, clearing')
        console.log('getInitialState: hasValidAuth check failed:', {
          hasUser: !!parsed.user,
          hasProfile: !!parsed.profile,
          isAuthenticated: parsed.isAuthenticated
        })
        localStorage.removeItem('salonx-auth')
        localStorage.removeItem('salonx-data-loaded')
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error)
    // Clear corrupted localStorage
    localStorage.removeItem('salonx-auth')
    localStorage.removeItem('salonx-data-loaded')
  }
  
  return {
    user: null,
    profile: null,
    mode: null, // 'team' or 'single'
    brandId: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }
}

// Initial state
const initialState = getInitialState()

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload.awaitingConfirmation) {
          // Do not mark as authenticated yet
          state.user = action.payload.user
          state.profile = null
          state.mode = null
          state.brandId = null
          state.isAuthenticated = false
          // Do not persist auth yet
        } else {
          state.user = action.payload.user
          state.profile = action.payload.profile
          state.mode = action.payload.mode
          state.brandId = action.payload.brandId
          state.isAuthenticated = true
          // Save to localStorage
          localStorage.setItem('salonx-auth', JSON.stringify({
            user: action.payload.user,
            profile: action.payload.profile,
            mode: action.payload.mode,
            brandId: action.payload.brandId,
            isAuthenticated: true
          }))
        }
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.mode = action.payload.mode
        state.brandId = action.payload.brandId
        state.isAuthenticated = true
        
        // Save to localStorage
        localStorage.setItem('salonx-auth', JSON.stringify({
          user: action.payload.user,
          profile: action.payload.profile,
          mode: action.payload.mode,
          brandId: action.payload.brandId,
          isAuthenticated: true
        }))
        
        // Trigger initial data loading after successful sign in
        // This will be handled by the App component's useEffect
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Sign Out
      .addCase(signOut.pending, (state) => {
        // Don't set loading to true, just clear immediately
        state.isLoading = false
        state.error = null
        state.user = null
        state.profile = null
        state.mode = null
        state.brandId = null
        state.isAuthenticated = false
      })
      .addCase(signOut.fulfilled, (state) => {
        console.log('signOut.fulfilled: Clearing auth state')
        state.isLoading = false
        state.user = null
        state.profile = null
        state.mode = null
        state.brandId = null
        state.isAuthenticated = false
        state.error = null
        
        // Clear localStorage (already done in thunk, but just in case)
        localStorage.removeItem('salonx-auth')
        localStorage.removeItem('salonx-data-loaded')
        
        // Clear any other potential auth-related localStorage items
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('salonx')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      })
      .addCase(signOut.rejected, (state, action) => {
        console.error('signOut.rejected:', action.payload)
        state.isLoading = false
        state.error = action.payload
        
        // Even if signout fails, clear the state
        state.user = null
        state.profile = null
        state.mode = null
        state.brandId = null
        state.isAuthenticated = false
        localStorage.removeItem('salonx-auth')
        localStorage.removeItem('salonx-data-loaded')
        
        // Clear any other potential auth-related localStorage items
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('salonx')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        console.log('checkAuth.fulfilled:', action.payload)
        state.isLoading = false
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.mode = action.payload.mode
        state.brandId = action.payload.brandId
        
        // Only set as authenticated if we have valid user and profile data
        const hasValidAuth = action.payload.user && action.payload.profile
        state.isAuthenticated = hasValidAuth
        
        if (hasValidAuth) {
          // Save to localStorage only if authenticated
          localStorage.setItem('salonx-auth', JSON.stringify({
            user: action.payload.user,
            profile: action.payload.profile,
            mode: action.payload.mode,
            brandId: action.payload.brandId,
            isAuthenticated: true
          }))
        } else {
          // Clear localStorage if not authenticated
          localStorage.removeItem('salonx-auth')
          localStorage.removeItem('salonx-data-loaded')
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        console.log('checkAuth.rejected:', action.payload)
        state.isLoading = false
        state.user = null
        state.profile = null
        state.mode = null
        state.brandId = null
        state.isAuthenticated = false
        state.error = action.payload
      })
  }
})

export const { clearError, setLoading, updateProfile } = authSlice.actions

// Selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectProfile = (state) => state.auth.profile
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsLoading = (state) => state.auth.isLoading
export const selectError = (state) => state.auth.error
export const selectMode = (state) => state.auth.mode
export const selectBrandId = (state) => state.auth.brandId
export const selectRole = (state) => state.auth.profile?.role
export const selectIsOwner = (state) => state.auth.profile?.role === USER_ROLES.OWNER
export const selectIsAdmin = (state) => state.auth.profile?.role === USER_ROLES.ADMIN
export const selectIsStylist = (state) => state.auth.profile?.role === USER_ROLES.STYLIST

export default authSlice.reducer 