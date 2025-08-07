import { supabase } from '../../lib/supabase'
import { appointmentAdded, appointmentUpdated, appointmentDeleted } from './appointmentsSlice'

// Realtime subscription for appointments
export const subscribeToAppointments = (dispatch, auth) => {
  const { profile } = auth
  
  // Build the subscription query based on user role and mode
  let query = supabase
    .channel('appointments')
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
        
        // Log for debugging
        console.log('Appointment realtime update:', {
          eventType,
          appointmentId: newRecord?.id || oldRecord?.id,
          parked: newRecord?.parked,
          mode: auth.mode,
          brandId: auth.brandId,
          profileId: profile.id,
          shouldProcess,
          newRecord,
          oldRecord
        })
        
        // Dispatch appropriate action based on event type
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

// Unsubscribe from appointments realtime
export const unsubscribeFromAppointments = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
} 