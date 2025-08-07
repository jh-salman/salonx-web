import React, { useEffect, useState, Suspense } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../../features/auth/authSlice'
import { selectIsInitialDataLoaded, selectIsDataLoading, fetchInitialData } from '../../features/app/appSlice'
import SimpleLoading from './SimpleLoading'
import QuickLoading from './QuickLoading'
import LoadingTimeout from './LoadingTimeout'
import LoadingState from './LoadingState'
import FastLoading from './FastLoading'

// Loading fallback component
const LoadingFallback = () => <FastLoading message="Loading SalonX..." />

const DataLoadingProvider = ({ children }) => {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialDataLoaded = useSelector(selectIsInitialDataLoaded)
  const isDataLoading = useSelector(selectIsDataLoading)
  const isFetching = useSelector(state => state.app.isFetching)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

  // Fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitialDataLoaded && !isDataLoading && !isFetching && !hasAttemptedFetch) {
      console.log('DataLoadingProvider: Starting initial data fetch...')
      setHasAttemptedFetch(true)
      dispatch(fetchInitialData())
    }
  }, [isAuthenticated, isInitialDataLoaded, isDataLoading, isFetching, hasAttemptedFetch, dispatch])

  // Reset fetch attempt when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setHasAttemptedFetch(false)
    }
  }, [isAuthenticated])

  // For unauthenticated users, render children immediately
  if (!isAuthenticated) {
    return children
  }

  // For authenticated users, show loading only when actually loading and not already loaded
  if (isAuthenticated && (isDataLoading || isFetching) && !isInitialDataLoaded) {
    return <LoadingFallback />
  }

  // If data is already loaded, render children immediately
  if (isAuthenticated && isInitialDataLoaded) {
    return children
  }

  // For all other cases, render children immediately
  return children
}

export default DataLoadingProvider 