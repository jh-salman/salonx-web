import { supabase } from '../../lib/supabase'
import { clientAdded, clientUpdated, clientDeleted } from './clientsSlice'

// Realtime subscription for clients
export const subscribeToClients = (dispatch, auth) => {
  const { profile } = auth
  
  console.log('subscribeToClients: Setting up clients realtime subscription')
  console.log('subscribeToClients: Auth state:', { mode: auth.mode, brandId: auth.brandId, profileId: profile?.id })
  
  // Add retry mechanism
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds
  
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
        
        console.log('subscribeToClients: Received realtime event:', {
          eventType,
          newRecord: newRecord?.id,
          oldRecord: oldRecord?.id,
          table: 'clients'
        })
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if client belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
          console.log('subscribeToClients: Team mode check:', {
            newBrandId: newRecord?.brand_id,
            oldBrandId: oldRecord?.brand_id,
            userBrandId: auth.brandId,
            shouldProcess
          })
        } else {
          // Single mode: check if client belongs to user
          shouldProcess = newRecord?.stylist_id === profile.id || oldRecord?.stylist_id === profile.id
          console.log('subscribeToClients: Single mode check:', {
            newStylistId: newRecord?.stylist_id,
            oldStylistId: oldRecord?.stylist_id,
            profileId: profile.id,
            shouldProcess
          })
        }
        
        if (!shouldProcess) {
          console.log('subscribeToClients: Skipping event - not relevant to current user')
          return
        }
        
        // Dispatch appropriate action based on event type
        try {
          switch (eventType) {
            case 'INSERT':
              console.log('subscribeToClients: Dispatching clientAdded')
              dispatch(clientAdded(newRecord))
              break
            case 'UPDATE':
              console.log('subscribeToClients: Dispatching clientUpdated')
              dispatch(clientUpdated(newRecord))
              break
            case 'DELETE':
              console.log('subscribeToClients: Dispatching clientDeleted')
              dispatch(clientDeleted(oldRecord.id))
              break
            default:
              console.log('subscribeToClients: Unknown event type:', eventType)
              break
          }
        } catch (error) {
          console.error('subscribeToClients: Error dispatching action:', error)
        }
      }
    )
    .subscribe((status) => {
      console.log('subscribeToClients: Subscription status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('subscribeToClients: Successfully subscribed to clients realtime')
        retryCount = 0 // Reset retry count on success
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error(`subscribeToClients: Subscription ${status.toLowerCase()}`)
        handleRetry()
      }
    })
    
    // Retry function
    const handleRetry = () => {
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`subscribeToClients: Retrying subscription (${retryCount}/${maxRetries})...`)
        setTimeout(() => {
          subscribeToClients(dispatch, auth)
        }, retryDelay)
      } else {
        console.error('subscribeToClients: Max retries reached, giving up')
      }
    }

  return query
}

// Unsubscribe from clients realtime
export const unsubscribeFromClients = (subscription) => {
  if (subscription) {
    console.log('unsubscribeFromClients: Removing clients subscription')
    supabase.removeChannel(subscription)
  }
} 