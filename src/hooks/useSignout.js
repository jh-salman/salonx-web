import { useDispatch, useSelector } from 'react-redux'
import { signOut, selectIsLoading } from '../features/auth/authSlice'

export const useSignout = () => {
  const dispatch = useDispatch()
  const isLoading = useSelector(selectIsLoading)

  const handleSignout = async (options = {}) => {
    const {
      onSuccess = null,
      onError = null,
      redirectTo = null
    } = options

    try {
      console.log('useSignout: Starting signout...')
      
      const result = await dispatch(signOut())
      
      console.log('useSignout: Signout result:', result)
      
      if (result.meta.requestStatus === 'fulfilled') {
        console.log('useSignout: Signout successful')
        
        // Call success callback
        if (onSuccess) {
          onSuccess(result)
        }
        
        // Redirect if specified
        if (redirectTo) {
          window.location.href = redirectTo
        }
        
        return { success: true, result }
      } else {
        console.error('useSignout: Signout failed')
        
        // Call error callback
        if (onError) {
          onError(result.payload)
        }
        
        return { success: false, error: result.payload }
      }
      
    } catch (error) {
      console.error('useSignout: Error during signout:', error)
      
      // Call error callback
      if (onError) {
        onError(error.message)
      }
      
      return { success: false, error: error.message }
    }
  }

  return {
    signout: handleSignout,
    isLoading
  }
} 