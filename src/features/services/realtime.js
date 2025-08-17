import { supabase } from '../../lib/supabase'
import { serviceAdded, serviceUpdated, serviceDeleted } from './servicesSlice'

// Realtime subscription for services
export const subscribeToServices = (dispatch, auth) => {
  const { profile } = auth
  
  console.log('subscribeToServices: Setting up services realtime subscription')
  console.log('subscribeToServices: Auth state:', { mode: auth.mode, brandId: auth.brandId, profileId: profile?.id })
  
  // Add retry mechanism
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds
  
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
        
        console.log('subscribeToServices: Received realtime event:', {
          eventType,
          newRecord: newRecord?.id,
          oldRecord: oldRecord?.id,
          table: 'services'
        })
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if service belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
          console.log('subscribeToServices: Team mode check:', {
            newBrandId: newRecord?.brand_id,
            oldBrandId: oldRecord?.brand_id,
            userBrandId: auth.brandId,
            shouldProcess
          })
        } else {
          // Single mode: check if service belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
          console.log('subscribeToServices: Single mode check:', {
            newStylistId: newRecord?.stylist_id,
            oldStylistId: oldRecord?.stylist_id,
            profileId: profile.id,
            shouldProcess
          })
        }
        
        if (!shouldProcess) {
          console.log('subscribeToServices: Skipping event - not relevant to current user')
          return
        }
        
        // Dispatch appropriate action based on event type
        try {
          switch (eventType) {
            case 'INSERT':
              console.log('subscribeToServices: Dispatching serviceAdded')
              dispatch(serviceAdded(newRecord))
              break
            case 'UPDATE':
              console.log('subscribeToServices: Dispatching serviceUpdated')
              dispatch(serviceUpdated(newRecord))
              break
            case 'DELETE':
              console.log('subscribeToServices: Dispatching serviceDeleted')
              dispatch(serviceDeleted(oldRecord.id))
              break
            default:
              console.log('subscribeToServices: Unknown event type:', eventType)
              break
          }
        } catch (error) {
          console.error('subscribeToServices: Error dispatching action:', error)
        }
      }
    )
    .subscribe((status) => {
      console.log('subscribeToServices: Subscription status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('subscribeToServices: Successfully subscribed to services realtime')
        retryCount = 0 // Reset retry count on success
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error(`subscribeToServices: Subscription ${status.toLowerCase()}`)
        handleRetry()
      }
    })
    
    // Retry function
    const handleRetry = () => {
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`subscribeToServices: Retrying subscription (${retryCount}/${maxRetries})...`)
        setTimeout(() => {
          subscribeToServices(dispatch, auth)
        }, retryDelay)
      } else {
        console.error('subscribeToServices: Max retries reached, giving up')
      }
    }

  return query
}

// Unsubscribe from services realtime
export const unsubscribeFromServices = (subscription) => {
  if (subscription) {
    console.log('unsubscribeFromServices: Removing services subscription')
    supabase.removeChannel(subscription)
  }
} 