import { supabase } from '../../lib/supabase'
import { clientAdded, clientUpdated, clientDeleted } from './clientsSlice'

// Realtime subscription for clients
export const subscribeToClients = (dispatch, auth) => {
  const { profile } = auth
  
  console.log('subscribeToClients: Setting up clients realtime subscription')
  console.log('subscribeToClients: Auth state:', { mode: auth.mode, brandId: auth.brandId, profileId: profile?.id })
  
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
    })

  return query
}

// Unsubscribe from clients realtime
export const unsubscribeFromClients = (subscription) => {
  if (subscription) {
    console.log('unsubscribeFromClients: Removing clients subscription')
    supabase.removeChannel(subscription)
  }
} 