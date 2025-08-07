import { supabase } from '../../lib/supabase'
import { clientAdded, clientUpdated, clientDeleted } from './clientsSlice'

// Realtime subscription for clients
export const subscribeToClients = (dispatch, auth) => {
  const { profile } = auth
  
  // Build the subscription query based on user role and mode
  let query = supabase
    .channel('clients')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'clients' 
      }, 
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if client belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
        } else {
          // Single mode: check if client belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
        }
        
        if (!shouldProcess) return
        
        // Dispatch appropriate action based on event type
        switch (eventType) {
          case 'INSERT':
            dispatch(clientAdded(newRecord))
            break
          case 'UPDATE':
            dispatch(clientUpdated(newRecord))
            break
          case 'DELETE':
            dispatch(clientDeleted(oldRecord.id))
            break
          default:
            break
        }
      }
    )
    .subscribe()

  return query
}

// Unsubscribe from clients realtime
export const unsubscribeFromClients = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
} 