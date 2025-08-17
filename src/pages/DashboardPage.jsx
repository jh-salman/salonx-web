import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
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
import { createReview } from '../features/reviews/reviewsSlice'
import { supabase } from '../lib/supabase'

// Components
import LoadingSpinner from '../components/shared/LoadingSpinner'
import SignoutButton from '../components/SignoutButton'


const DashboardPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  // Auth state
  const profile = useSelector(selectProfile)
  const mode = useSelector(selectMode)
  const brandId = useSelector(selectBrandId)
  
  // Data state
  const performance = useSelector(selectPerformance)
  const appointments = useSelector(selectAppointments)
  const waitlist = useSelector(selectWaitlist)
  
  // Local state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [calendarView, setCalendarView] = useState('week')
  const [now, setNow] = useState(Date.now())
  const [reviewApt, setReviewApt] = useState(null)
  const [confirmTimerApt, setConfirmTimerApt] = useState(null)
  const [timerMinutes, setTimerMinutes] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')


  // Fetch initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const DASHBOARD_FETCH_TIMEOUT_MS = 15000

        const promises = [
          dispatch(fetchPerformance()),
          dispatch(fetchAppointments()),
          dispatch(fetchWaitlist())
        ]
        
        // Wait for at least one promise to complete
        await Promise.race([
          Promise.any(promises),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), DASHBOARD_FETCH_TIMEOUT_MS)
          )
        ])
      } catch (err) {
        if (import.meta.env.PROD && err.message === 'Timeout') {
          console.warn('Dashboard data fetch warning:', err)
        }
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

  // Tick every second for timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Helper to get start timestamp for an appointment
  const getStartMs = (apt) => {
    try {
      if (apt.date) return new Date(apt.date).getTime()
      if (apt.appointment_date && apt.appointment_time) return new Date(`${apt.appointment_date}T${apt.appointment_time}`).getTime()
      if (apt.appointment_date) return new Date(apt.appointment_date).getTime()
    } catch {}
    return Number.MAX_SAFE_INTEGER
  }

  // Get today's active appointments sorted by time
  const today = new Date().toISOString().split('T')[0]
  const activeAppointments = [...appointments]
    .filter(apt => 
      apt.status !== 'completed' && 
      !apt.parked && 
      (apt.appointment_date === today || apt.date?.startsWith(today))
    )
    .sort((a, b) => {
      const aStart = getStartMs(a)
      const bStart = getStartMs(b)
      // If start times are equal, sort by duration (shorter first)
      if (aStart === bStart) {
        const aDuration = a.duration || 60
        const bDuration = b.duration || 60
        return aDuration - bDuration
      }
      return aStart - bStart
    })

  // Real-time effect to update active appointments when they change
  useEffect(() => {
    console.log('DashboardPage: Active appointments updated:', activeAppointments.length)
    console.log('DashboardPage: Active appointments details:', activeAppointments.map((apt, index) => ({
      index: index + 1,
      id: apt.id,
      client: apt.clients?.full_name || apt.client_name,
      service: apt.services?.name || apt.service_name,
      time: formatTimeRange(apt),
      duration: apt.duration
    })))
  }, [activeAppointments])

  // Get appointments needing attention
  const needsAttention = appointments.filter(apt => 
    apt.status === 'in_progress' || 
    apt.notes === null || 
    apt.notes === ''
  )

  // Get today's KPIs
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

  const formatTimeRange = (apt) => {
    try {
      const startStr = apt.date || apt.appointment_date
      if (!startStr) return apt.appointment_time || '—'
      const start = new Date(startStr)
      const dur = Number.isFinite(apt.duration) ? apt.duration : 60
      const end = new Date(start.getTime() + dur * 60 * 1000)
      const fmt = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
      return `${fmt(start)} - ${fmt(end)}`
    } catch {
      return apt.appointment_time || '—'
    }
  }

  // Timer helpers
  const timerKey = (id) => `salonx-timer-${id}`
  const getTimer = (id) => {
    try {
      const raw = localStorage.getItem(timerKey(id))
      if (!raw) return null
      return JSON.parse(raw)
    } catch { return null }
  }
  const startTimer = (apt, overrideMin) => {
    const duration = Number.isFinite(overrideMin) ? overrideMin : (Number.isFinite(apt.duration) ? apt.duration : 60)
    const payload = { start: Date.now(), durationMin: duration }
    localStorage.setItem(timerKey(apt.id), JSON.stringify(payload))
    setNow(Date.now())
  }
  const clearTimer = (id) => {
    localStorage.removeItem(timerKey(id))
    setNow(Date.now())
  }
  const getRemaining = (apt) => {
    const t = getTimer(apt.id)
    if (!t) return null
    const end = t.start + t.durationMin * 60 * 1000
    const remaining = end - now
    return remaining
  }
  const fmtCountdown = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const mm = String(Math.floor(s / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  const totalMs = (apt) => {
    const t = getTimer(apt.id)
    const mins = t ? t.durationMin : (Number.isFinite(apt.duration) ? apt.duration : 60)
    return mins * 60 * 1000
  }

  const TimerDial = ({ apt }) => {
    const rem = getRemaining(apt)
    const total = totalMs(apt)
    const running = rem !== null && rem > 0
    const ratio = running ? 1 - (rem / total) : 0
    const angle = Math.max(0, Math.min(360, ratio * 360))
    const label = running ? fmtCountdown(rem) : (Number.isFinite(apt.duration) ? `${apt.duration}` : '—')

    return (
      <div className="relative w-16 h-16">
        {/* Progress arc */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(var(--theme-secondary) ${angle}deg, rgba(255,255,255,0.08) 0deg)`
          }}
        />
        {/* Inner face */}
        <div className="absolute inset-1 rounded-full theme-card border theme-border" />
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center theme-text text-xs font-semibold">
          {label}
        </div>
      </div>
    )
  }


  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold theme-text mb-2">Error Loading Dashboard</h2>
          <p className="theme-text opacity-70 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="theme-accent text-white px-4 py-2 rounded-lg hover:opacity-80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="theme-card rounded-lg p-6 border theme-border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium theme-text opacity-70">Today's Appointments</p>
                <p className="text-2xl font-bold theme-text">{todayAppointments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="theme-card rounded-lg p-6 border theme-border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium theme-text opacity-70">Active Clients</p>
                <p className="text-2xl font-bold theme-text">
                  {appointments.filter(apt => apt.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="theme-card rounded-lg p-6 border theme-border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium theme-text opacity-70">Revenue Today</p>
                <p className="text-2xl font-bold theme-text">${todayRevenue}</p>
              </div>
            </div>
          </div>
          
          <div className="theme-card rounded-lg p-6 border theme-border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium theme-text opacity-70">Completion Rate</p>
                <p className="text-2xl font-bold theme-text">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointments Queue - styled like mock */}
          <div className="theme-card rounded-2xl border theme-border overflow-hidden">
            <div className="p-5 border-b theme-border">
              <h3 className="text-lg font-semibold theme-text flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-400" />
                Today's Appointments ({activeAppointments.length})
              </h3>
            </div>
            <div className="p-5">
              {activeAppointments.length > 0 ? (
                <div className="space-y-4">
                  {activeAppointments.map((appointment, index) => (
                    <div key={appointment.id} className="relative rounded-xl theme-card border theme-border p-4">
                      {/* vertical divider/time area on right */}
                      <div className="absolute right-24 top-4 bottom-4 w-px theme-border opacity-60" />
                      <div className="flex items-center justify-between">
                        {/* Left: client + service */}
                        <div className="pr-4">
                          <div className="flex items-center gap-2">
                            <div className="theme-text text-xl font-extrabold leading-tight">
                              {appointment.clients?.full_name || appointment.client_name || 'Unknown Client'}
                            </div>
                          </div>
                          <div className="theme-text text-base opacity-70">
                            {appointment.services?.name || appointment.service_name || 'Unknown Service'}
                          </div>
                        </div>
                        {/* Middle: time range */}
                        <div className="theme-text text-lg font-medium">{formatTimeRange(appointment)}</div>
                        {/* Right: timer dial (duration minutes) */}
                        <div className="ml-6 flex items-center justify-center">
                          <TimerDial apt={appointment} />
                        </div>
                      </div>
                      {/* Timer controls */}
                      <div className="mt-3 flex items-center justify-end text-sm">
                        {(() => {
                          const rem = getRemaining(appointment)
                          if (rem === null) {
                            return (
                              <button onClick={() => setConfirmTimerApt(appointment)} className="theme-text opacity-70 hover:opacity-100 transition-colors">
                                set timer
                              </button>
                            )
                          }
                          if (rem > 0) {
                            return null
                          }
                          return (
                            <div className="flex items-center gap-3">
                              <span className="text-green-400 font-semibold">Time's up</span>
                              <button
                                onClick={async () => {
                                  try {
                                    await handleAppointmentAction(appointment.id, 'complete')
                                    clearTimer(appointment.id)
                                    setReviewApt(appointment)
                                  } catch (e) { /* noop */ }
                                }}
                                className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white"
                              >Complete & Review</button>
                            </div>
                          )
                        })()}
                      </div>
                      {/* timeline dot */}
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 theme-accent rounded-full border-2 border-white shadow" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="theme-text">No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </div>

          {/* Waitlist */}
          <div className="theme-card rounded-lg border theme-border">
            <div className="p-6 border-b theme-border">
              <h3 className="text-lg font-semibold theme-text flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Waitlist
              </h3>
            </div>
            <div className="p-6">
              {waitlist.length > 0 ? (
                <div className="space-y-4">
                  {waitlist.map((item) => (
                    <div key={item.id} className="theme-card rounded-lg p-4 border theme-border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold theme-text">
                            {item.clients?.full_name || item.client_name || 'Unknown Client'}
                          </h4>
                          <p className="text-sm theme-text opacity-70">
                            {item.services?.name || item.service_name || 'Unknown Service'} • {item.wait_time} min wait
                          </p>
                        </div>
                        <button
                          onClick={() => handlePromoteToAppointment(item)}
                          className="theme-accent text-white px-3 py-2 rounded text-sm hover:opacity-80 transition-colors flex items-center"
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
                  <p className="theme-text">No one on waitlist</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div className="mt-8 theme-card rounded-lg border theme-border">
            <div className="p-6 border-b theme-border">
              <h3 className="text-lg font-semibold theme-text flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-400" />
                Needs Attention
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {needsAttention.map((appointment) => (
                  <div key={appointment.id} className="theme-card rounded-lg p-4 border theme-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold theme-text">
                          {appointment.client_name}
                        </h4>
                        <p className="text-sm theme-text opacity-70">
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
                        className="theme-accent text-white px-3 py-2 rounded text-sm hover:opacity-80 transition-colors flex items-center"
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
        <div className="mt-8 theme-card rounded-lg border theme-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold theme-text">Calendar View</h3>
              <p className="theme-text opacity-70">Quick access to your calendar</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {['day', 'week', 'month'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      calendarView === view
                        ? 'theme-accent text-white'
                        : 'theme-card border theme-border theme-text hover:opacity-80'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              <Link
                to="/calendar"
                className="theme-gradient text-white px-4 py-2 rounded-lg theme-hover transition-colors flex items-center space-x-2"
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