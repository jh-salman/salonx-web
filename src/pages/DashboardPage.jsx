import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  Square,
  Plus,
  ChevronRight,
  Star,
  MessageSquare,
  Settings,
  TrendingUp,
  User,
  Scissors,
  Zap,
  LogOut
} from 'lucide-react'

// Redux imports
import { selectProfile, selectMode, selectBrandId } from '../features/auth/authSlice'
import { 
  selectBranding, 
  fetchBranding 
} from '../features/branding/brandingSlice'
import { 
  selectPerformance, 
  fetchPerformance 
} from '../features/performance/performanceSlice'
import { 
  selectAppointments, 
  fetchAppointments,
  updateAppointment,
  parkAppointment,
  unparkAppointment
} from '../features/appointments/appointmentsSlice'
import { 
  selectWaitlist, 
  fetchWaitlist,
  promoteToAppointment
} from '../features/waitlist/waitlistSlice'

// Components
import LoadingSpinner from '../components/shared/LoadingSpinner'
import SignoutButton from '../components/SignoutButton'

const DashboardPage = () => {
  const dispatch = useDispatch()
  
  // Auth state
  const profile = useSelector(selectProfile)
  const mode = useSelector(selectMode)
  const brandId = useSelector(selectBrandId)
  
  // Data state
  const branding = useSelector(selectBranding)
  const performance = useSelector(selectPerformance)
  const appointments = useSelector(selectAppointments)
  const waitlist = useSelector(selectWaitlist)
  
  // Local state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [calendarView, setCalendarView] = useState('week')

  // Fetch initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const promises = [
          dispatch(fetchBranding()),
          dispatch(fetchPerformance()),
          dispatch(fetchAppointments()),
          dispatch(fetchWaitlist())
        ]
        
        // Wait for at least one promise to complete
        await Promise.race([
          Promise.any(promises),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ])
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err)
        // Don't set error for timeout, just continue
        if (err.message !== 'Timeout') {
          setError('Failed to load dashboard data')
          console.error('Dashboard data fetch error:', err)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (profile) {
      fetchDashboardData()
    }
  }, [dispatch, profile])

  // Get next 4 active appointments
  const activeAppointments = appointments
    .filter(apt => apt.status !== 'completed')
    .slice(0, 4)

  // Get appointments needing attention
  const needsAttention = appointments.filter(apt => 
    apt.status === 'in_progress' || 
    apt.notes === null || 
    apt.notes === ''
  )

  // Get today's KPIs
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => 
    apt.appointment_date === today
  )
  const todayRevenue = todayAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0)
  const completionRate = appointments.length > 0 
    ? (appointments.filter(apt => apt.status === 'completed').length / appointments.length * 100).toFixed(1)
    : 0

  // Handle appointment actions
  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      switch (action) {
        case 'start':
          await dispatch(updateAppointment({ 
            id: appointmentId, 
            status: 'in_progress' 
          })).unwrap()
          break
        case 'park':
          await dispatch(parkAppointment(appointmentId)).unwrap()
          break
        case 'unpark':
          await dispatch(unparkAppointment(appointmentId)).unwrap()
          break
        case 'complete':
          await dispatch(updateAppointment({ 
            id: appointmentId, 
            status: 'completed' 
          })).unwrap()
          break
        default:
          break
      }
    } catch (error) {
      console.error(`Failed to ${action} appointment:`, error)
    }
  }

  // Handle waitlist promotion
  const handlePromoteToAppointment = async (waitlistItem) => {
    try {
      await dispatch(promoteToAppointment(waitlistItem)).unwrap()
    } catch (error) {
      console.error('Failed to promote to appointment:', error)
    }
  }



  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <div className="text-sm text-gray-400">
                Welcome back, {profile?.full_name}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/calendar"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </Link>
              <SignoutButton 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                onSignoutComplete={() => {
                  console.log('Logout successful')
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </SignoutButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Branding Area */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {branding?.logo_url ? (
                  <img 
                    src={branding.logo_url} 
                    alt="Brand Logo" 
                    className="w-12 h-12 rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {branding?.brand_name || 'SalonX'}
                  </h2>
                  <p className="text-gray-400">
                    {branding?.tagline || 'Professional Salon Management'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Mode</div>
                <div className="text-white font-semibold capitalize">{mode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Today's Appointments</p>
                <p className="text-2xl font-bold text-white">{todayAppointments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Clients</p>
                <p className="text-2xl font-bold text-white">
                  {appointments.filter(apt => apt.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Revenue Today</p>
                <p className="text-2xl font-bold text-white">${todayRevenue}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointments Queue */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-400" />
                Next Appointments
              </h3>
            </div>
            <div className="p-6">
              {activeAppointments.length > 0 ? (
                <div className="space-y-4">
                  {activeAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">
                            {appointment.client_name}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {appointment.service_name} • {appointment.appointment_time}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'parked' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'start')}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </button>
                        )}
                        {appointment.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleAppointmentAction(appointment.id, 'park')}
                              className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 transition-colors flex items-center justify-center"
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Park
                            </button>
                            <button
                              onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </button>
                          </>
                        )}
                        {appointment.status === 'parked' && (
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'unpark')}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No active appointments</p>
                </div>
              )}
            </div>
          </div>

          {/* Waitlist */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Waitlist
              </h3>
            </div>
            <div className="p-6">
              {waitlist.length > 0 ? (
                <div className="space-y-4">
                  {waitlist.map((item) => (
                    <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">
                            {item.client_name}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {item.service_name} • {item.wait_time} min wait
                          </p>
                        </div>
                        <button
                          onClick={() => handlePromoteToAppointment(item)}
                          className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Promote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No one on waitlist</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-400" />
                Needs Attention
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {needsAttention.map((appointment) => (
                  <div key={appointment.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">
                          {appointment.client_name}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {appointment.service_name} • {appointment.appointment_time}
                        </p>
                        {(!appointment.notes || appointment.notes === '') && (
                          <p className="text-sm text-orange-400 mt-1">
                            Missing notes
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors flex items-center"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Add Notes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar Link */}
        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Calendar View</h3>
              <p className="text-gray-400">Quick access to your calendar</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {['day', 'week', 'month'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      calendarView === view
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              <Link
                to="/calendar"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Open Calendar</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 