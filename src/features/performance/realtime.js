import { supabase } from '../../lib/supabase'
import { performanceLogAdded, performanceLogUpdated, performanceLogDeleted } from './performanceSlice'

// Realtime subscription for performance logs
export const subscribeToPerformance = (dispatch, auth) => {
  const { profile } = auth
  
  // Build the subscription query based on user role and mode
  let query = supabase
    .channel('performance')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'performance_logs' 
      }, 
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if performance log belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
        } else {
          // Single mode: check if performance log belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
        }
        
        if (!shouldProcess) return
        
        // Dispatch appropriate action based on event type
        switch (eventType) {
          case 'INSERT':
            dispatch(performanceLogAdded(newRecord))
            break
          case 'UPDATE':
            dispatch(performanceLogUpdated(newRecord))
            break
          case 'DELETE':
            dispatch(performanceLogDeleted(oldRecord.id))
            break
          default:
            break
        }
      }
    )
    .subscribe()

  return query
}

// Unsubscribe from performance realtime
export const unsubscribeFromPerformance = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
} 