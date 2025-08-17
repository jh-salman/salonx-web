import React, { useEffect, useState, Suspense } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'
import { selectIsAuthenticated, selectIsLoading, selectProfile, selectUser, checkAuth } from './features/auth/authSlice'
import { selectIsInitialDataLoaded, selectIsDataLoading, fetchInitialData } from './features/app/appSlice'
import { addError, addSuccess } from './features/alerts/alertsSlice'
import { selectCurrentTheme } from './features/theme/themeSlice'
import ThemeProvider from './components/shared/ThemeProvider'

// Import pages
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import DashboardPage from './pages/DashboardPage'
import SimpleDashboard from './pages/SimpleDashboard'
import Calendar from './pages/Calendar'
import ClientProfile from './pages/ClientProfile'
import NotFound from './pages/NotFound'
import TestPage from './pages/TestPage'
import DebugPage from './pages/DebugPage'
import AppointmentDetails from './pages/AppointmentDetails'

// Import components
import LoadingSpinner from './components/shared/LoadingSpinner'
import SimpleLoading from './components/shared/SimpleLoading'
import QuickLoading from './components/shared/QuickLoading'
import LoadingState from './components/shared/LoadingState'
import FastLoading from './components/shared/FastLoading'
import AlertContainer from './components/shared/AlertContainer'
import DataLoadingProvider from './components/shared/DataLoadingProvider'
import Navbar from './components/shared/Navbar'
import SliderDashboard from './components/shared/SliderDashboard'

// Import realtime subscriptions
import { subscribeToAuthChanges } from './features/auth/realtime'
import { subscribeToAppointments } from './features/appointments/realtime'
import { subscribeToClients } from './features/clients/realtime'
import { subscribeToServices } from './features/services/realtime'

import { subscribeToPerformance } from './features/performance/realtime'
import { subscribeToWaitlist } from './features/waitlist/realtime'
import { subscribeToCalendarChanges } from './features/calendar/realtime'

// Authentication Guard Component
const AuthGuard = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const profile = useSelector(selectProfile)
  
  const safeIsAuthenticated = typeof isAuthenticated === 'boolean' ? isAuthenticated : false
  const safeUser = user || null
  const safeProfile = profile || null
  
  const hasValidAuth = safeIsAuthenticated && safeUser && safeProfile
  
  if (!hasValidAuth) {
    console.log('AuthGuard: User not authenticated or missing data, redirecting to signin')
    console.log('AuthGuard: isAuthenticated:', safeIsAuthenticated, 'user:', !!safeUser, 'profile:', !!safeProfile)
    return <Navigate to="/signin" replace />
  }
  
  return <DataLoadingProvider>{children}</DataLoadingProvider>
}

