import { supabase } from './supabase'

/**
 * Comprehensive signout function that handles all cleanup
 */
export const performSignout = async () => {
  try {
    console.log('performSignout: Starting comprehensive signout...')
    
    // Clear all localStorage items related to auth
    const keysToRemove = [
      'salonx-auth',
      'supabase.auth.token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
    
    // Clear any other auth-related data
    localStorage.removeItem('salonx-auth')
    sessionStorage.clear()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('performSignout: Supabase signout error:', error)
      throw error
    }
    
    // Clear any cached data
    if (window.location) {
      // Force a clean reload if needed
      // window.location.reload()
    }
    
    console.log('performSignout: Successfully signed out')
    return { success: true }
  } catch (error) {
    console.error('performSignout: Error during signout:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  try {
    const savedAuth = localStorage.getItem('salonx-auth')
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth)
      return parsed.isAuthenticated && parsed.user
    }
    return false
  } catch (error) {
    console.error('isAuthenticated: Error checking auth:', error)
    return false
  }
}

/**
 * Get current auth data from localStorage
 */
export const getCurrentAuthData = () => {
  try {
    const savedAuth = localStorage.getItem('salonx-auth')
    if (savedAuth) {
      return JSON.parse(savedAuth)
    }
    return null
  } catch (error) {
    console.error('getCurrentAuthData: Error getting auth data:', error)
    return null
  }
}

/**
 * Clear all auth data
 */
export const clearAllAuthData = () => {
  try {
    // Clear localStorage
    localStorage.removeItem('salonx-auth')
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Clear any Supabase-related items
    const keysToRemove = [
      'supabase.auth.token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
    
    console.log('clearAllAuthData: All auth data cleared')
    return true
  } catch (error) {
    console.error('clearAllAuthData: Error clearing auth data:', error)
    return false
  }
} 