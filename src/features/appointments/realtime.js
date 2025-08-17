import { supabase } from '../../lib/supabase'
import { appointmentAdded, appointmentUpdated, appointmentDeleted } from './appointmentsSlice'

// Realtime subscription for appointments
export const subscribeToAppointments = (dispatch, auth) => {
  const { profile } = auth
  
  console.log('subscribeToAppointments: Setting up realtime subscription for:', {
    mode: auth.mode,
    brandId: auth.brandId,
    profileId: profile?.id
  })
  
  // Add retry mechanism
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds
  
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
        
        console.log('subscribeToAppointments: Raw payload received:', payload)
        console.log('subscribeToAppointments: Event type:', eventType)
        console.log('subscribeToAppointments: New record:', newRecord)
        console.log('subscribeToAppointments: Old record:', oldRecord)
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if appointment belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
          console.log('subscribeToAppointments: Team mode check:', {
            newRecordBrandId: newRecord?.brand_id,
            oldRecordBrandId: oldRecord?.brand_id,
            authBrandId: auth.brandId,
            shouldProcess
          })
        } else {
          // Single mode: check if appointment belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
          console.log('subscribeToAppointments: Single mode check:', {
            newRecordStylistId: newRecord?.stylist_id,
            oldRecordStylistId: oldRecord?.stylist_id,
            profileId: profile.id,
            shouldProcess
          })
        }
        
        if (!shouldProcess) {
          console.log('subscribeToAppointments: Skipping update - not relevant to current user', {
            newRecordBrandId: newRecord?.brand_id,
            oldRecordBrandId: oldRecord?.brand_id,
            newRecordStylistId: newRecord?.stylist_id,
            oldRecordStylistId: oldRecord?.stylist_id,
            authBrandId: auth.brandId,
            profileId: profile.id
          })
          return
        }
        
        // Log for debugging
        console.log('subscribeToAppointments: Processing realtime update:', {
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
        try {
          switch (eventType) {
            case 'INSERT':
              console.log('subscribeToAppointments: Dispatching appointmentAdded for appointment:', newRecord?.id)
              if (newRecord) {
                dispatch(appointmentAdded(newRecord))
                console.log('subscribeToAppointments: Successfully dispatched appointmentAdded')
              } else {
                console.error('subscribeToAppointments: No new record for INSERT event')
              }
              break
              
            case 'UPDATE':
              console.log('subscribeToAppointments: Dispatching appointmentUpdated for appointment:', newRecord?.id)
              if (newRecord) {
                dispatch(appointmentUpdated(newRecord))
                console.log('subscribeToAppointments: Successfully dispatched appointmentUpdated')
              } else {
                console.error('subscribeToAppointments: No new record for UPDATE event')
              }
              break
              
            case 'DELETE':
              console.log('subscribeToAppointments: Dispatching appointmentDeleted for appointment:', oldRecord?.id)
              if (oldRecord) {
                dispatch(appointmentDeleted(oldRecord.id))
                console.log('subscribeToAppointments: Successfully dispatched appointmentDeleted')
              } else {
                console.error('subscribeToAppointments: No old record for DELETE event')
              }
              break
              
            default:
              console.log('subscribeToAppointments: Unknown event type:', eventType)
              break
          }
        } catch (error) {
          console.error('subscribeToAppointments: Error dispatching action:', error)
          console.error('subscribeToAppointments: Error details:', {
            eventType,
            appointmentId: newRecord?.id || oldRecord?.id,
            error: error.message,
            stack: error.stack
          })
        }
      }
    )
    .subscribe((status) => {
      console.log('subscribeToAppointments: Subscription status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('subscribeToAppointments: Successfully subscribed to appointments realtime')
        retryCount = 0 // Reset retry count on success
      } else if (status === 'CHANNEL_ERROR') {
        console.error('subscribeToAppointments: Channel error occurred')
        handleRetry()
      } else if (status === 'TIMED_OUT') {
        console.error('subscribeToAppointments: Subscription timed out')
        handleRetry()
      } else if (status === 'CLOSED') {
        console.error('subscribeToAppointments: Subscription closed')
        handleRetry()
      }
    })
    
    // Retry function
    const handleRetry = () => {
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`subscribeToAppointments: Retrying subscription (${retryCount}/${maxRetries})...`)
        setTimeout(() => {
          subscribeToAppointments(dispatch, auth)
        }, retryDelay)
      } else {
        console.error('subscribeToAppointments: Max retries reached, giving up')
      }
    }

  return query
}

// Unsubscribe from appointments realtime
export const unsubscribeFromAppointments = (subscription) => {
  if (subscription) {
    console.log('unsubscribeFromAppointments: Unsubscribing from appointments')
    try {
      supabase.removeChannel(subscription)
      console.log('unsubscribeFromAppointments: Successfully unsubscribed')
    } catch (error) {
      console.error('unsubscribeFromAppointments: Error unsubscribing:', error)
    }
  }
} 