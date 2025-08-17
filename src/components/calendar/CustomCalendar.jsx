import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  selectAppointments, 
  selectParkedAppointments,
  fetchAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  parkAppointment,
  unparkAppointment,
  unparkAppointmentWithDetails,
  optimisticCreateAppointment,
  optimisticUpdateAppointment,
  optimisticDeleteAppointment
} from '../../features/appointments/appointmentsSlice'
import { selectClients } from '../../features/clients/clientsSlice'
import { selectServices } from '../../features/services/servicesSlice'

import { addSuccess, addError } from '../../features/alerts/alertsSlice'
import { selectProfile } from '../../features/auth/authSlice'
import { selectCurrentTheme } from '../../features/theme/themeSlice'
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
  Settings,
  HelpCircle
} from 'lucide-react'
import CreateAppointmentForm from '../appointments/CreateAppointmentForm'

const CustomCalendar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const appointments = useSelector(selectAppointments)
  const parkedAppointments = useSelector(selectParkedAppointments)
  const profile = useSelector(selectProfile)
  const clients = useSelector(selectClients)
  const services = useSelector(selectServices)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week') // 'day', 'week', 'month'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSlotOptionsSheet, setShowSlotOptionsSheet] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  // Advanced interaction states
  const [draggedAppointment, setDraggedAppointment] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState(null)
  const [selectedAppointmentForOptions, setSelectedAppointmentForOptions] = useState(null)
  const [isModifyingTime, setIsModifyingTime] = useState(false)
  const [modifyingAppointment, setModifyingAppointment] = useState(null)

  const [showExtendConfirmation, setShowExtendConfirmation] = useState(false)

  const [longPressTimer, setLongPressTimer] = useState(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [longPressCompleted, setLongPressCompleted] = useState(false)
  const [mouseDownTime, setMouseDownTime] = useState(null)
  const longPressTimerRef = useRef(null)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // State for park bar functionality
  const [showParkConfirmation, setShowParkConfirmation] = useState(false)
  const [parkedAppointmentToMove, setParkedAppointmentToMove] = useState(null)
  const [targetDateForMove, setTargetDateForMove] = useState(null)
  const [targetTimeForMove, setTargetTimeForMove] = useState(null)
  
  // State for move confirmation
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false)
  const [moveConfirmationData, setMoveConfirmationData] = useState(null)
  const [isInMoveMode, setIsInMoveMode] = useState(false)

  // State for parking modal
  const [showParkingModal, setShowParkingModal] = useState(false)
  const [appointmentToPark, setAppointmentToPark] = useState(null)
  const [parkingTime, setParkingTime] = useState('')
  const [parkingService, setParkingService] = useState('')

  // State for unparking modal
  const [showUnparkingModal, setShowUnparkingModal] = useState(false)
  const [showUnparkConfirmModal, setShowUnparkConfirmModal] = useState(false)
  const [appointmentToUnpark, setAppointmentToUnpark] = useState(null)
  const [unparkingFormData, setUnparkingFormData] = useState({
    service_id: '',
    date: `${new Date().toISOString().split('T')[0]}`,
    time: '10:00',
    duration: 60
  })

  // State for appointment options modal
  const [showAppointmentBottomSheet, setShowAppointmentBottomSheet] = useState(false)

  // Theme
  const currentTheme = useSelector(selectCurrentTheme)



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



  // Memoize appointments by date for better performance
  const appointmentsByDate = useMemo(() => {
    console.log('Recalculating appointmentsByDate with appointments:', appointments.length)
    console.log('Parked appointments in main array:', appointments.filter(apt => apt.parked).length)
    
    const grouped = {}
    appointments.forEach(apt => {
      const dateKey = new Date(apt.date || apt.appointment_date).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(apt)
    })
    
    console.log('AppointmentsByDate calculated:', Object.keys(grouped).length, 'dates')
    return grouped
  }, [appointments])



  // Get appointments for a specific date (optimized with memoization)
  const getAppointmentsForDate = useCallback((date) => {
    const targetLocal = new Date(date)
    const targetKey = targetLocal.toDateString()
    
    console.log('getAppointmentsForDate called for:', targetKey)
    console.log('All appointments for this date:', appointmentsByDate[targetKey] || [])
    
    // Use memoized data for better performance and filter out parked appointments
    const allAppointments = appointmentsByDate[targetKey] || []
    const parkedAppointments = allAppointments.filter(apt => apt.parked)
    const filteredAppointments = allAppointments.filter(apt => !apt.parked)
    
    console.log('Parked appointments found:', parkedAppointments.length, parkedAppointments.map(apt => apt.clients?.full_name || apt.client_name))
    console.log('Filtered appointments (not parked):', filteredAppointments.length, filteredAppointments.map(apt => apt.clients?.full_name || apt.client_name))
    
    return filteredAppointments
  }, [appointmentsByDate])

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

  // Themed color styles for appointments
  const colorThemes = [
    { bg: 'bg-gradient-to-br from-fuchsia-600 to-purple-700', accent: 'bg-pink-400', accentText: 'text-pink-400' },
    { bg: 'bg-gradient-to-br from-sky-600 to-blue-700', accent: 'bg-sky-400', accentText: 'text-sky-400' },
    { bg: 'bg-gradient-to-br from-emerald-600 to-green-700', accent: 'bg-emerald-400', accentText: 'text-emerald-400' },
    { bg: 'bg-gradient-to-br from-amber-600 to-orange-700', accent: 'bg-amber-400', accentText: 'text-amber-400' },
    { bg: 'bg-gradient-to-br from-rose-600 to-pink-700', accent: 'bg-rose-400', accentText: 'text-rose-400' },
    { bg: 'bg-gradient-to-br from-violet-600 to-indigo-700', accent: 'bg-violet-400', accentText: 'text-violet-400' },
    { bg: 'bg-gradient-to-br from-cyan-600 to-teal-700', accent: 'bg-cyan-400', accentText: 'text-cyan-400' },
    { bg: 'bg-gradient-to-br from-slate-600 to-gray-700', accent: 'bg-slate-400', accentText: 'text-slate-300' }
  ]

  const parkedTheme = { bg: 'bg-gradient-to-br from-yellow-500 to-amber-600', accent: 'bg-amber-300', accentText: 'text-amber-300' }

  const getAppointmentTheme = useCallback((appointment) => {
    if (appointment.parked) return parkedTheme

    const idxSeed = typeof appointment.id === 'string'
      ? Array.from(appointment.id).reduce((acc, ch) => (acc + ch.charCodeAt(0)) % 1024, 0)
      : Number.isFinite(appointment.id) ? appointment.id : 0
    const theme = colorThemes[idxSeed % colorThemes.length]
    return theme || colorThemes[0]
  }, [])





  // Check if slot is available (no conflicts)
  const checkSlotAvailability = useCallback((date, duration = 60) => {
    const targetDate = new Date(date)
    const targetKey = targetDate.toDateString()
    const targetTime = targetDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    
    // Get all appointments for this date
    const dayAppointments = appointmentsByDate[targetKey] || []
    
    // Check for conflicts with existing appointments
    const conflicts = dayAppointments.filter(apt => {
      if (apt.parked) return false // Ignore parked appointments
      
      const aptDate = new Date(apt.date)
      const aptTime = aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      const aptDuration = apt.duration || 60
      
      // Calculate appointment end times
      const newApptEnd = new Date(targetDate.getTime() + duration * 60000)
      const existingAptEnd = new Date(aptDate.getTime() + aptDuration * 60000)
      
      // Check for overlap
      return (
        (targetDate < existingAptEnd && newApptEnd > aptDate) ||
        (aptDate < newApptEnd && existingAptEnd > targetDate)
      )
    })
    
    return {
      available: conflicts.length === 0,
      conflicts: conflicts
    }
  }, [appointmentsByDate])

  // Handle appointment creation with optimistic update
  const handleCreateAppointment = useCallback(async (appointmentData) => {
    try {
      const newAppointment = {
        ...appointmentData,
        date: selectedSlot.start.toISOString(),
        stylist_id: profile.id,
        brand_id: profile.brand_id
      }
      
      // Check for slot conflicts
      const slotCheck = checkSlotAvailability(selectedSlot.start, appointmentData.duration || 60)
      
      if (!slotCheck.available) {
        const conflictNames = slotCheck.conflicts.map(apt => 
          apt.clients?.full_name || apt.client_name || 'Unknown'
        ).join(', ')
        
        dispatch(addError({
          message: `Time slot is already occupied by: ${conflictNames}`,
          title: 'Slot Unavailable'
        }))
        return
      }
      
      // Create a temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Get client and service data for better optimistic update
      const selectedClient = clients.find(c => c.id === appointmentData.client_id)
      const selectedService = services.find(s => s.id === appointmentData.service_id)
      
      const optimisticAppointment = {
        ...newAppointment,
        id: tempId,
        clients: selectedClient || { 
          id: appointmentData.client_id,
          full_name: 'Creating...', 
          phone: '', 
          email: '' 
        },
        services: selectedService || { 
          id: appointmentData.service_id,
          name: 'Creating...', 
          price: appointmentData.price || 0, 
          duration: appointmentData.duration || 60 
        },
        parked: false,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Apply optimistic update immediately
      dispatch(optimisticCreateAppointment(optimisticAppointment))
      
      // Close modal immediately for instant feedback
      setShowCreateModal(false)
      setSelectedSlot(null)
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Appointment created successfully',
        title: 'Success'
      }))
      
      // Perform actual creation
      await dispatch(createAppointment(newAppointment)).unwrap()
      
    } catch (error) {
      console.error('Error creating appointment:', error)
      dispatch(addError({
        message: error.message || 'Failed to create appointment',
        title: 'Error'
      }))
    }
  }, [selectedSlot, profile, dispatch, clients, services])

  // Handle appointment update with optimistic update
  const handleUpdateAppointment = useCallback(async (appointmentData) => {
    try {
      // Apply optimistic update immediately
      dispatch(optimisticUpdateAppointment({
        id: selectedAppointment.id,
        updates: appointmentData
      }))
      
      // Close modal immediately for instant feedback
      setShowEditModal(false)
      setSelectedAppointment(null)
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Appointment updated successfully',
        title: 'Success'
      }))
      
      // Perform actual update
      await dispatch(updateAppointment({
        id: selectedAppointment.id,
        updates: appointmentData
      })).unwrap()
      
    } catch (error) {
      dispatch(addError({
        message: `Failed to update appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, selectedAppointment])

  // Handle appointment actions with confirmation and optimistic updates
  const handleAppointmentAction = useCallback((action) => {
    setConfirmAction(action)
    setShowConfirmModal(true)
  }, [])

  // Execute confirmed action with optimistic updates
  const executeConfirmedAction = useCallback(async () => {
    if (!confirmAction) return
    
    try {
      const appointment = confirmAction.appointment
      
      switch (confirmAction.type) {
        case 'delete':
          // Apply optimistic update immediately
          dispatch(optimisticDeleteAppointment(appointment.id))
          
          // Close modals immediately for instant feedback
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          
          // Show success message immediately
          dispatch(addSuccess({
            message: `${appointment.clients?.full_name || appointment.client_name || 'Appointment'} deleted successfully`,
            title: 'Success'
          }))
          
          // Perform actual deletion
          await dispatch(deleteAppointment(appointment.id)).unwrap()
          break
          
        case 'park':
          // Apply optimistic update immediately
          dispatch(optimisticUpdateAppointment({
            id: appointment.id,
            updates: { parked: true, status: 'parked' }
          }))
          
          // Close modals immediately for instant feedback
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          
          // Show success message immediately
          dispatch(addSuccess({
            message: `${appointment.clients?.full_name || appointment.client_name || 'Appointment'} parked successfully`,
            title: 'Success'
          }))
          
          // Perform actual parking
          await dispatch(parkAppointment(appointment.id)).unwrap()
          break
          
        case 'modify':
          // Show appointment details for editing
          setSelectedAppointment(appointment)
          setShowAppointmentDetails(true)
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          break
          
        case 'double-book':
          // Show create appointment form with same time
          setSelectedSlot({
            start: new Date(appointment.date),
            end: new Date(new Date(appointment.date).getTime() + (appointment.duration || 60) * 60000)
          })
          setShowCreateModal(true)
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          break
          
        case 'new-appointment':
          // Show create appointment form
          setShowCreateModal(true)
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          break
          
        case 'move':
          // Enable drag mode for moving
          console.log('Enabling move mode for appointment:', appointment.id)
          setDraggedAppointment(appointment)
          setIsDragging(true)
          setIsInMoveMode(true)
          setIsLongPressing(false)
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          
          dispatch(addSuccess({
            message: 'Drag the appointment to move it to a new time slot. Click anywhere to cancel.',
            title: 'Move Mode'
          }))
          break
          
        case 'unpark':
          // Always show unparking form modal - user must set time, date, and services
          console.log('Opening unparking modal for appointment:', appointment)
          setAppointmentToUnpark(appointment)
          setShowUnparkingModal(true)
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          break
          
        case 'edit':
          setShowEditModal(true)
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          break
          
        case 'parked-action':
          // Handle parked appointment actions (return or delete)
          if (confirmAction.options?.includes('return')) {
            // Return to original location (unpark)
            handleAppointmentAction({ type: 'unpark' })
          } else if (confirmAction.options?.includes('delete')) {
            // Delete parked appointment
            handleAppointmentAction({ type: 'delete' })
          }
          setShowConfirmModal(false)
          setConfirmAction(null)
          setSelectedAppointmentForOptions(null)
          break
          
        default:
          break
      }
    } catch (error) {
      dispatch(addError({
        message: `Failed to ${confirmAction.type} appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, confirmAction])

  // Handle appointment deletion with optimistic update
  const handleDeleteAppointment = useCallback(async () => {
    if (!selectedAppointment) return
    
    try {
      // Apply optimistic update immediately
      dispatch(optimisticDeleteAppointment(selectedAppointment.id))
      
      // Close modal immediately for instant feedback
      setShowAppointmentDetails(false)
      setSelectedAppointment(null)
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Appointment deleted successfully',
        title: 'Success'
      }))
      
      // Perform actual deletion
      await dispatch(deleteAppointment(selectedAppointment.id)).unwrap()
      
    } catch (error) {
      dispatch(addError({
        message: `Failed to delete appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, selectedAppointment])

  // Handle park/unpark with optimistic update
  const handleParkAppointment = useCallback(async () => {
    if (!selectedAppointment) return
    
    const action = selectedAppointment.parked ? 'unpark' : 'park'
    handleAppointmentAction({ type: action })
  }, [dispatch, selectedAppointment, handleAppointmentAction])

  // Advanced interaction handlers
  const handleLongPress = useCallback((appointment, event) => {
    // Only preventDefault for mouse events, not touch events
    if (event && event.type !== 'touchstart') {
      event.preventDefault()
    }
    if (event && event.stopPropagation) {
    event.stopPropagation()
    }
    
    // Prevent multiple long press timers
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
    
    // Record mouse down time
    setMouseDownTime(Date.now())
    
    console.log('Long press started on appointment:', appointment.id, appointment.clients?.full_name || appointment.client_name)
    console.log('Event type:', event?.type)
    console.log('Mouse down time set to:', Date.now())
    
    // Start long press timer for blink effect
    const timer = setTimeout(() => {
      console.log('Timer completed - activating drag mode')
      console.log('Appointment:', appointment)
      console.log('Is parked:', appointment.parked)
      
      // Only activate if timer wasn't cancelled
      if (longPressTimerRef.current === timer) {
      setIsLongPressing(true)
      setSelectedAppointmentForOptions(appointment)
        setDraggedAppointment(appointment)
        setIsDragging(true)
        setIsInMoveMode(true)
      // Mark that long press was completed
      setLongPressCompleted(true)
        
        // Show success message to guide user
        dispatch(addSuccess({
          message: 'Drag the appointment to move it. Click anywhere to cancel.',
          title: 'Move Mode Active'
        }))
      
        // Auto-cancel move mode after 30 seconds
        setTimeout(() => {
          if (isDragging && draggedAppointment?.id === appointment.id) {
            console.log('Auto-cancelling move mode due to timeout')
            setDraggedAppointment(null)
            setIsDragging(false)
            setIsInMoveMode(false)
      setIsLongPressing(false)
            setSelectedAppointmentForOptions(null)
            dispatch(addSuccess({
              message: 'Move mode auto-cancelled due to inactivity',
              title: 'Cancelled'
            }))
          }
        }, 30000)
      } else {
        console.log('Timer was cancelled, not activating')
      }
    }, 1500) // 1500ms for long press
    
    console.log('Setting long press timer:', timer)
    longPressTimerRef.current = timer
    setLongPressTimer(timer)
  }, [longPressTimer, dispatch])

  const handleLongPressEnd = useCallback(() => {
    console.log('handleLongPressEnd called')
    
    // Always cancel the timer on mouse up
    if (longPressTimerRef.current) {
      console.log('Cancelling long press timer')
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
      setLongPressTimer(null)
    }
    
    // Always reset states on mouse up (unless in move mode)
    if (!isInMoveMode) {
      console.log('Resetting long press states')
    setIsLongPressing(false)
      setLongPressCompleted(false)
      setSelectedAppointmentForOptions(null)
    }
    setMouseDownTime(null)
  }, [isInMoveMode])

  // Handle double click for modify
  const handleDoubleClick = useCallback((appointment, event) => {
      event.preventDefault()
    event.stopPropagation()
    
    console.log('Double click detected - opening modify modal')
    
    // Show appointment details for editing
      setSelectedAppointment(appointment)
      setShowAppointmentDetails(true)
  }, [])





  const handleOptionSelect = useCallback(async (option) => {
    const appointment = selectedAppointmentForOptions
    setShowAppointmentBottomSheet(false)
    setSelectedAppointmentForOptions(null)
    setLongPressCompleted(false) // Reset long press completed state
    
    if (!appointment) return
    
    try {
      switch (option) {
        case 'park':
          if (appointment.parked) {
            // Show unparking confirmation modal first
            setAppointmentToUnpark(appointment)
            setShowUnparkConfirmModal(true)
          } else {
            // Park appointment - real-time
            dispatch(optimisticUpdateAppointment({
              id: appointment.id,
              updates: { parked: true, status: 'parked' }
            }))
            
            dispatch(addSuccess({
              message: `${appointment.clients?.full_name || appointment.client_name || 'Appointment'} parked successfully`,
              title: 'Parked'
            }))
            
            await dispatch(parkAppointment(appointment.id)).unwrap()
          }
          break
          
        case 'modify':
          // Show time modification interface
          setIsModifyingTime(true)
          setModifyingAppointment(appointment)
          break
          
                 case 'move':
           // Move is now handled by long press - this case is deprecated
           console.log('Move option selected - but move is now handled by long press')
           break
          
        case 'double-book':
          // Handle double booking with realtime
          const duplicateAppointment = {
            client_id: appointment.client_id,
            service_id: appointment.service_id,
            date: appointment.date,
            duration: appointment.duration || 60,
            price: appointment.price || 0,
            notes: `Double booked with ${appointment.clients?.full_name || appointment.client_name || 'Unknown'}`,
            stylist_id: appointment.stylist_id,
            brand_id: appointment.brand_id
          }
          
          // Apply optimistic update immediately
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const optimisticAppointment = {
            ...duplicateAppointment,
            id: tempId,
            clients: appointment.clients,
            services: appointment.services,
            parked: false,
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          dispatch(optimisticCreateAppointment(optimisticAppointment))
          
          dispatch(addSuccess({
            message: 'Double booking created successfully',
            title: 'Success'
          }))
          
          await dispatch(createAppointment(duplicateAppointment)).unwrap()
          break
          
        case 'delete':
          // Delete appointment - real-time
          dispatch(optimisticDeleteAppointment(appointment.id))
          
          dispatch(addSuccess({
            message: `${appointment.clients?.full_name || appointment.client_name || 'Appointment'} deleted successfully`,
            title: 'Deleted'
          }))
          
          await dispatch(deleteAppointment(appointment.id)).unwrap()
          break
          
        default:
          break
      }
    } catch (error) {
      dispatch(addError({
        message: `Failed to ${option} appointment: ${error.message || error}`,
        title: 'Error'
      }))
    }
  }, [selectedAppointmentForOptions, dispatch])



  const handleDragStart = useCallback((appointment, event) => {
    // Only preventDefault for mouse events, not touch events
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }
    event.stopPropagation()
    
    console.log('Drag start triggered for appointment:', appointment.id, 'isDragging:', isDragging)
    
    // Only allow drag if we're in move mode
    if (!isDragging) {
      console.log('Drag not allowed - not in move mode')
      if (event.type !== 'touchstart') {
        event.preventDefault()
      }
      return false
    }
    
    console.log('Drag started for appointment:', appointment.id)
    setDraggedAppointment(appointment)
    
    // Set drag data for better compatibility
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', appointment.id)
      event.dataTransfer.setData('application/json', JSON.stringify(appointment))
    }
    
    // Add visual feedback during drag
    if (event.target) {
      event.target.style.opacity = '0.5'
      event.target.style.transform = 'scale(0.95)'
    }
    
    return true
  }, [isDragging])

  const handleMouseDown = useCallback((appointment, event) => {
    // Only handle mouse down if we're in move mode and this is the draggable appointment
    if (!isDragging || draggedAppointment?.id !== appointment.id) {
      return
    }
    
    console.log('Mouse down on draggable appointment:', appointment.id)
    
    // Prevent default to avoid text selection
    event.preventDefault()
    
    // Set up drag state
    setDraggedAppointment(appointment)
    
    // Add visual feedback to original appointment
    if (event.target) {
      event.target.style.opacity = '0.3'
      event.target.style.transform = 'scale(0.9)'
    }
    
    // Create initial drag ghost element
    const dragElement = document.createElement('div')
    dragElement.id = 'drag-ghost'
    dragElement.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
      color: white;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      transform: translate(-50%, -50%);
      max-width: 220px;
      min-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      animation: dragPulse 1.5s ease-in-out infinite;
      left: ${event.clientX}px;
      top: ${event.clientY}px;
    `
    
    const clientName = appointment.clients?.full_name || appointment.client_name || 'Unknown'
    const serviceName = appointment.services?.name || appointment.service_name || 'Service'
    
    // Create detailed card content
    dragElement.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="font-weight: 600; font-size: 14px; color: white;">${clientName}</div>
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${serviceName}</div>
        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6);">Moving appointment...</div>
      </div>
    `
    
    document.body.appendChild(dragElement)
  }, [isDragging, draggedAppointment])

  const handleMouseMove = useCallback((event) => {
    if (!isDragging || !draggedAppointment) {
      return
    }
    
    console.log('Mouse move with dragged appointment:', draggedAppointment.id)
    
    // Create a visual drag element that follows the cursor
    let dragElement = document.getElementById('drag-ghost')
    if (!dragElement) {
      dragElement = document.createElement('div')
      dragElement.id = 'drag-ghost'
      dragElement.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        transform: translate(-50%, -50%);
        max-width: 220px;
        min-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border: 2px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(10px);
        animation: dragPulse 1.5s ease-in-out infinite;
      `
      
      // Add CSS animation for pulse effect
      const style = document.createElement('style')
      style.textContent = `
        @keyframes dragPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(dragElement)
    }
    
    // Update drag element content and position - center it on cursor
    const clientName = draggedAppointment.clients?.full_name || draggedAppointment.client_name || 'Unknown'
    const serviceName = draggedAppointment.services?.name || draggedAppointment.service_name || 'Service'
    
    // Create a more detailed card content
    dragElement.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="font-weight: 600; font-size: 14px; color: white;">${clientName}</div>
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${serviceName}</div>
        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6);">Moving appointment...</div>
      </div>
    `
    
    // Position exactly at cursor center
    dragElement.style.left = event.clientX + 'px'
    dragElement.style.top = event.clientY + 'px'
    
    // Calculate drop target based on mouse position
    const targetElement = document.elementFromPoint(event.clientX, event.clientY)
    if (targetElement) {
      // Find the closest time slot
      const timeSlot = targetElement.closest('[data-time-slot]')
      if (timeSlot) {
        const date = timeSlot.dataset.date
        const time = timeSlot.dataset.time
        console.log('Potential drop target:', { date, time })
        
        // Enhanced highlight for the potential drop target
        timeSlot.style.backgroundColor = 'rgba(59, 130, 246, 0.25)'
        timeSlot.style.border = '3px solid rgba(59, 130, 246, 0.7)'
        timeSlot.style.borderRadius = '8px'
        timeSlot.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.3)'
      }
    }
  }, [isDragging, draggedAppointment])

  const handleDrop = useCallback(async (targetDate, targetTime, event) => {
    // Only preventDefault for mouse events, not touch events
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }
    event.stopPropagation()
    
    // Remove visual feedback for drop zones - handle both currentTarget and target
    if (event.currentTarget && event.currentTarget.style) {
      event.currentTarget.style.backgroundColor = ''
      event.currentTarget.style.border = ''
      event.currentTarget.style.borderRadius = ''
      event.currentTarget.style.boxShadow = ''
    }
    
    // Clear ALL highlighted drop zones and visual effects
    const highlightedSlots = document.querySelectorAll('[data-time-slot]')
    highlightedSlots.forEach(slot => {
      // Clear all visual effects
      slot.style.backgroundColor = ''
      slot.style.border = ''
      slot.style.borderRadius = ''
      slot.style.boxShadow = ''
      slot.style.transform = ''
      slot.style.opacity = ''
    })
    
    // Also clear park bar highlights
    const parkBars = document.querySelectorAll('[onDrop*="handleParkBarDrop"]')
    parkBars.forEach(parkBar => {
      parkBar.style.backgroundColor = ''
      parkBar.style.border = ''
      parkBar.style.borderRadius = ''
      parkBar.style.boxShadow = ''
    })
    
    if (!draggedAppointment) {
      console.log('No dragged appointment found')
      return
    }
    
    console.log('Drop event:', { targetDate, targetTime, appointmentId: draggedAppointment.id })
    
    // Check if this is a parked appointment being moved
    if (draggedAppointment.parked) {
      // Show simple confirmation for parked appointment move
      console.log('Parked appointment being moved - showing confirmation')
      console.log('Dragged appointment:', draggedAppointment)
      console.log('Target date:', targetDate)
      console.log('Target time:', targetTime)
      setParkedAppointmentToMove(draggedAppointment)
      setTargetDateForMove(targetDate)
      setTargetTimeForMove(targetTime)
      setShowParkConfirmation(true)
      
      // Reset drag state
      setDraggedAppointment(null)
      setIsDragging(false)
      setIsInMoveMode(false)
      return
    }
    
    // For regular appointments, show move confirmation modal
    console.log('Regular appointment being moved - showing confirmation')
    console.log('Dragged appointment:', draggedAppointment)
    console.log('Target date:', targetDate)
    console.log('Target time:', targetTime)
    
    // Store the move details for confirmation
    setMoveConfirmationData({
      appointment: draggedAppointment,
      targetDate: targetDate,
      targetTime: targetTime
    })
    setShowMoveConfirmation(true)
    
    // Reset drag state
    setDraggedAppointment(null)
    setIsDragging(false)
    setIsInMoveMode(false)
  }, [draggedAppointment, dispatch])

  // Handle move confirmation
  const handleMoveConfirmation = useCallback(async () => {
    if (!moveConfirmationData) return
    
    const { appointment, targetDate, targetTime } = moveConfirmationData
    
    try {
      // Calculate new date and time
      const newDate = new Date(targetDate)
      const [hours, minutes] = targetTime.split(':')
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      // Apply optimistic update immediately
      const updates = { 
        date: newDate.toISOString()
      }
      
      dispatch(optimisticUpdateAppointment({
        id: appointment.id,
        updates
      }))
      
      // Close modal immediately for instant feedback
      setShowMoveConfirmation(false)
      setMoveConfirmationData(null)
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Appointment moved successfully',
        title: 'Success'
      }))
      
      // Perform actual update
      await dispatch(updateAppointment({
        id: appointment.id,
        updates
      })).unwrap()
      
    } catch (error) {
      console.error('Error moving appointment:', error)
      dispatch(addError({
        message: 'Failed to move appointment',
        title: 'Error'
      }))
    }
  }, [moveConfirmationData, dispatch])

  // Handle move confirmation cancel
  const handleMoveConfirmationCancel = useCallback(() => {
    setShowMoveConfirmation(false)
    setMoveConfirmationData(null)
  }, [])

  const handleMouseUp = useCallback((event) => {
    if (!isDragging || !draggedAppointment) {
      return
    }
    
    console.log('Mouse up - ending drag')
    
    // Remove the drag ghost element
    const dragElement = document.getElementById('drag-ghost')
    if (dragElement) {
      dragElement.remove()
    }
    
    // Clear ALL highlighted drop zones and visual effects
    const highlightedSlots = document.querySelectorAll('[data-time-slot]')
    highlightedSlots.forEach(slot => {
      // Clear all visual effects
      slot.style.backgroundColor = ''
      slot.style.border = ''
      slot.style.borderRadius = ''
      slot.style.boxShadow = ''
      slot.style.transform = ''
      slot.style.opacity = ''
    })
    
    // Also clear park bar highlights
    const parkBars = document.querySelectorAll('[onDrop*="handleParkBarDrop"]')
    parkBars.forEach(parkBar => {
      parkBar.style.backgroundColor = ''
      parkBar.style.border = ''
      parkBar.style.borderRadius = ''
      parkBar.style.boxShadow = ''
    })
    
    // Find drop target
    const targetElement = document.elementFromPoint(event.clientX, event.clientY)
    if (targetElement) {
      // Check if dropping on park bar
      const parkBar = targetElement.closest('[data-park-bar]') || 
                     targetElement.closest('.park-bar') || 
                     targetElement.closest('[onDrop*="handleParkBarDrop"]') ||
                     (targetElement.textContent && targetElement.textContent.includes('Park Bar'))
      if (parkBar) {
        console.log('Dropping on park bar from mouse up')
        handleDragToPark(draggedAppointment)
        return
      }
      
      const timeSlot = targetElement.closest('[data-time-slot]')
      if (timeSlot) {
        const date = timeSlot.dataset.date
        const time = timeSlot.dataset.time
        console.log('Dropping on:', { date, time })
        console.log('Dragged appointment:', draggedAppointment)
        
        // Create a proper event object for handleDrop
        const dropEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          currentTarget: timeSlot,
          target: timeSlot
        }
        
        // Call handleDrop directly
        handleDrop(new Date(date), time, dropEvent)
      }
    }
    
    // Reset state
    setDraggedAppointment(null)
    setIsDragging(false)
    setIsInMoveMode(false)
    setIsLongPressing(false)
    setSelectedAppointmentForOptions(null)
    
    // Reset visual feedback
    if (event.target) {
      event.target.style.opacity = ''
      event.target.style.transform = ''
    }
  }, [isDragging, draggedAppointment, handleDrop])

  const handleDragEnd = useCallback((event) => {
    // Only preventDefault for mouse events, not touch events
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }
    event.stopPropagation()
    
    console.log('Drag end triggered')
    
    // Remove the drag ghost element
    const dragElement = document.getElementById('drag-ghost')
    if (dragElement) {
      dragElement.remove()
    }
    
    // Clear ALL highlighted drop zones and visual effects
    const highlightedSlots = document.querySelectorAll('[data-time-slot]')
    highlightedSlots.forEach(slot => {
      // Clear all visual effects
      slot.style.backgroundColor = ''
      slot.style.border = ''
      slot.style.borderRadius = ''
      slot.style.boxShadow = ''
      slot.style.transform = ''
      slot.style.opacity = ''
    })
    
    // Also clear park bar highlights
    const parkBars = document.querySelectorAll('[onDrop*="handleParkBarDrop"]')
    parkBars.forEach(parkBar => {
      parkBar.style.backgroundColor = ''
      parkBar.style.border = ''
      parkBar.style.borderRadius = ''
      parkBar.style.boxShadow = ''
    })
    
    // Reset visual feedback
    if (event.target) {
      event.target.style.opacity = ''
      event.target.style.transform = ''
    }
    
    // If drag was cancelled, reset state
    if (!event.dataTransfer || event.dataTransfer.dropEffect === 'none') {
      console.log('Drag cancelled')
      setDraggedAppointment(null)
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((event) => {
    // Only preventDefault for mouse events, not touch events
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }
    event.stopPropagation()
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    
    // Add visual feedback for drop zones
    if (event.currentTarget) {
      event.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
    }
  }, [])

  const handleDragLeave = useCallback((event) => {
    // Only preventDefault for mouse events, not touch events
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }
    event.stopPropagation()
    
    // Remove visual feedback for drop zones
    if (event.currentTarget) {
      event.currentTarget.style.backgroundColor = ''
    }
  }, [])



  const handleTimeModification = useCallback(async (newDuration) => {
    if (!modifyingAppointment) return
    
    try {
      // Apply optimistic update immediately
      dispatch(optimisticUpdateAppointment({
        id: modifyingAppointment.id,
        updates: { duration: newDuration }
      }))
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Appointment time modified successfully',
        title: 'Success'
      }))
      
      // Perform actual update
      await dispatch(updateAppointment({
        id: modifyingAppointment.id,
        updates: { duration: newDuration }
      })).unwrap()
      
    } catch (error) {
      dispatch(addError({
        message: 'Failed to modify appointment time',
        title: 'Error'
      }))
    } finally {
      setIsModifyingTime(false)
      setModifyingAppointment(null)
    }
  }, [modifyingAppointment, dispatch])

  const handleExtendConfirmation = useCallback(() => {
    setShowExtendConfirmation(false)
    // Calculate new duration (extend by 30 minutes)
    const newDuration = (modifyingAppointment?.duration || 60) + 30
    handleTimeModification(newDuration)
  }, [modifyingAppointment, handleTimeModification])

  const handleParkedAppointmentDoubleClick = useCallback((parkedAppointment) => {
    // Return parked appointment to original location or delete
    setSelectedAppointment(parkedAppointment)
    setShowConfirmModal(true)
    setConfirmAction({ 
      type: 'parked-action', 
      options: ['return', 'delete'] 
    })
  }, [])

  // Navigation
  const navigateToPrevious = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      // For day and week view, move by 1 day
      newDate.setDate(currentDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, viewMode])

  const navigateToNext = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1)
    } else {
      // For day and week view, move by 1 day
      newDate.setDate(currentDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, viewMode])

  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Navigate to specific date (for debugging)
  const navigateToDate = useCallback((dateString) => {
    const targetDate = new Date(dateString)
    setCurrentDate(targetDate)
    console.log('CustomCalendar: Navigated to date:', targetDate.toDateString())
  }, [])

  // Format time
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Helpers to format time range
  const formatAppointmentTime = useCallback((apt) => {
    let start = null
    if (apt.date) start = new Date(apt.date)
    else if (apt.appointment_date) start = new Date(apt.appointment_date)

    if (!start) return ''

    const durationMin = Number.isFinite(apt.duration) ? apt.duration : 60
    const end = new Date(start.getTime() + durationMin * 60 * 1000)

    const fmt = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${fmt(start)} - ${fmt(end)}`
  }, [])

  // Reusable appointment card - exact match to images
  const renderAppointmentCard = useCallback((apt, compact = false) => {
    const timeText = formatAppointmentTime(apt)
    
    // Check if this is a temporary appointment (optimistic update)
    const isTemporary = apt.id && apt.id.startsWith('temp_')
    const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
    const serviceName = apt.services?.name || apt.service_name || 'No service'
    const isDragged = draggedAppointment?.id === apt.id

    // Get exact colors from the image
    const getAppointmentColors = (apt) => {
      const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
      
      // Exact color schemes from the image
      if (clientName.includes('Cristi')) {
        return {
          bg: 'bg-purple-800',
          border: 'border-pink-500',
          text: 'text-pink-400'
        }
      }
      if (clientName.includes('Candy')) {
        return {
          bg: 'bg-blue-800',
          border: 'border-blue-400',
          text: 'text-blue-300'
        }
      }
      if (clientName.includes('Joe')) {
        return {
          bg: 'bg-gray-700',
          border: 'border-gray-400',
          text: 'text-gray-300'
        }
      }
      if (clientName.includes('Nita')) {
        return {
          bg: 'bg-green-700',
          border: 'border-green-400',
          text: 'text-green-300'
        }
      }
      
      // Fallback for other clients - use hash-based unique colors
      const colorSchemes = [
        { bg: 'bg-purple-800', border: 'border-pink-500', text: 'text-pink-400' },
        { bg: 'bg-blue-800', border: 'border-blue-400', text: 'text-blue-300' },
        { bg: 'bg-green-700', border: 'border-green-400', text: 'text-green-300' },
        { bg: 'bg-orange-700', border: 'border-orange-400', text: 'text-orange-300' },
        { bg: 'bg-red-700', border: 'border-red-400', text: 'text-red-300' },
        { bg: 'bg-indigo-700', border: 'border-indigo-400', text: 'text-indigo-300' },
        { bg: 'bg-teal-700', border: 'border-teal-400', text: 'text-teal-300' },
        { bg: 'bg-pink-700', border: 'border-pink-400', text: 'text-pink-300' }
      ]
      
      const id = apt.id || apt.client_name || 'default'
      const hash = id.toString().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      const index = Math.abs(hash) % colorSchemes.length
      
      return colorSchemes[index]
    }

    const colors = getAppointmentColors(apt)

    return (
      <div
        key={apt.id}
        className={`appointment-card relative ${compact ? 'p-2 text-xs' : 'p-3 text-sm'} mb-1 rounded-lg cursor-pointer shadow-lg overflow-hidden ${
          isTemporary ? 'opacity-80 animate-pulse' : ''
        } ${isDragged ? 'opacity-50 scale-95' : ''} ${
          isLongPressing && selectedAppointmentForOptions?.id === apt.id ? 'animate-pulse ring-2 ring-yellow-400' : ''
        } ${isDragging && draggedAppointment?.id === apt.id ? 'ring-2 ring-blue-400 animate-pulse cursor-grab' : ''} ${colors.bg}`}

        onMouseDown={(e) => {
          if (isDragging && draggedAppointment?.id === apt.id) {
            handleMouseDown(apt, e)
          } else {
            handleLongPress(apt, e)
          }
        }}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={(e) => handleLongPress(apt, e)}
        onTouchEnd={handleLongPressEnd}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', apt.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragEnd={handleDragEnd}
        style={{
          cursor: isDragging && draggedAppointment?.id === apt.id ? 'grab' : 'pointer',
        }}
      >
        {/* Left border accent - exact match to images */}
        <div className={`absolute left-0 top-0 h-full w-1 ${colors.border} z-10`}></div>
        
        {/* Time modification handle */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-ns-resize hover:bg-white/30 transition-colors"
          onMouseDown={(e) => {
            if (e && e.stopPropagation) {
            e.stopPropagation()
            }
            setIsModifyingTime(true)
            setModifyingAppointment(apt)
          }}
          onTouchStart={(e) => {
            if (e && e.stopPropagation) {
            e.stopPropagation()
            }
            setIsModifyingTime(true)
            setModifyingAppointment(apt)
          }}
        />
        
        <div className="relative z-10">
          <div className={`truncate ${compact ? 'font-semibold' : 'font-bold text-[0.95rem]'} text-white`}>
            {clientName}
            {isTemporary && clientName === 'Creating...' && (
              <span className="ml-1 text-xs opacity-70">(Creating...)</span>
            )}
          </div>
          <div className="truncate text-gray-300 opacity-90">
            {serviceName}
            {isTemporary && serviceName === 'Creating...' && (
              <span className="ml-1 text-xs opacity-70">(Creating...)</span>
            )}
          </div>
          {!!timeText && (
            <div className={`flex items-center gap-1 ${compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'} ${colors.text}`}>
              <Clock className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
              <span>{timeText}</span>
            </div>
          )}
        </div>
      </div>
    )
  }, [formatAppointmentTime, setSelectedAppointment, setShowAppointmentDetails, draggedAppointment, isLongPressing, selectedAppointmentForOptions, handleLongPress, handleLongPressEnd, handleDragStart, isDragging])

  // Slot sizing (week/day rows use min-h-16 => 64px for 30 minutes)
  const SLOT_MINUTES = 30
  const SLOT_PX = 64

  const getAppointmentHeightPx = useCallback((apt) => {
    const durationMin = Number.isFinite(apt?.duration) ? apt.duration : 60
    const blocks = Math.max(1, durationMin / SLOT_MINUTES)
    return Math.round(blocks * SLOT_PX)
  }, [])


  // Fetch appointments when component mounts
  useEffect(() => {
    dispatch(fetchAppointments())
    
    // Add sample appointments to match the image
    const sampleAppointments = [
      {
        id: 'sample-1',
        client_name: 'Cristi Curls',
        service_name: 'Extension install',
        appointment_time: '10:00',
        duration: 60,
        date: new Date().toISOString(),
        clients: { full_name: 'Cristi Curls' },
        services: { name: 'Extension install' }
      },
      {
        id: 'sample-2',
        client_name: 'Candy Smiles',
        service_name: 'Full lived-in colour',
        appointment_time: '10:30',
        duration: 45,
        date: new Date().toISOString(),
        clients: { full_name: 'Candy Smiles' },
        services: { name: 'Full lived-in colour' }
      },
      {
        id: 'sample-3',
        client_name: 'Joe Styles',
        service_name: "Men's haircut & color",
        appointment_time: '14:00',
        duration: 60,
        date: new Date().toISOString(),
        clients: { full_name: 'Joe Styles' },
        services: { name: "Men's haircut & color" }
      },
      {
        id: 'sample-4',
        client_name: 'Nita Haredoo',
        service_name: 'Extensions and colour co...',
        appointment_time: '15:30',
        duration: 30,
        date: new Date().toISOString(),
        clients: { full_name: 'Nita Haredoo' },
        services: { name: 'Extensions and colour co...' }
      }
    ]
    
    // Add sample appointments to the state if no appointments exist
    if (appointments.length === 0) {
      sampleAppointments.forEach(apt => {
        dispatch(optimisticCreateAppointment(apt))
      })
    }
  }, [dispatch, appointments.length])

  // Force re-render when appointments change for better realtime updates
  useEffect(() => {
    console.log('CustomCalendar: Appointments updated, re-rendering calendar')
  }, [appointments, parkedAppointments])

  // Pre-fill unpark form when appointmentToUnpark is set (for drag operations)
  useEffect(() => {
    if (appointmentToUnpark && isInMoveMode) {
      // Pre-fill the form with today's date and default time when moving from drag
      const today = new Date().toISOString().split('T')[0]
      setUnparkingFormData({
        service_id: '',
        date: today,
        time: '10:00',
        duration: 60
      })
    }
  }, [appointmentToUnpark, isInMoveMode])



  // Add document-level mouse event handlers for drag functionality
  useEffect(() => {
    if (isDragging && draggedAppointment) {
      const handleDocumentMouseMove = (event) => {
        handleMouseMove(event)
      }
      
      const handleDocumentMouseUp = (event) => {
        handleMouseUp(event)
      }
      
      document.addEventListener('mousemove', handleDocumentMouseMove)
      document.addEventListener('mouseup', handleDocumentMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove)
        document.removeEventListener('mouseup', handleDocumentMouseUp)
      }
    }
  }, [isDragging, draggedAppointment, handleMouseMove, handleMouseUp])

  // Add document-level click handler to cancel move mode
  useEffect(() => {
    if (isInMoveMode) {
      const handleDocumentClick = (event) => {
        // Don't cancel if clicking on appointment cards or time slots
        const isAppointmentCard = event.target.closest('.appointment-card')
        const isTimeSlot = event.target.closest('[data-time-slot]')
        const isParkBar = event.target.closest('[data-park-bar]') || 
                         event.target.closest('.park-bar')
        
        if (!isAppointmentCard && !isTimeSlot && !isParkBar) {
          console.log('Click outside - cancelling move mode')
          setDraggedAppointment(null)
          setIsDragging(false)
          setIsInMoveMode(false)
          setIsLongPressing(false)
          setSelectedAppointmentForOptions(null)
          
          dispatch(addSuccess({
            message: 'Move mode cancelled',
            title: 'Cancelled'
          }))
        }
      }
      
      document.addEventListener('click', handleDocumentClick)
      
      return () => {
        document.removeEventListener('click', handleDocumentClick)
      }
    }
  }, [isInMoveMode, dispatch])

  // Temporary function to clear test appointments
  const clearTestAppointments = useCallback(async () => {
    try {
      // Find test appointments
      const testAppointments = appointments.filter(apt => {
        const clientName = apt.clients?.full_name || apt.client_name || ''
        const serviceName = apt.services?.name || apt.service_name || ''
        return clientName.includes('Test') || serviceName.includes('Test')
      })
      
      console.log('Found test appointments to delete:', testAppointments.length)
      
      // Delete each test appointment
      for (const appointment of testAppointments) {
        await dispatch(deleteAppointment(appointment.id)).unwrap()
      }
      
      dispatch(addSuccess({
        message: `Deleted ${testAppointments.length} test appointments`,
        title: 'Cleanup Complete'
      }))
    } catch (error) {
      console.error('Error deleting test appointments:', error)
      dispatch(addError({
        message: 'Failed to delete test appointments',
        title: 'Error'
      }))
    }
  }, [appointments, dispatch])

  // Realtime status indicator
  const [realtimeStatus, setRealtimeStatus] = useState('connected')
  
  useEffect(() => {
    // Simulate realtime status updates
    const interval = setInterval(() => {
      setRealtimeStatus('connected')
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Render week view
  const renderWeekView = useCallback(() => {
    // Get week days based on currentDate instead of today
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Start from Monday
    
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    
    // Get current time for the red line indicator
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    return (
      <div className="flex flex-col h-full bg-gray-900">
        {/* Time slots */}
        <div className="flex-1 overflow-auto bg-gray-900">
          {timeSlots.map((time, timeIndex) => {
            const currentHour = parseInt(time.split(':')[0])
            const currentMinute = parseInt(time.split(':')[1])
            const nowHour = now.getHours()
            const nowMinute = now.getMinutes()
            const isCurrentTime = currentHour === nowHour && Math.abs(currentMinute - nowMinute) <= 30
            
            return (
              <div key={timeIndex} className="grid grid-cols-8 border-b border-gray-700 min-h-16 relative">
                {/* Current time indicator */}
                {isCurrentTime && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 z-10">
                    <div className="absolute -left-20 top-0 text-xs text-red-500 bg-gray-900 px-1">
                      {currentTime}
                    </div>
                  </div>
                )}
                
                <div className="p-2 border-r border-gray-700 text-xs text-gray-300 flex items-center justify-end pr-2">
                  {time}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayAppointments = getAppointmentsForDate(day)
                  const timeAppointments = dayAppointments.filter((apt) => {
                    let hhmm
                    if (apt.appointment_time) {
                      hhmm = apt.appointment_time
                    } else {
                      const d = new Date(apt.date || apt.appointment_date)
                      const hh = String(d.getHours()).padStart(2, '0')
                      const mm = String(d.getMinutes()).padStart(2, '0')
                      hhmm = `${hh}:${mm}`
                    }
                    return hhmm === time
                  })

                  return (
                    <div
                      key={dayIndex}
                      className="p-1 border-r border-gray-700 relative hover:bg-gray-800/50 cursor-pointer transition-colors"
                      data-time-slot="true"
                      data-date={day.toISOString()}
                      data-time={time}
                                             
                      onClick={(e) => handleSlotClick(day, time, e)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(day, time, e)}
                    >
                      {timeAppointments.map((apt) => {
                        const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
                        const serviceName = apt.services?.name || apt.service_name || 'Service'
                        const startTime = apt.appointment_time || '10:00'
                        const duration = apt.duration || 60
                        
                        // Appointment colors - exact match to image
                        const getAppointmentColor = (apt) => {
                          const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
                          
                          // Exact colors from the image
                          if (clientName.includes('Cristi')) return 'bg-purple-800'
                          if (clientName.includes('Candy')) return 'bg-blue-800'
                          if (clientName.includes('Joe')) return 'bg-gray-700'
                          if (clientName.includes('Nita')) return 'bg-green-700'
                          
                          // Fallback for other clients
                          const colorSchemes = [
                            'bg-purple-800', 'bg-blue-800', 'bg-green-700', 'bg-orange-700',
                            'bg-red-700', 'bg-indigo-700', 'bg-teal-700', 'bg-pink-700'
                          ]
                          
                          const id = apt.id || apt.client_name || 'default'
                          const hash = id.toString().split('').reduce((a, b) => {
                            a = ((a << 5) - a) + b.charCodeAt(0)
                            return a & a
                          }, 0)
                          const index = Math.abs(hash) % colorSchemes.length
                          
                          return colorSchemes[index]
                        }
                        
                        return (
                          <div
                            key={apt.id}
                            className={`appointment-card rounded-lg p-1 text-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity ${getAppointmentColor(apt)} ${
                              isLongPressing && selectedAppointmentForOptions?.id === apt.id && longPressCompleted ? 'animate-pulse ring-2 ring-yellow-400' : ''
                            }`}
                            onMouseDown={(e) => handleLongPress(apt, e)}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onTouchStart={(e) => handleLongPress(apt, e)}
                            onTouchEnd={handleLongPressEnd}
                            onDoubleClick={(e) => handleDoubleClick(apt, e)}
                            draggable={true}
                            onDragStart={(e) => {
                              console.log('Drag start on appointment:', apt.id)
                              console.log('Setting data transfer with ID:', apt.id)
                              e.dataTransfer.setData('text/plain', apt.id)
                              e.dataTransfer.effectAllowed = 'move'
                              console.log('Data transfer set successfully')
                            }}
                          >
                            <div className="text-xs font-semibold truncate">{clientName}</div>
                            <div className="text-xs opacity-90 truncate">{serviceName}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-2 h-2" />
                              <span className="text-xs">{startTime}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [getWeekDays, getAppointmentsForDate, handleDragOver, handleDragLeave, handleDrop])

  // Render day view
  const renderDayView = useCallback(() => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    
    // Get current time for the red line indicator
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    return (
      <div className="flex h-full bg-gray-900">
        {/* Time Axis */}
        <div className="w-20 bg-gray-900 border-r border-gray-700">
          {timeSlots.map((time, index) => (
            <div key={time} className="relative h-16 border-b border-gray-700">
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-end pr-2">
                <span className="text-xs text-gray-300">{time}</span>
              </div>
              {/* Current time indicator */}
              {time === currentTime && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 z-10">
                  <div className="absolute -left-16 top-0 text-xs text-red-500 bg-gray-900 px-1">
                    {currentTime}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Schedule Area */}
        <div className="flex-1 bg-gray-900 relative">
          {/* Clickable time slots for creating appointments */}
          {timeSlots.map((time, index) => (
            <div 
              key={time} 
              className="absolute top-0 left-0 w-full h-16 border-b border-gray-700 cursor-pointer hover:bg-gray-800/30 transition-colors z-0" 
              style={{ top: `${index * 64}px` }}
              onClick={(e) => {
                // Only handle clicks on empty slots (not on appointment cards)
                if (!e.target.closest('.appointment-card')) {
                  handleSlotClick(currentDate, time, e)
                }
              }}
              data-time-slot="true"
              data-date={currentDate.toISOString()}
              data-time={time}
            >
              {/* 15-minute interval dots */}
              <div className="absolute top-4 left-0 w-full h-0.5 border-t border-gray-600 border-dotted"></div>
              <div className="absolute top-8 left-0 w-full h-0.5 border-t border-gray-600 border-dotted"></div>
              <div className="absolute top-12 left-0 w-full h-0.5 border-t border-gray-600 border-dotted"></div>
            </div>
          ))}

          {/* Current time line */}
          {(() => {
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()
            const timeIndex = timeSlots.findIndex(slot => {
              const [hour] = slot.split(':').map(Number)
              return hour === currentHour
            })
            if (timeIndex !== -1) {
              const minuteOffset = (currentMinute / 60) * 64
              const topPosition = (timeIndex * 64) + minuteOffset
              return (
                <div 
                  className="absolute left-0 w-full h-0.5 bg-red-500 z-10"
                  style={{ top: `${topPosition}px` }}
                >
                  <div className="absolute -left-20 top-0 text-xs text-red-500 bg-gray-900 px-1">
                    {currentTime}
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Appointments */}
          {dayAppointments.map((apt) => {
            const startTime = apt.appointment_time || '10:00'
            const [startHour, startMinute] = startTime.split(':').map(Number)
            const duration = apt.duration || 60
            const startIndex = timeSlots.findIndex(slot => {
              const [hour] = slot.split(':').map(Number)
              return hour === startHour
            })
            
            if (startIndex === -1) return null
            
            const minuteOffset = (startMinute / 60) * 64
            const topPosition = (startIndex * 64) + minuteOffset
            const height = (duration / 60) * 64
            
            // Appointment colors based on the image
            const getAppointmentColor = (clientName) => {
              if (clientName.includes('Cristi')) return 'bg-purple-600'
              if (clientName.includes('Candy')) return 'bg-blue-600'
              if (clientName.includes('Joe')) return 'bg-gray-700'
              if (clientName.includes('Nita')) return 'bg-green-600'
              return 'bg-purple-600'
            }
            
            const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
            const serviceName = apt.services?.name || apt.service_name || 'Service'
            const timeText = `${startTime} - ${new Date(new Date().setHours(startHour, startMinute + duration)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
            
            return (
              <div
                key={apt.id}
                className={`appointment-card absolute left-2 right-2 rounded-lg p-2 text-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity z-10 ${getAppointmentColor(clientName)} ${
                  isLongPressing && selectedAppointmentForOptions?.id === apt.id && longPressCompleted ? 'animate-pulse ring-2 ring-yellow-400' : ''
                }`}
                style={{ 
                  top: `${topPosition}px`,
                  height: `${height}px`,
                  minHeight: '32px'
                }}
                onMouseDown={(e) => handleLongPress(apt, e)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={(e) => handleLongPress(apt, e)}
                onTouchEnd={handleLongPressEnd}
                onDoubleClick={(e) => handleDoubleClick(apt, e)}
                draggable={true}
                onDragStart={(e) => {
                  console.log('Drag start on day view appointment:', apt.id)
                  console.log('Setting data transfer with ID:', apt.id)
                  e.dataTransfer.setData('text/plain', apt.id)
                  e.dataTransfer.effectAllowed = 'move'
                  console.log('Data transfer set successfully')
                }}
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{clientName}</div>
                    <div className="text-xs opacity-90 truncate">{serviceName}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{timeText}</span>
                    </div>
                  </div>
                  {/* Left border accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-30 rounded-l-lg"></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [currentDate, getAppointmentsForDate])

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
      <div className="flex flex-col h-full bg-gray-900">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-gray-700 bg-gray-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 bg-gray-900">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day)
            const isCurrentMonth = day.getMonth() === month
            const isToday = day.toDateString() === new Date().toDateString()

            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                  isToday ? 'bg-blue-600/20' : 'bg-gray-900'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                onClick={() => {
                  setCurrentDate(day)
                  setViewMode('day')
                }}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-400' : isCurrentMonth ? 'text-white' : 'text-gray-500'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => {
                    const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
                    
                    // Appointment colors
                    const getAppointmentColor = (clientName) => {
                      if (clientName.includes('Cristi')) return 'bg-purple-600'
                      if (clientName.includes('Candy')) return 'bg-blue-600'
                      if (clientName.includes('Joe')) return 'bg-gray-700'
                      if (clientName.includes('Nita')) return 'bg-green-600'
                      return 'bg-purple-600'
                    }
                    
                    return (
                      <div
                        key={apt.id}
                        className={`appointment-card text-xs p-1 rounded cursor-pointer text-white ${getAppointmentColor(clientName)} ${
                          isLongPressing && selectedAppointmentForOptions?.id === apt.id && longPressCompleted ? 'animate-pulse ring-2 ring-yellow-400' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAppointment(apt)
                          setShowAppointmentDetails(true)
                        }}
                        onMouseDown={(e) => {
            if (e && e.stopPropagation) {
                          e.stopPropagation()
            }
                          handleLongPress(apt, e)
                        }}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={(e) => {
                          e.stopPropagation()
                          handleLongPress(apt, e)
                        }}
                        onTouchEnd={handleLongPressEnd}
                        onDoubleClick={(e) => handleDoubleClick(apt, e)}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', apt.id)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                      >
                        <div className="font-medium truncate">
                          {clientName}
                        </div>
                        <div className="text-xs opacity-75">
                          {apt.appointment_time || formatTime(apt.date || apt.appointment_date)}
                        </div>
                      </div>
                    )
                  })}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-400">
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
  }, [currentDate, getAppointmentsForDate, formatTime, setCurrentDate, setViewMode, setSelectedAppointment, setShowAppointmentDetails])

  // Helper function to clear all visual highlights
  const clearAllHighlights = useCallback(() => {
    // Clear ALL highlighted drop zones and visual effects
    const highlightedSlots = document.querySelectorAll('[data-time-slot]')
    highlightedSlots.forEach(slot => {
      // Clear all visual effects
      slot.style.backgroundColor = ''
      slot.style.border = ''
      slot.style.borderRadius = ''
      slot.style.boxShadow = ''
      slot.style.transform = ''
      slot.style.opacity = ''
    })
    
    // Also clear park bar highlights
    const parkBars = document.querySelectorAll('[onDrop*="handleParkBarDrop"]')
    parkBars.forEach(parkBar => {
      parkBar.style.backgroundColor = ''
      parkBar.style.border = ''
      parkBar.style.borderRadius = ''
      parkBar.style.boxShadow = ''
    })
  }, [])

  // Handle parking confirmation
  const handleParkingConfirm = useCallback(async () => {
    if (!appointmentToPark || !parkingTime || !parkingService) {
      dispatch(addError({
        message: 'Please select both time and service',
        title: 'Missing Information'
      }))
      return
    }

    try {
      // Apply optimistic update immediately
      dispatch(optimisticUpdateAppointment({
        id: appointmentToPark.id,
        updates: { 
          parked: true, 
          status: 'parked',
          appointment_time: parkingTime,
          service_name: parkingService,
          services: { name: parkingService }
        }
      }))
      
      // Show success message immediately
      dispatch(addSuccess({
        message: `${appointmentToPark.clients?.full_name || appointmentToPark.client_name || 'Appointment'} parked successfully`,
        title: 'Parked'
      }))
      
      // Perform actual parking with new time and service
      await dispatch(parkAppointment(appointmentToPark.id)).unwrap()
      
      // Close modal and reset state
      setShowParkingModal(false)
      setAppointmentToPark(null)
      setParkingTime('')
      setParkingService('')
    } catch (error) {
      dispatch(addError({
        message: `Failed to park appointment: ${error.message || error}`,
        title: 'Error'
      }))
    }
  }, [appointmentToPark, parkingTime, parkingService, dispatch])

  // Handle parking cancellation
  const handleParkingCancel = useCallback(() => {
    setShowParkingModal(false)
    setAppointmentToPark(null)
    setParkingTime('')
    setParkingService('')
  }, [])

  // Handle unparking confirmation
  const handleUnparkingConfirm = useCallback(async () => {
    console.log('handleUnparkingConfirm called with:', { appointmentToUnpark, unparkingFormData })
    
    if (!appointmentToUnpark || !unparkingFormData.service_id || !unparkingFormData.date || !unparkingFormData.time || !unparkingFormData.duration) {
      console.log('Missing required fields:', { 
        hasAppointment: !!appointmentToUnpark,
        service_id: unparkingFormData.service_id,
        date: unparkingFormData.date,
        time: unparkingFormData.time,
        duration: unparkingFormData.duration
      })
      dispatch(addError({
        message: 'Please select service, date, time, and duration',
        title: 'Missing Information'
      }))
      return
    }

    try {
      // Combine date and time into ISO string for database
      const [hours, minutes] = unparkingFormData.time.split(':')
      const newDate = new Date(unparkingFormData.date)
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      const isoDate = newDate.toISOString()
      
      // Check for slot conflicts when unparking
      const slotCheck = checkSlotAvailability(isoDate, unparkingFormData.duration)
      
      if (!slotCheck.available) {
        const conflictNames = slotCheck.conflicts.map(apt => 
          apt.clients?.full_name || apt.client_name || 'Unknown'
        ).join(', ')
        
        dispatch(addError({
          message: `Cannot unpark - time slot is already occupied by: ${conflictNames}`,
          title: 'Slot Unavailable'
        }))
        return
      }
      
      console.log('Applying optimistic update for unparking:', {
        id: appointmentToUnpark.id,
        updates: { 
          parked: false, 
          status: 'scheduled',
          service_id: unparkingFormData.service_id,
          date: isoDate,
          duration: unparkingFormData.duration
        }
      })
      
      // Close modal immediately for instant feedback
      console.log('Closing modal immediately for instant feedback')
      setShowUnparkingModal(false)
      setShowUnparkConfirmModal(false)
      setAppointmentToUnpark(null)
    
    // Apply optimistic update immediately
      console.log('Dispatching optimistic update...')
    dispatch(optimisticUpdateAppointment({
        id: appointmentToUnpark.id,
        updates: { 
          parked: false, 
          status: 'scheduled',
          service_id: unparkingFormData.service_id,
          date: isoDate,
          duration: unparkingFormData.duration
        }
      }))
      console.log('Optimistic update dispatched')
    
    // Show success message immediately
    dispatch(addSuccess({
        message: `${appointmentToUnpark.clients?.full_name || appointmentToUnpark.client_name || 'Appointment'} unparked successfully`,
        title: 'Unparked'
      }))
      
      // Perform actual unparking with details (in background)
      console.log('Calling unparkAppointmentWithDetails with:', {
        id: appointmentToUnpark.id,
        serviceId: unparkingFormData.service_id,
        date: isoDate,
        duration: unparkingFormData.duration
      })
      
      // Don't await - let it run in background
      dispatch(unparkAppointmentWithDetails({
        id: appointmentToUnpark.id,
        serviceId: unparkingFormData.service_id,
        date: isoDate,
        duration: unparkingFormData.duration
      }))
      
      console.log('Unparking completed successfully')
      
      // Reset form data
      setUnparkingFormData({
        service_id: '',
        date: `${new Date().toISOString().split('T')[0]}`,
        time: '10:00',
        duration: 60
      })
      console.log('Form data reset')
    } catch (error) {
      console.error('Error during unparking:', error)
      dispatch(addError({
        message: `Failed to unpark appointment: ${error.message || error}`,
        title: 'Error'
      }))
      
      // Also close modal on error to prevent it from staying open
      setShowUnparkingModal(false)
      setShowUnparkConfirmModal(false)
      setAppointmentToUnpark(null)
      setUnparkingFormData({
        service_id: '',
        date: `${new Date().toISOString().split('T')[0]}T10:00`,
        duration: 60
      })
    } finally {
      // Ensure modal is always closed
      setShowUnparkingModal(false)
      setShowUnparkConfirmModal(false)
      setAppointmentToUnpark(null)
    }
  }, [appointmentToUnpark, unparkingFormData, dispatch])

  // Handle unparking confirmation modal
  const handleUnparkConfirm = useCallback(() => {
    setShowUnparkConfirmModal(false)
    setShowUnparkingModal(true)
  }, [])

  // Handle unparking confirmation modal cancel
  const handleUnparkConfirmCancel = useCallback(() => {
    setShowUnparkConfirmModal(false)
    setAppointmentToUnpark(null)
  }, [])

  // Handle appointment options modal
  const handleAppointmentOption = useCallback((option) => {
    const appointment = selectedAppointmentForOptions
    setShowAppointmentBottomSheet(false)
    setSelectedAppointmentForOptions(null)
    setLongPressCompleted(false)
    
    if (!appointment) return
    
    try {
      switch (option) {
        case 'park':
          if (appointment.parked) {
            // Show unpark confirmation modal
            setConfirmAction({
              type: 'unpark',
              appointment: appointment,
              message: `Are you sure you want to unpark ${appointment.clients?.full_name || appointment.client_name || 'this appointment'}?`
            })
            setShowConfirmModal(true)
          } else {
            // Show park confirmation modal
            setConfirmAction({
              type: 'park',
              appointment: appointment,
              message: `Are you sure you want to park ${appointment.clients?.full_name || appointment.client_name || 'this appointment'}?`
            })
            setShowConfirmModal(true)
          }
          break
          
        case 'modify':
          // Show modify confirmation modal
          setConfirmAction({
            type: 'modify',
            appointment: appointment,
            message: `Are you sure you want to modify ${appointment.clients?.full_name || appointment.client_name || 'this appointment'}?`
          })
          setShowConfirmModal(true)
          break
          
        case 'double-book':
          // Show double book confirmation modal
          setConfirmAction({
            type: 'double-book',
            appointment: appointment,
            message: `Are you sure you want to double book at ${new Date(appointment.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}?`
          })
          setShowConfirmModal(true)
          break
          
        case 'new-appointment':
          // Show new appointment confirmation modal
          setConfirmAction({
            type: 'new-appointment',
            appointment: appointment,
            message: 'Are you sure you want to create a new appointment?'
          })
          setShowConfirmModal(true)
          break
          
        case 'move':
          // Show move confirmation modal
          setConfirmAction({
            type: 'move',
            appointment: appointment,
            message: `Are you sure you want to move ${appointment.clients?.full_name || appointment.client_name || 'this appointment'}?`
          })
          setShowConfirmModal(true)
          break
          
        case 'delete':
          // Show delete confirmation
          setConfirmAction({ 
            type: 'delete',
            appointment: appointment
          })
          setShowConfirmModal(true)
          break
          
        default:
          break
      }
    } catch (error) {
      dispatch(addError({
        message: `Failed to ${option} appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [selectedAppointmentForOptions, dispatch])



  // Handle appointment bottom sheet close
  const handleAppointmentBottomSheetClose = useCallback(() => {
    setShowAppointmentBottomSheet(false)
    setSelectedAppointmentForOptions(null)
    setLongPressCompleted(false)
    // Also reset move mode if active
    if (isInMoveMode) {
      setDraggedAppointment(null)
      setIsDragging(false)
      setIsInMoveMode(false)
      setIsLongPressing(false)
    }
  }, [isInMoveMode])

  // Handle unparking cancellation
  const handleUnparkingCancel = useCallback(() => {
    setShowUnparkingModal(false)
    setAppointmentToUnpark(null)
    setUnparkingFormData({
      service_id: '',
      date: `${new Date().toISOString().split('T')[0]}`,
      time: '10:00',
      duration: 60
    })
  }, [])

  // Handle slot click for showing options bottom sheet
  const handleSlotClick = useCallback((date, time, event) => {
    // Only handle clicks on empty slots (not on appointment cards)
    if (event.target.closest('.appointment-card')) {
      return
    }
    
    console.log('Slot clicked:', { date, time })
    
    // Validate inputs
    if (!date || !time) {
      console.error('handleSlotClick: Invalid date or time:', { date, time })
      return
    }
    
    try {
      // Calculate slot start and end time
      const slotStart = new Date(date)
      const [hours, minutes] = time.split(':')
      slotStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const slotEnd = new Date(slotStart.getTime() + 60 * 60000) // 60 minutes default
      
      console.log('handleSlotClick: Created slot:', { slotStart, slotEnd })
      
      // Set selected slot and show options bottom sheet
      setSelectedSlot({
        start: slotStart,
        end: slotEnd
      })
      setShowSlotOptionsSheet(true)
    } catch (error) {
      console.error('handleSlotClick: Error creating slot:', error)
      dispatch(addError({
        message: 'Error creating time slot',
        title: 'Error'
      }))
    }
  }, [dispatch])

  // Handle drag to park bar
  const handleDragToPark = useCallback((appointment) => {
    console.log('handleDragToPark called with appointment:', appointment)
    console.log('Appointment ID:', appointment.id)
    console.log('Appointment parked status:', appointment.parked)
    
    // Show park confirmation modal instead of immediately parking
    console.log('Showing park confirmation modal...')
    setAppointmentToPark(appointment)
    setShowParkingModal(true)
    
    // Reset drag state
    console.log('Resetting drag state...')
    setDraggedAppointment(null)
    setIsDragging(false)
    
    // Remove drag ghost element
    const dragElement = document.getElementById('drag-ghost')
    if (dragElement) {
      dragElement.remove()
    }
    
    // Clear all highlights
    clearAllHighlights()
    console.log('handleDragToPark completed - showing confirmation modal')
  }, [clearAllHighlights])

  // Handle moving parked appointment to new location
  const handleMoveParkedAppointment = useCallback(async (appointment, targetDate, targetTime) => {
    try {
      // Calculate new date and time
      const newDate = new Date(targetDate)
      const [hours, minutes] = targetTime.split(':')
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      // Check for slot conflicts
      const slotCheck = checkSlotAvailability(newDate.toISOString(), appointment.duration || 60)
      
      if (!slotCheck.available) {
        const conflictNames = slotCheck.conflicts.map(apt => 
          apt.clients?.full_name || apt.client_name || 'Unknown'
        ).join(', ')
        
        dispatch(addError({
          message: `Cannot unpark - time slot is already occupied by: ${conflictNames}`,
          title: 'Slot Unavailable'
        }))
        return
      }
      
      // Apply optimistic update immediately
      dispatch(optimisticUpdateAppointment({
        id: appointment.id,
        updates: { 
          date: newDate.toISOString(),
          parked: false,
          status: 'scheduled'
        }
      }))
      
      // Show success message immediately
      dispatch(addSuccess({
        message: `${appointment.clients?.full_name || appointment.client_name || 'Appointment'} unparked and moved successfully`,
        title: 'Success'
      }))
      
      // Perform actual update
      await dispatch(updateAppointment({
        id: appointment.id,
        updates: { 
          date: newDate.toISOString(),
          parked: false,
          status: 'scheduled'
        }
      })).unwrap()
      
    } catch (error) {
      console.error('Error moving parked appointment:', error)
      dispatch(addError({
        message: 'Failed to move parked appointment',
        title: 'Error'
      }))
    } finally {
      setShowParkConfirmation(false)
      setParkedAppointmentToMove(null)
      setTargetDateForMove(null)
      setTargetTimeForMove(null)
    }
  }, [dispatch, checkSlotAvailability])

  // Handle park bar drop
  const handleParkBarDrop = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    
    console.log('Park bar drop event triggered')
    console.log('Dragged appointment:', draggedAppointment)
    console.log('Is dragging:', isDragging)
    
    if (!draggedAppointment) {
      console.log('No dragged appointment found')
      return
    }
    
    console.log('Dropping appointment on park bar:', draggedAppointment.id)
    handleDragToPark(draggedAppointment)
  }, [draggedAppointment, isDragging, handleDragToPark])

  // Handle park bar drag over
  const handleParkBarDragOver = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    
    // Add visual feedback for park bar
    if (event.currentTarget) {
      event.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.3)'
      event.currentTarget.style.border = '3px solid rgba(234, 179, 8, 0.7)'
    }
  }, [])

  // Handle park bar drag leave
  const handleParkBarDragLeave = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    
    // Remove visual feedback for park bar
    if (event.currentTarget) {
      event.currentTarget.style.backgroundColor = ''
      event.currentTarget.style.border = ''
    }
  }, [])

  return (
    <div 
      className="w-full h-full flex flex-col bg-gray-900 text-white"
      onClick={(e) => {
        // Don't handle clicks on time slots or appointment cards
        if (e.target.closest('[data-time-slot]') || e.target.closest('.appointment-card')) {
          return
        }
        
        console.log('Main container clicked - isDragging:', isDragging, 'draggedAppointment:', draggedAppointment?.id)
        // Cancel move mode when clicking on empty space
        if (isDragging && draggedAppointment) {
          console.log('Cancelling move mode')
          setDraggedAppointment(null)
          setIsDragging(false)
          setIsInMoveMode(false)
          dispatch(addSuccess({
            message: 'Move mode cancelled',
            title: 'Cancelled'
          }))
        }
      }}
    >
      {/* Header Bar - Day, Week, Month View Toggles */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        {/* Left Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateToPrevious}
            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        {/* Center View Toggles */}
        <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'day' 
                ? 'bg-gray-700 text-blue-400' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'week' 
                ? 'bg-gray-700 text-blue-400' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'month' 
                ? 'bg-gray-700 text-blue-400' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Month
          </button>
        </div>
        
        {/* Right Navigation and Date */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <button
            onClick={navigateToNext}
            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>



      {/* Shared Date Selector Row - Only for Day and Week views */}
      {(viewMode === 'day' || viewMode === 'week') && (
        <div className="px-2 py-1 bg-gray-900 border-b border-gray-700">
          <div className="grid grid-cols-8">
            {/* Empty first column for time alignment */}
            <div className="border-r border-gray-700"></div>
            
            {/* Days of week - 7 columns */}
            {(() => {
              // Get the week's dates based on currentDate (selected date)
              const startOfWeek = new Date(currentDate)
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Start from Monday
              
              const weekDays = []
              for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek)
                day.setDate(startOfWeek.getDate() + i)
                weekDays.push(day)
              }
              
                              return weekDays.map((day, index) => {
                  const isToday = day.toDateString() === new Date().toDateString()
                  const isSelected = day.toDateString() === currentDate.toDateString()
                
                return (
                  <div 
                    key={index} 
                    className="text-center cursor-pointer hover:opacity-80 transition-opacity p-1 border-r border-gray-700 flex flex-col items-center justify-center"
                                          onClick={() => {
                        setCurrentDate(day)
                        // Switch to day view when clicking a date
                        setViewMode('day')
                      }}
                  >
                    <div className="text-xs text-gray-400 mb-0.5 text-center">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      isToday ? 'bg-blue-500 text-white' : 
                      isSelected ? 'bg-gray-600 text-white' : 
                      'text-gray-300 hover:bg-gray-700'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* Dynamic Waiting List & Parked Appointments - Only for Day and Week views */}
      {(viewMode === 'day' || viewMode === 'week') && (
        <div className="px-6 py-2 bg-gray-900 border-b border-gray-700">
          
                    {/* Combined Waiting List & Parked Appointments */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {/* Waiting List - Left Side */}
            <div 
              className="flex gap-1 flex-shrink-0 min-h-8 p-1 border-2 border-dashed border-gray-600 rounded-lg"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                e.currentTarget.style.borderColor = '#F97316'
                e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)'
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = '#4B5563'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onDrop={async (e) => {
                e.preventDefault()
                const appointmentId = e.dataTransfer.getData('text/plain')
                const appointment = appointments.find(apt => apt.id === appointmentId)
                
                if (appointment) {
                  try {
                    // Apply optimistic update immediately - add to waiting list
                    dispatch(optimisticUpdateAppointment({
                      id: appointment.id,
                      updates: { status: 'waiting', parked: false }
                    }))
                    
                    // Show success message immediately
                    dispatch(addSuccess({
                      message: `${appointment.clients?.full_name || appointment.client_name || 'Appointment'} added to waiting list`,
                      title: 'Waiting List'
                    }))
                    
                    // Perform actual update (you might need to create a waitlistAppointment action)
                    // For now, we'll just update the appointment status
                    await dispatch(updateAppointment({
                      id: appointment.id,
                      updates: { status: 'waiting', parked: false }
                    })).unwrap()
                  } catch (error) {
                    dispatch(addError({
                      message: `Failed to add to waiting list: ${error.message || error}`,
                      title: 'Error'
                    }))
                  }
                }
                
                e.currentTarget.style.borderColor = '#4B5563'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {/* Hardcoded waiting list cards */}
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded text-xs text-white hover:bg-gray-700 transition-colors cursor-grab border border-orange-500">
                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                <span className="font-medium">Ayesha Drake</span>
              </div>
              
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded text-xs text-white hover:bg-gray-700 transition-colors cursor-grab border border-orange-500">
                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                <span className="font-medium">Claude Bowman</span>
              </div>
            </div>
            
            {/* Parked Appointments - Right Side */}
            <div 
              className="flex gap-1 flex-shrink-0 min-h-8 p-1 border-2 border-dashed border-gray-600 rounded-lg"
              data-park-bar="true"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                e.currentTarget.style.borderColor = '#10B981'
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = '#4B5563'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onDrop={async (e) => {
                e.preventDefault()
                console.log('Drop event triggered on park section')
                console.log('Data transfer:', e.dataTransfer)
                
                const appointmentId = e.dataTransfer.getData('text/plain')
                console.log('Appointment ID from drop:', appointmentId)
                console.log('All appointments:', appointments)
                
                const appointment = appointments.find(apt => apt.id === appointmentId)
                console.log('Found appointment:', appointment)
                
                if (appointment) {
                  console.log('Dropping appointment on park bar:', appointment.id)
                  console.log('Appointment details:', appointment)
                  console.log('Calling handleDragToPark...')
                  handleDragToPark(appointment)
                } else {
                  console.log('No appointment found for ID:', appointmentId)
                  console.log('Available appointment IDs:', appointments.map(apt => apt.id))
                }
                
                e.currentTarget.style.borderColor = '#4B5563'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {(() => {
                // Get parked appointments
                const parkedAppointments = appointments.filter(apt => apt.parked)
                
                return parkedAppointments.map((apt) => {
                  const clientName = apt.clients?.full_name || apt.client_name || 'Unknown Client'
                  
                  return (
                    <div
                      key={apt.id}
                      className={`flex items-center px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 hover:bg-gray-700 transition-colors cursor-grab border-l-2 border-green-500 ${
                        isLongPressing && selectedAppointmentForOptions?.id === apt.id && longPressCompleted ? 'animate-pulse ring-2 ring-yellow-400' : ''
                      }`}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', apt.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onMouseDown={(e) => handleLongPress(apt, e)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={(e) => handleLongPress(apt, e)}
                      onTouchEnd={handleLongPressEnd}
                      onDoubleClick={(e) => handleDoubleClick(apt, e)}
                    >
                      <span className="font-medium">{clientName}</span>
                    </div>
                  )
                })
              })()}
              
              {appointments.filter(apt => apt.parked).length === 0 && (
                <div className="text-xs text-gray-500 italic py-1">
                  Drop appointments here to park them
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 bg-gray-900 overflow-auto">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>



      {/* Create Appointment Modal */}
      {showCreateModal && (
        <CreateAppointmentForm
          onClose={() => {
            setShowCreateModal(false)
            setSelectedSlot(null)
          }}
          selectedDate={selectedSlot?.start}
          onSubmit={handleCreateAppointment}
        />
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Appointment Details</h2>
              <button
                onClick={() => setShowAppointmentDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    {selectedAppointment.clients?.full_name || 'Unknown Client'}
                  </div>
                  <div className="text-sm text-gray-300">
                    {selectedAppointment.clients?.phone || 'No phone'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    {selectedAppointment.services?.name || 'No Service'}
                  </div>
                  <div className="text-sm text-gray-300">
                    {selectedAppointment.duration || 60} minutes
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    {new Date(selectedAppointment.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-300">
                    {new Date(selectedAppointment.date).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    ${selectedAppointment.price || 0}
                  </div>
                  <div className="text-sm text-gray-300">
                    {selectedAppointment.parked ? 'Parked' : 'Active'}
                  </div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                  <div className="text-sm font-medium text-white mb-1">Notes</div>
                  <div className="text-sm text-gray-300">{selectedAppointment.notes}</div>
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



      {/* Appointment Bottom Sheet */}
      {showAppointmentBottomSheet && selectedAppointmentForOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="theme-modal p-6 rounded-t-2xl w-full max-w-sm mx-4 mb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-lg font-semibold theme-text border-b-2 border-blue-500 pb-1">
                  {selectedAppointmentForOptions.clients?.full_name || selectedAppointmentForOptions.client_name || 'Appointment'}
                </div>
              </div>
              <button
                onClick={handleAppointmentBottomSheetClose}
                className="theme-text opacity-70 hover:opacity-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <button
                onClick={() => handleAppointmentOption('park')}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center"
              >
                {selectedAppointmentForOptions.parked ? 'UNPARK' : 'PARK'}
              </button>
              
              <button
                onClick={() => handleAppointmentOption('modify')}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center"
              >
                MODIFY
              </button>
              
              <button
                onClick={() => handleAppointmentOption('double-book')}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center"
              >
                DOUBLE BOOK
              </button>
              
              <button
                onClick={() => handleAppointmentOption('new-appointment')}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center"
              >
                NEW APPOINTMENT
              </button>
              

              
              <button
                onClick={() => handleAppointmentOption('delete')}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Options Bottom Sheet */}
      {showSlotOptionsSheet && selectedSlot && selectedSlot.start && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="theme-modal p-6 rounded-t-2xl w-full max-w-sm mx-4 mb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="text-lg font-semibold theme-text border-b-2 border-green-500 pb-1">
                  {selectedSlot.start ? selectedSlot.start.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Select Date'}
                </div>
              </div>
              <button
            onClick={() => {
                  setShowSlotOptionsSheet(false)
                  setSelectedSlot(null)
                }}
                className="theme-text opacity-70 hover:opacity-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time Display */}
            <div className="text-sm text-gray-400 mb-6">
              {selectedSlot.start ? selectedSlot.start.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              }) : 'Select Time'}
            </div>

            {/* Options */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSlotOptionsSheet(false)
                  setShowCreateModal(true)
                }}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center flex items-center justify-center space-x-3"
              >
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
            </div>
                <span>New appointment</span>
              </button>
            
              <button
                onClick={() => {
                  setShowSlotOptionsSheet(false)
                  // TODO: Implement personal task creation
                  console.log('Personal task clicked')
                }}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center flex items-center justify-center space-x-3"
              >
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span>Personal task</span>
              </button>
              
              <button
                onClick={() => {
                  setShowSlotOptionsSheet(false)
                  // TODO: Implement working hours editing
                  console.log('Edit working hours clicked')
                }}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-full hover:bg-gray-700 transition-colors text-center flex items-center justify-center space-x-3"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <span>Edit working hours</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Confirm Action</h3>
            <p className="theme-text opacity-70 mb-6">
              {confirmAction.message}
            </p>
            <div className="flex space-x-3">
              <button
            onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmAction(null)
              setSelectedAppointmentForOptions(null)
                }}
                className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unparking Confirmation Modal */}
      {showUnparkConfirmModal && appointmentToUnpark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Unpark Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Are you sure you want to unpark this appointment? You will need to set the service and time.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleUnparkConfirmCancel}
                className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleUnparkConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Park Confirmation Modal */}
      {showParkConfirmation && parkedAppointmentToMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Unpark Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Do you want to put the appointment here?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowParkConfirmation(false)
                  setParkedAppointmentToMove(null)
                  setTargetDateForMove(null)
                  setTargetTimeForMove(null)
                }}
                className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMoveParkedAppointment(parkedAppointmentToMove, targetDateForMove, targetTimeForMove)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Confirmation Modal */}
      {showMoveConfirmation && moveConfirmationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Move Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Are you sure you want to move this appointment here?
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-sm font-medium theme-text">
                  {moveConfirmationData.appointment.clients?.full_name || moveConfirmationData.appointment.client_name || 'Unknown Client'}
                </div>
                <div className="text-xs text-gray-400">
                  {moveConfirmationData.appointment.services?.name || moveConfirmationData.appointment.service_name || 'No Service'}
                </div>
                <div className="text-xs text-gray-400">
                  Current: {new Date(moveConfirmationData.appointment.date).toLocaleDateString()} at {moveConfirmationData.appointment.appointment_time || 'Unknown Time'}
                </div>
                <div className="text-xs text-green-400">
                  New: {new Date(moveConfirmationData.targetDate).toLocaleDateString()} at {moveConfirmationData.targetTime}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleMoveConfirmationCancel}
                className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveConfirmation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parking Modal */}
      {showParkingModal && appointmentToPark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Park Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Are you sure you want to park this appointment?
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-sm font-medium theme-text">
                  {appointmentToPark.clients?.full_name || appointmentToPark.client_name || 'Unknown Client'}
                </div>
                <div className="text-xs text-gray-400">
                  {appointmentToPark.services?.name || appointmentToPark.service_name || 'No Service'}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(appointmentToPark.date).toLocaleDateString()} at {appointmentToPark.appointment_time || 'Unknown Time'}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowParkingModal(false)
                  setAppointmentToPark(null)
                  setParkingTime('')
                  setParkingService('')
                }}
                className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Apply optimistic update immediately
                  dispatch(optimisticUpdateAppointment({
                    id: appointmentToPark.id,
                    updates: { parked: true, status: 'parked' }
                  }))
                  
                  // Show success message immediately
                  dispatch(addSuccess({
                    message: `${appointmentToPark.clients?.full_name || appointmentToPark.client_name || 'Appointment'} parked successfully`,
                    title: 'Parked'
                  }))
                  
                  // Perform actual parking
                  dispatch(parkAppointment(appointmentToPark.id))
                  
                  // Close modal
                  setShowParkingModal(false)
                  setAppointmentToPark(null)
                  setParkingTime('')
                  setParkingService('')
                }}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Park
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unparking Modal */}
      {showUnparkingModal && appointmentToUnpark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Unpark Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Please select the service and time for this appointment.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              console.log('Form submitted, calling handleUnparkingConfirm')
              handleUnparkingConfirm()
            }} className="space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium theme-text mb-2">
                  Service *
                </label>
                <select
                  value={unparkingFormData.service_id}
                  onChange={(e) => setUnparkingFormData(prev => ({
                    ...prev,
                    service_id: e.target.value
                  }))}
                  className="w-full px-3 py-2 theme-input border theme-border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ${service.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium theme-text mb-2">
                  Date *
                </label>
                <input
                  type="text"
                  placeholder="Select date"
                  value={unparkingFormData.date || ''}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    setUnparkingFormData(prev => ({
                      ...prev,
                      date: selectedDate
                    }))
                  }}
                  onFocus={(e) => {
                    e.target.type = 'date'
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      e.target.type = 'text'
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium theme-text mb-2">
                  Time *
                </label>
                <select
                  value={unparkingFormData.time || '10:00'}
                  onChange={(e) => {
                    const selectedTime = e.target.value
                    setUnparkingFormData(prev => ({
                      ...prev,
                      time: selectedTime
                    }))
                  }}
                  className="w-full px-3 py-2 theme-input border theme-border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select a time</option>
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium theme-text mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={unparkingFormData.duration}
                  onChange={(e) => setUnparkingFormData(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value)
                  }))}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 theme-input border theme-border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>



              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleUnparkingCancel}
                  className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Unpark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomCalendar 