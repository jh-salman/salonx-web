import { supabase } from '../../lib/supabase'
import { serviceAdded, serviceUpdated, serviceDeleted } from './servicesSlice'

// Realtime subscription for services
export const subscribeToServices = (dispatch, auth) => {
  const { profile } = auth
  
  // Build the subscription query based on user role and mode
  let query = supabase
    .channel('services')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'services' 
      }, 
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if service belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
        } else {
          // Single mode: check if service belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
        }
        
        if (!shouldProcess) return
        
        // Dispatch appropriate action based on event type
        switch (eventType) {
          case 'INSERT':
            dispatch(serviceAdded(newRecord))
            break
          case 'UPDATE':
            dispatch(serviceUpdated(newRecord))
            break
          case 'DELETE':
            dispatch(serviceDeleted(oldRecord.id))
            break
          default:
            break
        }
      }
    )
    .subscribe()

  return query
}

// Unsubscribe from services realtime
export const unsubscribeFromServices = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
} 