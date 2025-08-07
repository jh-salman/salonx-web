import { supabase } from '../../lib/supabase'
import { appointmentAdded, appointmentUpdated, appointmentDeleted } from '../appointments/appointmentsSlice'

// Calendar realtime subscription (via appointments)
export const subscribeToCalendarChanges = (dispatch, auth) => {
  const { profile } = auth
  
  // Build the subscription query based on user role and mode
  let query = supabase
    .channel('calendar')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, 
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if appointment belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
        } else {
          // Single mode: check if appointment belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
        }
        
        if (!shouldProcess) return
        
        // Dispatch appropriate action based on event type
        // Calendar updates are handled through appointments slice
        switch (eventType) {
          case 'INSERT':
            dispatch(appointmentAdded(newRecord))
            break
          case 'UPDATE':
            dispatch(appointmentUpdated(newRecord))
            break
          case 'DELETE':
            dispatch(appointmentDeleted(oldRecord.id))
            break
          default:
            break
        }
      }
    )
    .subscribe()

  return query
}

// Unsubscribe from calendar realtime
export const unsubscribeFromCalendar = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
} 