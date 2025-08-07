import { supabase } from '../../lib/supabase'
import { updateProfile } from './authSlice'

// Auth state listener
export const subscribeToAuthChanges = (dispatch) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User signed in - fetch updated profile
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
              *,
              brands (
                id,
                name,
                logo_url
              )
            `)
            .eq('id', session.user.id)
            .single()

          if (!error && profile) {
            dispatch(updateProfile(profile))
          }
        } catch (error) {
          console.error('Error fetching profile on auth change:', error)
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear profile
        dispatch(updateProfile(null))
      }
    }
  )

  return subscription
}

// Profile changes subscription
export const subscribeToProfileChanges = (dispatch, auth) => {
  if (!auth.user) return null

  const query = supabase
    .channel('profile')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${auth.user.id}`
      }, 
      (payload) => {
        const { new: newRecord } = payload
        
        // Update profile in store
        dispatch(updateProfile(newRecord))
      }
    )
    .subscribe()

  return query
}

// Brand changes subscription (for team mode)
export const subscribeToBrandChanges = (dispatch, auth) => {
  if (!auth.brandId) return null

  const query = supabase
    .channel('brand')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'brands',
        filter: `id=eq.${auth.brandId}`
      }, 
      (payload) => {
        const { new: newRecord } = payload
        
        // Update brand info in store (you might want to add a brand slice)
        console.log('Brand updated:', newRecord)
      }
    )
    .subscribe()

  return query
}

// Unsubscribe from auth realtime
export const unsubscribeFromAuth = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
} 