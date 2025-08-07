import { supabase } from '../../lib/supabase'
import { waitlistItemAdded, waitlistItemUpdated, waitlistItemRemoved } from './waitlistSlice'

// Realtime subscription for waitlist
export const subscribeToWaitlist = (dispatch, auth) => {
  const { profile } = auth
  
  // Build the subscription query based on user role and mode
  let query = supabase
    .channel('waitlist')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'waitlist' 
      }, 
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if waitlist item belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
        } else {
          // Single mode: check if waitlist item belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
        }
        
        if (!shouldProcess) return
        
        // Dispatch appropriate action based on event type
        switch (eventType) {
          case 'INSERT':
            dispatch(waitlistItemAdded(newRecord))
            break
          case 'UPDATE':
            dispatch(waitlistItemUpdated(newRecord))
            break
          case 'DELETE':
            dispatch(waitlistItemRemoved(oldRecord.id))
            break
          default:
            break
        }
      }
    )
    .subscribe()

  return query
}

// Unsubscribe from waitlist realtime
export const unsubscribeFromWaitlist = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
} 