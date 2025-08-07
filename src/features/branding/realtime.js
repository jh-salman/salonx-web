import { supabase } from '../../lib/supabase'
import { brandingAdded, brandingUpdated, brandingDeleted } from './brandingSlice'

// Realtime subscription for branding content
export const subscribeToBranding = (dispatch, auth) => {
  const { profile } = auth
  
  // Build the subscription query based on user role and mode
  let query = supabase
    .channel('branding')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'branding_content' 
      }, 
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        // Apply role-based filtering
        let shouldProcess = false
        
        if (auth.mode === 'team') {
          // Team mode: check if branding belongs to user's brand
          shouldProcess = newRecord?.brand_id === auth.brandId || oldRecord?.brand_id === auth.brandId
        } else {
          // Single mode: check if branding belongs to user
          shouldProcess = newRecord?.user_id === profile.id || oldRecord?.user_id === profile.id
        }
        
        if (!shouldProcess) return
        
        // Dispatch appropriate action based on event type
        switch (eventType) {
          case 'INSERT':
            dispatch(brandingAdded(newRecord))
            break
          case 'UPDATE':
            dispatch(brandingUpdated(newRecord))
            break
          case 'DELETE':
            dispatch(brandingDeleted(oldRecord.id))
            break
          default:
            break
        }
      }
    )
    .subscribe()

  return query
} 