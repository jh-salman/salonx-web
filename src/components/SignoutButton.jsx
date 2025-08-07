import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { signOut } from '../features/auth/authSlice'

const SignoutButton = ({ 
  children = 'Sign Out', 
  className = 'btn btn-outline btn-error',
  showLoading = false,
  onSignoutComplete = null 
}) => {
  const dispatch = useDispatch()
  const [isLocalLoading, setIsLocalLoading] = useState(false)

  const handleSignout = async () => {
    try {
      console.log('SignoutButton: Starting signout...')
      setIsLocalLoading(true)
      
      // Dispatch the signout action
      const result = await dispatch(signOut())
      
      console.log('SignoutButton: Signout result:', result)
      
      // Call the callback if provided
      if (onSignoutComplete) {
        onSignoutComplete(result)
      }
      
      // Immediately redirect to signin page
      window.location.href = '/signin'
      
    } catch (error) {
      console.error('SignoutButton: Error during signout:', error)
      setIsLocalLoading(false)
      // Even if there's an error, redirect to signin
      window.location.href = '/signin'
    }
  }

  return (
    <button
      onClick={handleSignout}
      disabled={isLocalLoading}
      className={className}
    >
      {showLoading && isLocalLoading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : null}
      {children}
    </button>
  )
}

export default SignoutButton 