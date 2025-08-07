import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper functions for common operations
export const supabaseHelpers = {
  // Test connection to Supabase
  testConnection: async () => {
    try {
      console.log('testConnection: Testing Supabase connection...')
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('testConnection: Connection test failed:', error)
        return false
      }
      
      console.log('testConnection: Connection test successful')
      return true
    } catch (error) {
      console.error('testConnection: Connection test error:', error)
      return false
    }
  },

  // Get current user
  getCurrentUser: async () => {
    console.log('getCurrentUser: Checking for user...')
    try {
      console.log('getCurrentUser: About to call supabase.auth.getUser()')
      
      // Add timeout to prevent hanging - increased to 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('getUser timeout')), 10000)
      })
      
      const getUserPromise = supabase.auth.getUser()
      const response = await Promise.race([getUserPromise, timeoutPromise])
      
      console.log('getCurrentUser: Raw response:', response)
      
      const { data, error } = response
      console.log('getCurrentUser: Full response:', data, 'Error:', error)
      
      if (error) {
        // Don't throw error for AuthSessionMissingError, just return null
        if (error.message.includes('Auth session missing')) {
          console.log('getCurrentUser: Auth session missing, returning null')
          return null
        }
        console.error('getCurrentUser: Error thrown:', error)
        throw error
      }
      
      const user = data?.user
      console.log('getCurrentUser: User data:', user)
      
      if (!user) {
        console.log('getCurrentUser: No user found')
        return null
      }
      
      console.log('getCurrentUser: Returning user:', user)
      return user
    } catch (error) {
      console.error('getCurrentUser: Caught error:', error)
      // Don't throw error for timeout or auth session missing
      if (error.message.includes('timeout') || error.message.includes('Auth session missing')) {
        console.log('getCurrentUser: Returning null for timeout or auth session missing')
        return null
      }
      throw error
    }
  },

  // Get user profile with role and brand info
  getUserProfile: async (userId) => {
    console.log('getUserProfile: Getting profile for user:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('getUserProfile: Profile data:', data, 'Error:', error)
    if (error) throw error
    return data
  },

  // Check if user is in team mode
  isTeamMode: async (profile) => {
    if (!profile) return false
    
    const { data: userBrands } = await supabase
      .from('user_brands')
      .select('brand_id')
      .eq('user_id', profile.id)
    
    return userBrands && userBrands.length > 0
  },

  // Get brand-specific data filter
  getBrandFilter: async (profile) => {
    if (supabaseHelpers.isTeamMode(profile)) {
      // Get user's brands from user_brands table
      const { data: userBrands } = await supabase
        .from('user_brands')
        .select('brand_id')
        .eq('user_id', profile.id)
      
      if (userBrands && userBrands.length > 0) {
        return { brand_id: userBrands[0].brand_id }
      }
    }
    return { stylist_id: profile.id }
  }
} 