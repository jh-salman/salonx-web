import { supabase } from '../../lib/supabase'
import { appointmentAdded, appointmentUpdated, appointmentDeleted } from '../appointments/appointmentsSlice'

// Calendar realtime subscription (via appointments)
export const subscribeToCalendarChanges = (dispatch, auth) => {
  const { profile } = auth
  
  console.log('subscribeToCalendarChanges: Setting up calendar realtime subscription')
  console.log('subscribeToCalendarChanges: Auth state:', { mode: auth.mode, brandId: auth.brandId, profileId: profile?.id })
  
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
        
        console.log('subscribeToCalendarChanges: Received realtime event:', {
          eventType,
          newRecord: newRecord?.id,
          oldRecord: oldRecord?.id,
          table: 'appointments'
        })
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if appointment belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
          console.log('subscribeToCalendarChanges: Team mode check:', {
            newBrandId: newRecord?.brand_id,
            oldBrandId: oldRecord?.brand_id,
            userBrandId: auth.brandId,
            shouldProcess
          })
        } else {
          // Single mode: check if appointment belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
          console.log('subscribeToCalendarChanges: Single mode check:', {
            newStylistId: newRecord?.stylist_id,
            oldStylistId: oldRecord?.stylist_id,
            profileId: profile.id,
            shouldProcess
          })
        }
        
        if (!shouldProcess) {
          console.log('subscribeToCalendarChanges: Skipping event - not relevant to current user')
          return
        }
        
        // Dispatch appropriate action based on event type
        // Calendar updates are handled through appointments slice
        try {
          switch (eventType) {
            case 'INSERT':
              console.log('subscribeToCalendarChanges: Dispatching appointmentAdded')
              dispatch(appointmentAdded(newRecord))
              break
            case 'UPDATE':
              console.log('subscribeToCalendarChanges: Dispatching appointmentUpdated')
              dispatch(appointmentUpdated(newRecord))
              break
            case 'DELETE':
              console.log('subscribeToCalendarChanges: Dispatching appointmentDeleted')
              dispatch(appointmentDeleted(oldRecord.id))
              break
            default:
              console.log('subscribeToCalendarChanges: Unknown event type:', eventType)
              break
          }
        } catch (error) {
          console.error('subscribeToCalendarChanges: Error dispatching action:', error)
        }
      }
    )
    .subscribe((status) => {
      console.log('subscribeToCalendarChanges: Subscription status:', status)
    })

  return query
}

// Unsubscribe from calendar realtime
export const unsubscribeFromCalendar = (subscription) => {
  if (subscription) {
    console.log('unsubscribeFromCalendar: Removing calendar subscription')
    supabase.removeChannel(subscription)
  }
} 