function App() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated) || false
  const isLoading = useSelector(selectIsLoading) || false
  const profile = useSelector(selectProfile)
  const user = useSelector(selectUser)
  const isInitialDataLoaded = useSelector(selectIsInitialDataLoaded) || false
  const isDataLoading = useSelector(selectIsDataLoading) || false
  const isFetching = useSelector(state => state.app.isFetching) || false
  const currentTheme = useSelector(selectCurrentTheme)
  const [subscriptions, setSubscriptions] = useState([])
  const [isSliderOpen, setIsSliderOpen] = useState(false)

  // Debug logging
  console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'isInitialDataLoaded:', isInitialDataLoaded, 'isDataLoading:', isDataLoading, 'isFetching:', isFetching)
  console.log('App render - Current URL:', window.location.pathname)
  console.log('App render - User data:', user)
  console.log('App render - Profile data:', profile)
  console.log('App render - Auth state type:', typeof isAuthenticated, 'value:', isAuthenticated)
  
  // Ensure authentication state is properly initialized
  const safeIsAuthenticated = typeof isAuthenticated === 'boolean' ? isAuthenticated : false
  const safeUser = user || null
  const safeProfile = profile || null
  
  // Clear invalid authentication state
  useEffect(() => {
    if (isAuthenticated && (!user || !profile)) {
      console.log('App: Invalid authentication state detected, clearing...')
      localStorage.removeItem('salonx-auth')
      localStorage.removeItem('salonx-data-loaded')
    }
    
    // Additional check for corrupted state where isAuthenticated is not a boolean
    if (typeof isAuthenticated !== 'boolean') {
      console.log('App: Corrupted authentication state detected (isAuthenticated is not boolean), clearing...')
      localStorage.removeItem('salonx-auth')
      localStorage.removeItem('salonx-data-loaded')
    }
    
    // Force redirect to signin if user is not properly authenticated
    // But only if we're not already on a public route
    if (!safeIsAuthenticated && 
        window.location.pathname !== '/signin' && 
        window.location.pathname !== '/signup' &&
        !window.location.pathname.startsWith('/simple')) {
      console.log('App: User not authenticated, redirecting to signin')
      window.location.href = '/signin'
    }
  }, [isAuthenticated, user, profile, safeIsAuthenticated])

  // Check authentication on app load
  useEffect(() => {
    console.log('App: Starting auth check...')
    
    // Check localStorage first
    const savedAuth = localStorage.getItem('salonx-auth')
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth)
        console.log('App: Found saved auth:', parsed)
        
        // Validate that we have all required fields for authentication
        const hasValidAuth = parsed.user && parsed.profile && parsed.isAuthenticated === true
        
        if (hasValidAuth) {
          console.log('App: Using saved auth state and triggering data load')
          dispatch(fetchInitialData())
          return
        } else {
          console.log('App: Invalid auth data in localStorage, clearing')
          localStorage.removeItem('salonx-auth')
        }
      } catch (error) {
        console.error('App: Error parsing saved auth:', error)
        // Clear corrupted localStorage
        localStorage.removeItem('salonx-auth')
      }
    }
    
    // If no valid saved auth, check current authentication
    console.log('App: No valid saved auth, checking current authentication')
    dispatch(checkAuth())
  }, [dispatch])

  // Get auth state for subscriptions
  const auth = useSelector(state => state.auth)

  // Set up realtime subscriptions and trigger data loading when authenticated
  useEffect(() => {
    if (safeIsAuthenticated && safeUser && safeProfile) {
      // Check if data is already loaded to prevent multiple calls
      const isDataAlreadyLoaded = isInitialDataLoaded || localStorage.getItem('salonx-data-loaded')
      
      if (!isDataAlreadyLoaded) {
        console.log('App: Triggering initial data load for authenticated user')
        dispatch(fetchInitialData())
      } else {
        console.log('App: Data already loaded, skipping fetch')
      }
      
      // Subscribe to all realtime channels
      console.log('App: Setting up realtime subscriptions...')
      const subs = []
      
      try {
        // Auth changes subscription
        const authSub = subscribeToAuthChanges(dispatch)
        if (authSub) subs.push(authSub)
        
        // Appointments subscription
        const appointmentsSub = subscribeToAppointments(dispatch, auth)
        if (appointmentsSub) subs.push(appointmentsSub)
        
        // Clients subscription
        const clientsSub = subscribeToClients(dispatch, auth)
        if (clientsSub) subs.push(clientsSub)
        
        // Services subscription
        const servicesSub = subscribeToServices(dispatch, auth)
        if (servicesSub) subs.push(servicesSub)
        
        // Performance subscription
        const performanceSub = subscribeToPerformance(dispatch, auth)
        if (performanceSub) subs.push(performanceSub)
        
        // Waitlist subscription
        const waitlistSub = subscribeToWaitlist(dispatch, auth)
        if (waitlistSub) subs.push(waitlistSub)
        
        // Calendar subscription
        const calendarSub = subscribeToCalendarChanges(dispatch, auth)
        if (calendarSub) subs.push(calendarSub)
        
        console.log('App: Successfully set up', subs.length, 'realtime subscriptions')
        setSubscriptions(subs)
      } catch (error) {
        console.error('App: Error setting up realtime subscriptions:', error)
      }

      // Cleanup subscriptions on unmount
      return () => {
        console.log('App: Cleaning up realtime subscriptions')
        subs.forEach((sub, index) => {
          try {
            if (sub && typeof sub.unsubscribe === 'function') {
              console.log('App: Unsubscribing from channel', index)
              sub.unsubscribe()
            } else if (sub && typeof sub.removeChannel === 'function') {
              console.log('App: Removing channel', index)
              sub.removeChannel()
            }
          } catch (error) {
            console.error('App: Error cleaning up subscription', index, ':', error)
          }
        })
      }
    }
  }, [safeIsAuthenticated, safeUser, safeProfile, dispatch, auth, isInitialDataLoaded])

  // Show loading spinner only while checking authentication
  if (isLoading) {
    return <FastLoading message="Loading SalonX..." />
  }

  return (
    <ThemeProvider>
      <div className={`min-h-screen bg-black text-white`}>
        <AlertContainer />
        
        {/* Navbar - Only show when authenticated */}
        {safeIsAuthenticated && safeUser && safeProfile && (
          <Navbar onMenuClick={() => setIsSliderOpen(true)} />
        )}
        
        {/* Slider Dashboard - Only show when authenticated */}
        {safeIsAuthenticated && safeUser && safeProfile && (
          <SliderDashboard 
            isOpen={isSliderOpen} 
            onClose={() => setIsSliderOpen(false)} 
          />
        )}
        
        <Routes>
        {/* Public routes - always accessible */}
        <Route path="/signin" element={
          (safeIsAuthenticated && safeUser && safeProfile) ? <Navigate to="/dashboard" replace /> : <SignIn />
        } />
        <Route path="/signup" element={
          (safeIsAuthenticated && safeUser && safeProfile) ? <Navigate to="/dashboard" replace /> : <SignUp />
        } />
        <Route path="/test" element={<TestPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/simple" element={
          <div className="min-h-screen theme-bg flex items-center justify-center">
            <div className="theme-bg p-8 rounded-lg shadow-lg border theme-border">
              <h1 className="text-2xl font-bold theme-text mb-4">Simple Test</h1>
              <p className="text-green-400">✅ App is working!</p>
              <p className="text-gray-300">isAuthenticated: {safeIsAuthenticated ? 'true' : 'false'}</p>
              <p className="text-gray-300">isLoading: {isLoading.toString()}</p>
            </div>
          </div>
        } />
        
        {/* Protected routes - only accessible when authenticated */}
        <Route path="/dashboard" element={
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        } />
        <Route path="/calendar" element={
          <AuthGuard>
            <Calendar />
          </AuthGuard>
        } />
        <Route path="/appointments/:id" element={
          <AuthGuard>
            <AppointmentDetails />
          </AuthGuard>
        } />
        <Route path="/client/:id" element={
          <AuthGuard>
            <ClientProfile />
          </AuthGuard>
        } />
        
        {/* Default redirects */}
        <Route path="/" element={
          (safeIsAuthenticated && safeUser && safeProfile) ? <Navigate to="/dashboard" replace /> : <Navigate to="/signin" replace />
        } />
        
        {/* 404 route */}
        <Route path="*" element={
          (safeIsAuthenticated && safeUser && safeProfile) ? <NotFound /> : <Navigate to="/signin" replace />
        } />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App 