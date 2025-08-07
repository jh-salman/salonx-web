import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  selectAppointments, 
  selectParkedAppointments,
  fetchAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  parkAppointment,
  unparkAppointment
} from '../../features/appointments/appointmentsSlice'

import { addSuccess, addError } from '../../features/alerts/alertsSlice'
import { selectProfile } from '../../features/auth/authSlice'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  DollarSign, 
  FileText,
  Edit,
  Trash2,
  Pause,
  Play,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckSquare,
  Settings
} from 'lucide-react'
import CreateAppointmentForm from '../appointments/CreateAppointmentForm'

const CustomCalendar = () => {
  const dispatch = useDispatch()
  const appointments = useSelector(selectAppointments)
  const parkedAppointments = useSelector(selectParkedAppointments)
  const profile = useSelector(selectProfile)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week') // 'day', 'week', 'month'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [bottomSheetData, setBottomSheetData] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  // Get week days
  const getWeekDays = useCallback(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }, [currentDate])

  // Get appointments for a specific date
  const getAppointmentsForDate = useCallback((date) => {
    console.log('CustomCalendar: Getting appointments for date:', date.toDateString())
    console.log('CustomCalendar: All appointments:', appointments)
    
    const allAppointments = appointments
    console.log('CustomCalendar: All appointments:', allAppointments)
    
    const filteredAppointments = allAppointments.filter(apt => {
      // Handle both date field formats
      const dateField = apt.appointment_date || apt.date
      if (!dateField) {
        console.log('CustomCalendar: No date field found for appointment:', apt)
        return false
      }
      
      const aptDate = new Date(dateField)
      // Compare only the date part, ignoring timezone
      const aptDateString = aptDate.toISOString().split('T')[0]
      const targetDateString = date.toISOString().split('T')[0]
      const matches = aptDateString === targetDateString
      console.log('CustomCalendar: Appointment:', apt.id, 'Date field:', dateField, 'Parsed date:', aptDateString, 'Target date:', targetDateString, 'Matches:', matches)
      return matches
    })
    
    console.log('CustomCalendar: Filtered appointments for', date.toDateString(), ':', filteredAppointments.length)
    return filteredAppointments
  }, [appointments])

  // Get time slots (8 AM to 8 PM)
  const getTimeSlots = useCallback(() => {
    const slots = []
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
    }
    return slots
  }, [])

  // Handle slot selection - show bottom sheet
  const handleSlotClick = useCallback((date, time) => {
    const selectedDateTime = new Date(date)
    const [hours, minutes] = time.split(':')
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    setBottomSheetData({
      date: selectedDateTime,
      time,
      dateString: selectedDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      timeString: selectedDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    })
    setShowBottomSheet(true)
  }, [])

  // Handle bottom sheet option selection
  const handleBottomSheetOption = useCallback((option) => {
    setShowBottomSheet(false)
    
    switch (option) {
      case 'appointment':
        setSelectedSlot({
          date: bottomSheetData.date,
          time: bottomSheetData.time
        })
        setShowCreateModal(true)
        break
      case 'task':
        // Handle personal task creation
        dispatch(addSuccess({
          message: 'Personal task feature coming soon!',
          title: 'Feature'
        }))
        break
      case 'working-hours':
        // Handle working hours editing
        dispatch(addSuccess({
          message: 'Working hours feature coming soon!',
          title: 'Feature'
        }))
        break
    }
  }, [bottomSheetData, dispatch])

  // Handle appointment creation
  const handleCreateAppointment = useCallback(async (appointmentData) => {
    try {
      const newAppointment = {
        ...appointmentData,
        date: selectedSlot.date.toISOString(),
        stylist_id: profile.id,
        brand_id: profile.brand_id
      }
      
      await dispatch(createAppointment(newAppointment)).unwrap()
      dispatch(addSuccess({
        message: 'Appointment created successfully',
        title: 'Success'
      }))
      setShowCreateModal(false)
      setSelectedSlot(null)
    } catch (error) {
      dispatch(addError({
        message: `Failed to create appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, selectedSlot, profile])

  // Handle appointment update
  const handleUpdateAppointment = useCallback(async (appointmentData) => {
    try {
      await dispatch(updateAppointment({
        id: selectedAppointment.id,
        ...appointmentData
      })).unwrap()
      
      dispatch(addSuccess({
        message: 'Appointment updated successfully',
        title: 'Success'
      }))
      setShowEditModal(false)
      setSelectedAppointment(null)
    } catch (error) {
      dispatch(addError({
        message: `Failed to update appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, selectedAppointment])

  // Handle appointment actions with confirmation
  const handleAppointmentAction = useCallback((action) => {
    setConfirmAction(action)
    setShowConfirmModal(true)
  }, [])

  // Execute confirmed action
  const executeConfirmedAction = useCallback(async () => {
    if (!selectedAppointment || !confirmAction) return
    
    try {
      switch (confirmAction.type) {
        case 'delete':
          await dispatch(deleteAppointment(selectedAppointment.id)).unwrap()
          dispatch(addSuccess({
            message: 'Appointment deleted successfully',
            title: 'Success'
          }))
          break
        case 'park':
          await dispatch(parkAppointment(selectedAppointment.id)).unwrap()
          dispatch(addSuccess({
            message: 'Appointment parked successfully',
            title: 'Success'
          }))
          break
        case 'unpark':
          await dispatch(unparkAppointment(selectedAppointment.id)).unwrap()
          dispatch(addSuccess({
            message: 'Appointment unparked successfully',
            title: 'Success'
          }))
          break
        case 'edit':
          setShowEditModal(true)
          break
        default:
          break
      }
      setShowAppointmentDetails(false)
      setSelectedAppointment(null)
      setShowConfirmModal(false)
      setConfirmAction(null)
    } catch (error) {
      dispatch(addError({
        message: `Failed to ${confirmAction.type} appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, selectedAppointment, confirmAction])

  // Handle appointment deletion
  const handleDeleteAppointment = useCallback(async () => {
    if (!selectedAppointment) return
    
    try {
      await dispatch(deleteAppointment(selectedAppointment.id)).unwrap()
      dispatch(addSuccess({
        message: 'Appointment deleted successfully',
        title: 'Success'
      }))
      setShowAppointmentDetails(false)
      setSelectedAppointment(null)
    } catch (error) {
      dispatch(addError({
        message: `Failed to delete appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, selectedAppointment])

  // Handle park/unpark
  const handleParkAppointment = useCallback(async () => {
    if (!selectedAppointment) return
    
    const action = selectedAppointment.parked ? 'unpark' : 'park'
    handleAppointmentAction({ type: action })
  }, [dispatch, selectedAppointment, handleAppointmentAction])

  // Navigation
  const navigateToPrevious = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7)
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setDate(currentDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, viewMode])

  const navigateToNext = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7)
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1)
    } else {
      newDate.setDate(currentDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, viewMode])

  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Format time
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])



  // Add test button
  useEffect(() => {
    console.log('CustomCalendar: Component mounted, appointments:', appointments)
    console.log('CustomCalendar: Appointments length:', appointments?.length || 0)
  }, [appointments])

  // Render week view
  const renderWeekView = useCallback(() => {
    const weekDays = getWeekDays()
    const timeSlots = getTimeSlots()

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
          <div className="p-3 border-r border-gray-200"></div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 border-r border-gray-200 text-center">
              <div className="text-sm font-medium text-gray-900">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto">
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-8 border-b border-gray-100 min-h-16">
              <div className="p-2 border-r border-gray-200 text-xs text-gray-500 flex items-center justify-end pr-2">
                {time}
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForDate(day)
                const timeAppointments = dayAppointments.filter(apt => {
                  console.log('CustomCalendar: Week view - Checking appointment for time slot:', time, 'Appointment:', apt)
                  // Handle both date and appointment_time fields
                  let aptTime
                  if (apt.appointment_time) {
                    aptTime = apt.appointment_time
                  } else if (apt.date) {
                    const aptDate = new Date(apt.date)
                    aptTime = aptDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })
                  } else {
                    aptTime = formatTime(apt.appointment_date)
                  }
                  console.log('CustomCalendar: Week view - Appointment time:', aptTime, 'Slot time:', time, 'Matches:', aptTime === time)
                  return aptTime === time
                })

                return (
                  <div 
                    key={dayIndex} 
                    className="p-1 border-r border-gray-200 relative hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSlotClick(day, time)}
                  >
                    {timeAppointments.map((apt, aptIndex) => {
                      console.log('CustomCalendar: Week view - Rendering appointment:', apt)
                      return (
                        <div
                          key={apt.id}
                          className={`p-1 mb-1 rounded text-xs text-white cursor-pointer ${
                            apt.parked ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(apt)
                            setShowAppointmentDetails(true)
                          }}
                        >
                          <div className="font-medium truncate">
                            {apt.clients?.full_name || apt.client_name || 'Unknown'}
                          </div>
                          <div className="text-xs opacity-90">
                            {apt.services?.name || apt.service_name || 'No service'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }, [getWeekDays, getTimeSlots, getAppointmentsForDate, formatTime, handleSlotClick])

  // Render day view
  const renderDayView = useCallback(() => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    const timeSlots = getTimeSlots()

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-600 bg-gray-800">
          <div className="text-lg font-semibold text-white">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto bg-gray-900">
          {timeSlots.map((time, timeIndex) => {
            const timeAppointments = dayAppointments.filter(apt => {
              console.log('CustomCalendar: Checking appointment for time slot:', time, 'Appointment:', apt)
              // Handle both date and appointment_time fields
              let aptTime
              if (apt.appointment_time) {
                aptTime = apt.appointment_time
              } else if (apt.date) {
                const aptDate = new Date(apt.date)
                aptTime = aptDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              } else if (apt.appointment_date) {
                const aptDate = new Date(apt.appointment_date)
                aptTime = aptDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              } else {
                // Try to parse from any available date field
                const dateField = apt.appointment_date || apt.date
                if (dateField) {
                  const aptDate = new Date(dateField)
                  aptTime = aptDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })
                } else {
                  aptTime = '00:00' // Default time if no date field found
                }
              }
              console.log('CustomCalendar: Appointment time:', aptTime, 'Slot time:', time, 'Matches:', aptTime === time)
              // Also check if appointment time is within 30 minutes of the slot
              const timeMatch = aptTime === time
              const timeDiff = Math.abs(parseInt(aptTime.split(':')[0]) - parseInt(time.split(':')[0])) * 60 + 
                             Math.abs(parseInt(aptTime.split(':')[1]) - parseInt(time.split(':')[1]))
              const within30Min = timeDiff <= 30
              return timeMatch || within30Min
            })

            return (
              <div key={timeIndex} className="flex border-b border-gray-600 min-h-16">
                <div className="w-20 p-2 text-xs text-gray-400 flex items-center justify-end pr-2 border-r border-gray-600">
                  {time}
                </div>
                <div 
                  className="flex-1 p-1 hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSlotClick(currentDate, time)}
                >
                  {timeAppointments.map((apt, aptIndex) => {
                    console.log('CustomCalendar: Rendering appointment:', apt)
                    return (
                      <div
                        key={apt.id}
                        className={`p-2 mb-1 rounded text-sm text-white cursor-pointer ${
                          apt.parked ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAppointment(apt)
                          setShowAppointmentDetails(true)
                        }}
                      >
                        <div className="font-medium">
                          {apt.clients?.full_name || apt.client_name || 'Unknown'}
                        </div>
                        <div className="text-xs opacity-90">
                          {apt.services?.name || apt.service_name || 'No service'} • {apt.appointment_time || (apt.date ? new Date(apt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : apt.appointment_date ? new Date(apt.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'No time')}
                        </div>
                        <div className="text-xs opacity-90">
                          ${apt.price || 0} • {apt.duration || 60} min
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [currentDate, getAppointmentsForDate, getTimeSlots, formatTime, handleSlotClick])

  // Render month view
  const renderMonthView = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - firstDay.getDay())
    
    const days = []
    const currentDay = new Date(startDate)
    
    while (currentDay.getMonth() <= month && currentDay <= lastDay || days.length < 42) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day)
            const isCurrentMonth = day.getMonth() === month
            const isToday = day.toDateString() === new Date().toDateString()

            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b border-gray-200 ${
                  isToday ? 'bg-blue-50' : 'bg-white'
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className={`text-xs p-1 rounded cursor-pointer ${
                        apt.parked ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}
                      onClick={() => {
                        setSelectedAppointment(apt)
                        setShowAppointmentDetails(true)
                      }}
                    >
                      <div className="font-medium truncate">
                        {apt.clients?.full_name || apt.client_name || 'Unknown'}
                      </div>
                      <div className="text-xs opacity-75">
                        {apt.appointment_time || formatTime(apt.date || apt.appointment_date)}
                      </div>
                    </div>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [currentDate, getAppointmentsForDate, formatTime])

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateToPrevious}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={navigateToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={navigateToNext}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 bg-white">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>

      {/* Bottom Sheet Modal */}
      {showBottomSheet && bottomSheetData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {bottomSheetData.dateString}
                </div>
                <div className="text-sm text-gray-500">
                  {bottomSheetData.timeString}
                </div>
              </div>
              <button
                onClick={() => setShowBottomSheet(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-4">
              <button
                onClick={() => handleBottomSheetOption('appointment')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">New appointment</div>
                  <div className="text-sm text-gray-500">Create a new appointment</div>
                </div>
              </button>

              <button
                onClick={() => handleBottomSheetOption('task')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Personal task</div>
                  <div className="text-sm text-gray-500">Create a personal task</div>
                </div>
              </button>

              <button
                onClick={() => handleBottomSheetOption('working-hours')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Edit working hours</div>
                  <div className="text-sm text-gray-500">Edit your calendar working hours</div>
                </div>
              </button>
            </div>

            {/* Bottom padding for mobile */}
            <div className="h-4"></div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <CreateAppointmentForm
          onClose={() => {
            setShowCreateModal(false)
            setSelectedSlot(null)
          }}
          selectedDate={selectedSlot?.date}
          onSubmit={handleCreateAppointment}
        />
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>
              <button
                onClick={() => setShowAppointmentDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedAppointment.clients?.full_name || 'Unknown Client'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedAppointment.clients?.phone || 'No phone'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedAppointment.services?.name || 'No Service'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedAppointment.duration || 60} minutes
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedAppointment.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedAppointment.date).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    ${selectedAppointment.price || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedAppointment.parked ? 'Parked' : 'Active'}
                  </div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                  <div className="text-sm text-gray-600">{selectedAppointment.notes}</div>
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => handleAppointmentAction({ type: 'edit' })}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                
                <button
                  onClick={handleParkAppointment}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center justify-center"
                >
                  {selectedAppointment.parked ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Unpark
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Park
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleAppointmentAction({ type: 'delete' })}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet Modal */}
      {showBottomSheet && bottomSheetData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {bottomSheetData.dateString}
                </div>
                <div className="text-sm text-gray-500">
                  {bottomSheetData.timeString}
                </div>
              </div>
              <button
                onClick={() => setShowBottomSheet(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-4">
              <button
                onClick={() => handleBottomSheetOption('appointment')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">New appointment</div>
                  <div className="text-sm text-gray-500">Create a new appointment</div>
                </div>
              </button>

              <button
                onClick={() => handleBottomSheetOption('task')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Personal task</div>
                  <div className="text-sm text-gray-500">Create a personal task</div>
                </div>
              </button>

              <button
                onClick={() => handleBottomSheetOption('working-hours')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Edit working hours</div>
                  <div className="text-sm text-gray-500">Edit your calendar working hours</div>
                </div>
              </button>
            </div>

            {/* Bottom padding for mobile */}
            <div className="h-4"></div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmAction.type === 'delete' ? 'bg-red-100' :
                  confirmAction.type === 'park' ? 'bg-yellow-100' :
                  confirmAction.type === 'unpark' ? 'bg-green-100' :
                  'bg-blue-100'
                }`}>
                  {confirmAction.type === 'delete' ? (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  ) : confirmAction.type === 'park' ? (
                    <Pause className="w-5 h-5 text-yellow-600" />
                  ) : confirmAction.type === 'unpark' ? (
                    <Play className="w-5 h-5 text-green-600" />
                  ) : (
                    <Edit className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {confirmAction.type === 'delete' ? 'Delete Appointment' :
                     confirmAction.type === 'park' ? 'Park Appointment' :
                     confirmAction.type === 'unpark' ? 'Unpark Appointment' :
                     'Edit Appointment'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {confirmAction.type === 'delete' ? 'Are you sure you want to delete this appointment? This action cannot be undone.' :
                     confirmAction.type === 'park' ? 'Are you sure you want to park this appointment? It will be moved to the parked section.' :
                     confirmAction.type === 'unpark' ? 'Are you sure you want to unpark this appointment? It will be moved back to active appointments.' :
                     'Are you sure you want to edit this appointment?'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setConfirmAction(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                    confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                    confirmAction.type === 'park' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    confirmAction.type === 'unpark' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmAction.type === 'delete' ? 'Delete' :
                   confirmAction.type === 'park' ? 'Park' :
                   confirmAction.type === 'unpark' ? 'Unpark' :
                   'Edit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <CreateAppointmentForm
          onClose={() => {
            setShowEditModal(false)
            setSelectedAppointment(null)
          }}
          appointment={selectedAppointment}
          onSubmit={handleUpdateAppointment}
          isEditing={true}
        />
      )}


    </div>
  )
}

export default CustomCalendar 