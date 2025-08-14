import React, { useState, useCallback, useMemo, useEffect } from 'react'
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
  optimisticCreateAppointment,
  optimisticUpdateAppointment,
  optimisticDeleteAppointment
} from '../../features/appointments/appointmentsSlice'
import { selectClients } from '../../features/clients/clientsSlice'
import { selectServices } from '../../features/services/servicesSlice'

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
  
  const [currentDate, setCurrentDate] = useState(new Date('2025-08-06'))
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

  // Advanced interaction states
  const [draggedAppointment, setDraggedAppointment] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState(null)
  const [showOptionOverlay, setShowOptionOverlay] = useState(false)
  const [optionOverlayPosition, setOptionOverlayPosition] = useState({ x: 0, y: 0 })
  const [selectedAppointmentForOptions, setSelectedAppointmentForOptions] = useState(null)
  const [isModifyingTime, setIsModifyingTime] = useState(false)
  const [modifyingAppointment, setModifyingAppointment] = useState(null)

  const [showExtendConfirmation, setShowExtendConfirmation] = useState(false)

  const [longPressTimer, setLongPressTimer] = useState(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // State for park bar functionality
  const [showParkConfirmation, setShowParkConfirmation] = useState(false)
  const [parkedAppointmentToMove, setParkedAppointmentToMove] = useState(null)
  const [targetDateForMove, setTargetDateForMove] = useState(null)
  const [targetTimeForMove, setTargetTimeForMove] = useState(null)
  
  // State for move confirmation
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false)

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
    const grouped = {}
    appointments.forEach(apt => {
      const dateKey = new Date(apt.date || apt.appointment_date).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(apt)
    })
    return grouped
  }, [appointments])



  // Get appointments for a specific date (optimized with memoization)
  const getAppointmentsForDate = useCallback((date) => {
    const targetLocal = new Date(date)
    const targetKey = targetLocal.toDateString()
    
    // Use memoized data for better performance and filter out parked appointments
    const allAppointments = appointmentsByDate[targetKey] || []
    return allAppointments.filter(apt => !apt.parked)
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

  // Handle slot selection - show bottom sheet
  const handleSlotClick = useCallback((date, time) => {
    // If we're in drag mode, don't show the bottom sheet
    if (isDragging) {
      console.log('Slot click ignored - drag mode active')
      return
    }
    
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
  }, [isDragging])

  // Handle bottom sheet option selection
  const handleBottomSheetOption = useCallback(async (option) => {
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
      case 'double-book':
        // Handle double booking with realtime
        try {
          // Create a duplicate appointment with the same details
          const duplicateAppointment = {
            client_id: selectedAppointmentForOptions.client_id,
            service_id: selectedAppointmentForOptions.service_id,
            date: selectedAppointmentForOptions.date,
            duration: selectedAppointmentForOptions.duration || 60,
            price: selectedAppointmentForOptions.price || 0,
            notes: `Double booked with ${selectedAppointmentForOptions.clients?.full_name || selectedAppointmentForOptions.client_name || 'Unknown'}`,
            stylist_id: selectedAppointmentForOptions.stylist_id,
            brand_id: selectedAppointmentForOptions.brand_id
          }
          
          // Apply optimistic update immediately
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const optimisticAppointment = {
            ...duplicateAppointment,
            id: tempId,
            clients: selectedAppointmentForOptions.clients,
            services: selectedAppointmentForOptions.services,
            parked: false,
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          dispatch(optimisticCreateAppointment(optimisticAppointment))
          
          // Show success message immediately
          dispatch(addSuccess({
            message: 'Double booking created successfully',
            title: 'Success'
          }))
          
          // Perform actual creation
          await dispatch(createAppointment(duplicateAppointment)).unwrap()
          
        } catch (error) {
          dispatch(addError({
            message: 'Failed to create double booking',
            title: 'Error'
          }))
        }
        break
    }
  }, [bottomSheetData, dispatch, selectedAppointmentForOptions])

  // Handle appointment creation with optimistic update
  const handleCreateAppointment = useCallback(async (appointmentData) => {
    try {
      const newAppointment = {
        ...appointmentData,
        date: selectedSlot.date.toISOString(),
        stylist_id: profile.id,
        brand_id: profile.brand_id
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
    if (!selectedAppointment || !confirmAction) return
    
    try {
      switch (confirmAction.type) {
        case 'delete':
          // Apply optimistic update immediately
          dispatch(optimisticDeleteAppointment(selectedAppointment.id))
          
          // Close modals immediately for instant feedback
          setShowAppointmentDetails(false)
          setSelectedAppointment(null)
          setShowConfirmModal(false)
          setConfirmAction(null)
          
          // Show success message immediately
          dispatch(addSuccess({
            message: 'Appointment deleted successfully',
            title: 'Success'
          }))
          
          // Perform actual deletion
          await dispatch(deleteAppointment(selectedAppointment.id)).unwrap()
          break
          
        case 'park':
          // Apply optimistic update immediately
          dispatch(optimisticUpdateAppointment({
            id: selectedAppointment.id,
            updates: { parked: true, status: 'parked' }
          }))
          
          // Close modals immediately for instant feedback
          setShowAppointmentDetails(false)
          setSelectedAppointment(null)
          setShowConfirmModal(false)
          setConfirmAction(null)
          
          // Show success message immediately
          dispatch(addSuccess({
            message: 'Appointment parked successfully',
            title: 'Success'
          }))
          
          // Perform actual parking
          await dispatch(parkAppointment(selectedAppointment.id)).unwrap()
          break
          
        case 'unpark':
          // Apply optimistic update immediately
          dispatch(optimisticUpdateAppointment({
            id: selectedAppointment.id,
            updates: { parked: false, status: 'scheduled' }
          }))
          
          // Close modals immediately for instant feedback
          setShowAppointmentDetails(false)
          setSelectedAppointment(null)
          setShowConfirmModal(false)
          setConfirmAction(null)
          
          // Show success message immediately
          dispatch(addSuccess({
            message: 'Appointment unparked successfully',
            title: 'Success'
          }))
          
          // Perform actual unparking
          await dispatch(unparkAppointment(selectedAppointment.id)).unwrap()
          break
          
        case 'edit':
          setShowEditModal(true)
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
  }, [dispatch, selectedAppointment, confirmAction])

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
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }
    event.stopPropagation()
    
    // Start long press timer
    const timer = setTimeout(() => {
      setIsLongPressing(true)
      setSelectedAppointmentForOptions(appointment)
      setOptionOverlayPosition({ x: event.clientX || event.touches?.[0]?.clientX || 0, y: event.clientY || event.touches?.[0]?.clientY || 0 })
      setShowOptionOverlay(true)
    }, 800) // Increased to 800ms to avoid conflict with single click
    
    setLongPressTimer(timer)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setIsLongPressing(false)
  }, [longPressTimer])

  const handleSingleClick = useCallback((appointment, event) => {
    // Single click is now disabled - only long press and double click work
    event.stopPropagation()
    // No action on single click
  }, [])

  const handleDoubleClick = useCallback((appointment, event) => {
    // Only preventDefault for mouse events, not touch events
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }
    event.stopPropagation()
    
    // Clear any long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    // Navigate to client profile page
    if (appointment.client_id) {
      const clientName = appointment.clients?.full_name || appointment.client_name || 'Unknown'
      dispatch(addSuccess({
        message: `Navigating to ${clientName}'s profile`,
        title: 'Client Details'
      }))
      navigate(`/client/${appointment.client_id}`)
    } else {
      // Fallback if no client_id, show appointment details
      setSelectedAppointment(appointment)
      setShowAppointmentDetails(true)
      dispatch(addError({
        message: 'Client ID not found, showing appointment details instead',
        title: 'Navigation Error'
      }))
    }
  }, [longPressTimer, navigate, dispatch])

  const handleOptionSelect = useCallback(async (option) => {
    const appointment = selectedAppointmentForOptions
    setShowOptionOverlay(false)
    setSelectedAppointmentForOptions(null)
    
    if (!appointment) return
    
    switch (option) {
      case 'park':
        // Set the appointment and trigger park action
        setSelectedAppointment(appointment)
        const action = appointment.parked ? 'unpark' : 'park'
        handleAppointmentAction({ type: action })
        break
        
      case 'modify':
        // Show time modification interface
        setIsModifyingTime(true)
        setModifyingAppointment(appointment)
        break
        
      case 'move':
        // Show confirmation modal for move action
        setSelectedAppointment(appointment)
        setShowMoveConfirmation(true)
        break
        
      case 'double-book':
        // Handle double booking with realtime
        try {
          // Create a duplicate appointment with the same details
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
          
          // Show success message immediately
          dispatch(addSuccess({
            message: 'Double booking created successfully',
            title: 'Success'
          }))
          
          // Perform actual creation
          await dispatch(createAppointment(duplicateAppointment)).unwrap()
          
        } catch (error) {
          dispatch(addError({
            message: 'Failed to create double booking',
            title: 'Error'
          }))
        }
        break
        
      case 'delete':
        // Set the appointment and trigger delete action
        setSelectedAppointment(appointment)
        handleAppointmentAction({ type: 'delete' })
        break
        
      default:
        break
    }
  }, [selectedAppointmentForOptions, handleAppointmentAction, dispatch])



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
    
    // Check if this is a parked appointment being moved to a different day
    const draggedDate = new Date(draggedAppointment.date)
    const targetDateObj = new Date(targetDate)
    const isDifferentDay = draggedDate.toDateString() !== targetDateObj.toDateString()
    
    if (draggedAppointment.parked && isDifferentDay) {
      // Show confirmation popup for parked appointment move
      setParkedAppointmentToMove(draggedAppointment)
      setTargetDateForMove(targetDate)
      setTargetTimeForMove(targetTime)
      setShowParkConfirmation(true)
      
      // Reset drag state
      setDraggedAppointment(null)
      setIsDragging(false)
      return
    }
    
    try {
      // Calculate new date and time
      const newDate = new Date(targetDate)
      const [hours, minutes] = targetTime.split(':')
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      // Apply optimistic update immediately
      dispatch(optimisticUpdateAppointment({
        id: draggedAppointment.id,
        updates: { date: newDate.toISOString() }
      }))
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Appointment moved successfully',
        title: 'Success'
      }))
      
      // Perform actual update
      await dispatch(updateAppointment({
        id: draggedAppointment.id,
        updates: { date: newDate.toISOString() }
      })).unwrap()
      
    } catch (error) {
      console.error('Error moving appointment:', error)
      dispatch(addError({
        message: 'Failed to move appointment',
        title: 'Error'
      }))
    } finally {
      setDraggedAppointment(null)
      setIsDragging(false)
    }
  }, [draggedAppointment, dispatch])

  // Handle move confirmation
  const handleMoveConfirmation = useCallback(() => {
    setShowMoveConfirmation(false)
    // Enable drag mode for the selected appointment
    if (selectedAppointment) {
      setIsDragging(true)
      setDraggedAppointment(selectedAppointment)
      
      // Show success message to guide user
      dispatch(addSuccess({
        message: 'Drag the appointment to the new time slot',
        title: 'Move Mode Active'
      }))
    }
  }, [selectedAppointment, dispatch])

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

  // Reusable appointment card
  const renderAppointmentCard = useCallback((apt, compact = false) => {
    const theme = getAppointmentTheme(apt)
    const timeText = formatAppointmentTime(apt)
    
    // Check if this is a temporary appointment (optimistic update)
    const isTemporary = apt.id && apt.id.startsWith('temp_')
    const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
    const serviceName = apt.services?.name || apt.service_name || 'No service'
    const isDragged = draggedAppointment?.id === apt.id

    return (
      <div
        key={apt.id}
        className={`relative ${compact ? 'p-2 text-xs' : 'p-3 text-sm'} mb-1 rounded-xl cursor-pointer shadow-lg ring-1 ring-white/10 overflow-hidden ${
          isTemporary ? 'opacity-80 animate-pulse' : ''
        } ${isDragged ? 'opacity-50 scale-95' : ''} ${
          isLongPressing && selectedAppointmentForOptions?.id === apt.id ? 'animate-pulse ring-2 ring-yellow-400' : ''
        } ${isDragging && draggedAppointment?.id === apt.id ? 'ring-2 ring-blue-400 animate-pulse cursor-grab' : ''}`}
        onClick={(e) => handleSingleClick(apt, e)}
        onDoubleClick={(e) => handleDoubleClick(apt, e)}
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
        draggable={isDragging && draggedAppointment?.id === apt.id}
        onDragStart={(e) => handleDragStart(apt, e)}
        onDragEnd={handleDragEnd}
        style={{
          // gradient with 60% opacity overlay
          background: undefined,
          cursor: isDragging && draggedAppointment?.id === apt.id ? 'grab' : 'pointer',
        }}
      >
        {/* gradient background with 60% opacity */}
        <div className={`absolute inset-0 rounded-xl opacity-60 ${theme.bg} pointer-events-none z-0`}></div>
        <div className={`absolute left-0 top-0 h-full ${compact ? 'w-1' : 'w-1.5'} rounded-l ${theme.accent} z-10`}></div>
        
        {/* Time modification handle */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-ns-resize hover:bg-white/30 transition-colors"
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsModifyingTime(true)
            setModifyingAppointment(apt)
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            setIsModifyingTime(true)
            setModifyingAppointment(apt)
          }}
        />
        
        <div className="relative z-10">
          <div className={`truncate ${compact ? 'font-semibold' : 'font-bold text-[0.95rem]'} ${theme.accentText}`}>
            {clientName}
            {isTemporary && clientName === 'Creating...' && (
              <span className="ml-1 text-xs opacity-70">(Creating...)</span>
            )}
          </div>
          <div className="truncate theme-text opacity-70">
            {serviceName}
            {isTemporary && serviceName === 'Creating...' && (
              <span className="ml-1 text-xs opacity-70">(Creating...)</span>
            )}
          </div>
          {!!timeText && (
            <div className={`flex items-center gap-1 ${compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'} ${theme.accentText}`}>
              <Clock className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
              <span>{timeText}</span>
            </div>
          )}
        </div>
      </div>
    )
  }, [getAppointmentTheme, formatAppointmentTime, setSelectedAppointment, setShowAppointmentDetails, draggedAppointment, isLongPressing, selectedAppointmentForOptions, handleLongPress, handleLongPressEnd, handleDragStart, handleSingleClick, handleDoubleClick, isDragging])

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
  }, [dispatch])

  // Force re-render when appointments change for better realtime updates
  useEffect(() => {
    console.log('CustomCalendar: Appointments updated, re-rendering calendar')
  }, [appointments, parkedAppointments])



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
    const weekDays = getWeekDays()
    const timeSlots = getTimeSlots()

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="grid grid-cols-8 border-b theme-border theme-header">
          <div className="p-3 border-r border-gray-200"></div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 border-r border-gray-700 text-center">
              <div className="text-sm font-medium theme-text">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-semibold theme-text">
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Park Bar */}
        <div 
          className="p-3 bg-yellow-500/10 border-b border-yellow-500/20 cursor-pointer transition-all duration-200 hover:bg-yellow-500/20"
          onDragOver={handleParkBarDragOver}
          onDragLeave={handleParkBarDragLeave}
          onDrop={handleParkBarDrop}
          style={{ minHeight: '60px' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Park Bar - Drag appointments here to park them
              </span>
            </div>
            <div className="text-xs text-yellow-500/70">
              {parkedAppointments.length} parked
            </div>
          </div>
          
          {/* Display parked appointments */}
          <div className="mt-2 flex flex-wrap gap-2">
            {parkedAppointments.map((apt) => (
              <div
                key={apt.id}
                className="px-2 py-1 bg-yellow-500/20 rounded text-xs text-yellow-700 dark:text-yellow-300 cursor-grab"
                draggable={true}
                onDragStart={(e) => {
                  setDraggedAppointment(apt)
                  setIsDragging(true)
                  console.log('Started dragging parked appointment:', apt.id)
                }}
              >
                {apt.clients?.full_name || apt.client_name || 'Unknown'} - {apt.services?.name || apt.service_name || 'Service'}
              </div>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto theme-bg">
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-8 border-b theme-border min-h-16">
              <div className="p-2 border-r theme-border text-xs theme-text opacity-70 flex items-center justify-end pr-2">
                {time}
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForDate(day)
                const timeAppointments = dayAppointments.filter((apt) => {
                  // Calculate local HH:mm for the appointment
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
                    className={`p-1 border-r theme-border relative ${isDragging ? 'cursor-grab' : 'hover:opacity-80 cursor-pointer'}`}
                    data-time-slot="true"
                    data-date={day.toISOString()}
                    data-time={time}
                    onClick={() => handleSlotClick(day, time)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(day, time, e)}
                    style={{ position: 'relative' }}
                  >
                    {timeAppointments.map((apt, idx) => {
                        const theme = getAppointmentTheme(apt)
                        const heightPx = getAppointmentHeightPx(apt)
                        const isTemporary = apt.id && apt.id.startsWith('temp_')
                        const isDragged = draggedAppointment?.id === apt.id
                        const clientName = apt.clients?.full_name || apt.client_name || 'Unknown'
                        const serviceName = apt.services?.name || apt.service_name || 'No service'
                        
                        return (
                          <div
                            key={apt.id}
                            className={`absolute left-1 right-1 rounded text-xs text-white cursor-pointer shadow-sm ${theme.bg} ${
                              isTemporary ? 'opacity-80 animate-pulse' : ''
                            } ${isDragged ? 'opacity-50 scale-95' : ''} ${
                              isLongPressing && selectedAppointmentForOptions?.id === apt.id ? 'animate-pulse ring-2 ring-yellow-400' : ''
                            } ${isDragging && draggedAppointment?.id === apt.id ? 'ring-2 ring-blue-400 animate-pulse cursor-grab' : ''}`}
                            style={{ height: heightPx, top: 2 + idx * 4 }}
                            onClick={(e) => handleSingleClick(apt, e)}
                            onDoubleClick={(e) => handleDoubleClick(apt, e)}
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
                            draggable={isDragging && draggedAppointment?.id === apt.id}
                            onDragStart={(e) => handleDragStart(apt, e)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className={`absolute left-0 top-0 h-full w-1 rounded-l ${theme.accent}`}></div>
                            <div className="p-2">
                              <div className="font-semibold truncate drop-shadow-sm">
                                {clientName}
                                {isTemporary && clientName === 'Creating...' && (
                                  <span className="ml-1 opacity-70">(Creating...)</span>
                                )}
                              </div>
                              <div className="text-[11px] opacity-90">
                                {serviceName}
                                {isTemporary && serviceName === 'Creating...' && (
                                  <span className="ml-1 opacity-70">(Creating...)</span>
                                )}
                              </div>
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
  }, [getWeekDays, getTimeSlots, getAppointmentsForDate, formatTime, handleSlotClick, getAppointmentTheme, renderAppointmentCard, getAppointmentHeightPx])

  // Render day view
  const renderDayView = useCallback(() => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    const timeSlots = getTimeSlots()

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b theme-border theme-header">
          <div className="text-lg font-semibold theme-text">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Park Bar */}
        <div 
          className="p-3 bg-yellow-500/10 border-b border-yellow-500/20 cursor-pointer transition-all duration-200 hover:bg-yellow-500/20"
          onDragOver={handleParkBarDragOver}
          onDragLeave={handleParkBarDragLeave}
          onDrop={handleParkBarDrop}
          style={{ minHeight: '60px' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Park Bar - Drag appointments here to park them
              </span>
            </div>
            <div className="text-xs text-yellow-500/70">
              {parkedAppointments.length} parked
            </div>
          </div>
          
          {/* Display parked appointments */}
          <div className="mt-2 flex flex-wrap gap-2">
            {parkedAppointments.map((apt) => (
              <div
                key={apt.id}
                className="px-2 py-1 bg-yellow-500/20 rounded text-xs text-yellow-700 dark:text-yellow-300 cursor-grab"
                draggable={true}
                onDragStart={(e) => {
                  setDraggedAppointment(apt)
                  setIsDragging(true)
                  console.log('Started dragging parked appointment:', apt.id)
                }}
              >
                {apt.clients?.full_name || apt.client_name || 'Unknown'} - {apt.services?.name || apt.service_name || 'Service'}
              </div>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto theme-bg">
          {timeSlots.map((time, timeIndex) => {
            const timeAppointments = dayAppointments.filter((apt) => {
              let hhmm
              if (apt.appointment_time) {
                hhmm = apt.appointment_time
              } else if (apt.date) {
                const d = new Date(apt.date)
                const hh = String(d.getUTCHours()).padStart(2, '0')
                const mm = String(d.getUTCMinutes()).padStart(2, '0')
                hhmm = `${hh}:${mm}`
              } else if (apt.appointment_date) {
                const d = new Date(apt.appointment_date)
                const hh = String(d.getUTCHours()).padStart(2, '0')
                const mm = String(d.getUTCMinutes()).padStart(2, '0')
                hhmm = `${hh}:${mm}`
              } else {
                hhmm = '00:00'
              }

              if (hhmm === time) return true
              const [th, tm] = time.split(':').map((v) => parseInt(v, 10))
              const [ah, am] = hhmm.split(':').map((v) => parseInt(v, 10))
              const diff = Math.abs((ah * 60 + am) - (th * 60 + tm))
              return diff <= 30
            })

            return (
              <div key={timeIndex} className="flex border-b border-gray-600 min-h-16">
                <div className="w-20 p-2 text-xs theme-text opacity-70 flex items-center justify-end pr-2 border-r theme-border">
                  {time}
                </div>
                <div
                  className={`flex-1 p-1 ${isDragging ? 'cursor-grab' : 'hover:opacity-80 cursor-pointer'}`}
                  data-time-slot="true"
                  data-date={currentDate.toISOString()}
                  data-time={time}
                  onClick={() => handleSlotClick(currentDate, time)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(currentDate, time, e)}
                >
                  {timeAppointments.map((apt) => (
                    <div key={apt.id} style={{ height: getAppointmentHeightPx(apt) }}>{renderAppointmentCard(apt, false)}</div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [currentDate, getAppointmentsForDate, getTimeSlots, formatTime, handleSlotClick, getAppointmentTheme, renderAppointmentCard, getAppointmentHeightPx])

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
        <div className="grid grid-cols-7 border-b theme-border theme-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium theme-text">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 theme-bg">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day)
            const isCurrentMonth = day.getMonth() === month
            const isToday = day.toDateString() === new Date().toDateString()

            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b theme-border ${
                  isToday ? 'theme-card' : 'theme-bg'
                } ${!isCurrentMonth ? 'opacity-60' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-400' : 'theme-text'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className={`text-xs p-1 rounded cursor-pointer ${
                        apt.parked ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
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
                    <div className="text-xs theme-text opacity-70">
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
  }, [currentDate, getAppointmentsForDate, formatTime, getAppointmentTheme])

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

  // Handle drag to park bar
  const handleDragToPark = useCallback((appointment) => {
    console.log('Dragging appointment to park bar:', appointment.id)
    
    // Apply optimistic update immediately
    dispatch(optimisticUpdateAppointment({
      id: appointment.id,
      updates: { parked: true, status: 'parked' }
    }))
    
    // Show success message immediately
    dispatch(addSuccess({
      message: 'Appointment parked successfully',
      title: 'Parked'
    }))
    
    // Perform actual parking
    dispatch(parkAppointment(appointment.id))
    
    // Reset drag state
    setDraggedAppointment(null)
    setIsDragging(false)
    
    // Remove drag ghost element
    const dragElement = document.getElementById('drag-ghost')
    if (dragElement) {
      dragElement.remove()
    }
    
    // Clear all highlights
    clearAllHighlights()
  }, [dispatch, clearAllHighlights])

  // Handle moving parked appointment to new location
  const handleMoveParkedAppointment = useCallback(async (appointment, targetDate, targetTime) => {
    try {
      // Calculate new date and time
      const newDate = new Date(targetDate)
      const [hours, minutes] = targetTime.split(':')
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
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
        message: 'Parked appointment moved successfully',
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
  }, [dispatch])

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
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 theme-header border-b theme-border">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateToPrevious}
            className="p-2 theme-text opacity-70 hover:opacity-100 rounded-md hover:opacity-80"
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
            className="p-2 theme-text opacity-70 hover:opacity-100 rounded-md hover:opacity-80"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold theme-text">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Realtime Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              realtimeStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs theme-text opacity-70">
              {realtimeStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Interaction Guide */}
          <div className="flex items-center space-x-2 px-3 py-1 text-sm">
            <span className="text-xs theme-text opacity-70">
              {isDragging ? 'MOVE MODE: Drag to new slot' : 'Long Press: Options | Double: Client'}
            </span>
            {isDragging && (
              <button
                onClick={() => {
                  setIsDragging(false)
                  setDraggedAppointment(null)
                  dispatch(addSuccess({
                    message: 'Move mode cancelled',
                    title: 'Cancelled'
                  }))
                }}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Cancel move"
              >
                Cancel Move
              </button>
            )}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1 theme-text opacity-70 hover:opacity-100 transition-opacity"
              title="Help with interactions"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'day' ? 'theme-accent text-white' : 'theme-text opacity-70 hover:opacity-100'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'week' ? 'theme-accent text-white' : 'theme-text opacity-70 hover:opacity-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'month' ? 'theme-accent text-white' : 'theme-text opacity-70 hover:opacity-100'
            }`}
          >
            Month
          </button>
          
          {/* Test Buttons */}
          <button
            onClick={clearTestAppointments}
            className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
            title="Clear test appointments"
          >
            Clear Test
          </button>
          
          <button
            onClick={() => {
              const testAppointment = {
                client_id: 'test-client',
                service_id: 'test-service',
                date: new Date().toISOString(),
                duration: 60,
                price: 50,
                notes: 'Test appointment for realtime testing',
                stylist_id: profile.id,
                brand_id: profile.brand_id
              }
              handleCreateAppointment(testAppointment)
            }}
            className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
            title="Create test appointment"
          >
            Test Create
          </button>
        </div>
        
        {/* Color Legend */}
        {/* Removed color legend as appointments now have unique colors */}
      </div>



      {/* Calendar View */}
      <div className="flex-1 theme-bg">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>

      {/* Bottom Sheet Modal */}
      {showBottomSheet && bottomSheetData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="w-full theme-modal rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b theme-border">
              <div>
                <div className="text-lg font-semibold theme-text">
                  {bottomSheetData.dateString}
                </div>
                <div className="text-sm theme-text opacity-70">
                  {bottomSheetData.timeString}
                </div>
              </div>
              <button
                onClick={() => setShowBottomSheet(false)}
                className="p-2 theme-text opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-4">
              <button
                onClick={() => handleBottomSheetOption('appointment')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border theme-border hover:opacity-80 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium theme-text">New appointment</div>
                  <div className="text-sm theme-text opacity-70">Create a new appointment</div>
                </div>
              </button>

              <button
                onClick={() => handleBottomSheetOption('task')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border theme-border hover:opacity-80 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium theme-text">Personal task</div>
                  <div className="text-sm theme-text opacity-70">Create a personal task</div>
                </div>
              </button>

              <button
                onClick={() => handleBottomSheetOption('working-hours')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border theme-border hover:opacity-80 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium theme-text">Edit working hours</div>
                  <div className="text-sm theme-text opacity-70">Edit your calendar working hours</div>
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
          <div className="theme-modal rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b theme-border">
              <h2 className="text-lg font-semibold theme-text">Appointment Details</h2>
              <button
                onClick={() => setShowAppointmentDetails(false)}
                className="theme-text opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 theme-text">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium theme-text">
                    {selectedAppointment.clients?.full_name || 'Unknown Client'}
                  </div>
                  <div className="text-sm theme-text opacity-70">
                    {selectedAppointment.clients?.phone || 'No phone'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium theme-text">
                    {selectedAppointment.services?.name || 'No Service'}
                  </div>
                  <div className="text-sm theme-text opacity-70">
                    {selectedAppointment.duration || 60} minutes
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium theme-text">
                    {new Date(selectedAppointment.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm theme-text opacity-70">
                    {new Date(selectedAppointment.date).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium theme-text">
                    ${selectedAppointment.price || 0}
                  </div>
                  <div className="text-sm theme-text opacity-70">
                    {selectedAppointment.parked ? 'Parked' : 'Active'}
                  </div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div className="theme-card p-3 rounded-md border theme-border">
                  <div className="text-sm font-medium theme-text mb-1">Notes</div>
                  <div className="text-sm theme-text opacity-80">{selectedAppointment.notes}</div>
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
          <div className="w-full bg-gray-800 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {bottomSheetData.dateString}
                </div>
                <div className="text-sm text-gray-300">
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
          <div className="theme-modal rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 theme-text">
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
                  <h3 className="text-lg font-semibold theme-text">
                    {confirmAction.type === 'delete' ? 'Delete Appointment' :
                     confirmAction.type === 'park' ? 'Park Appointment' :
                     confirmAction.type === 'unpark' ? 'Unpark Appointment' :
                     'Edit Appointment'}
                  </h3>
                  <p className="text-sm theme-text opacity-70">
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
                  className="flex-1 px-4 py-2 border theme-border theme-text rounded-md hover:opacity-80 transition-colors"
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

      {/* Option Overlay Modal */}
      {showOptionOverlay && selectedAppointmentForOptions && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowOptionOverlay(false)}
        >
          <div 
            className="theme-modal rounded-lg shadow-xl p-4 min-w-48"
            style={{
              position: 'absolute',
              left: optionOverlayPosition.x,
              top: optionOverlayPosition.y,
              transform: 'translate(-50%, -100%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <button
                onClick={() => handleOptionSelect('park')}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 theme-text"
              >
                PARK
              </button>
              <button
                onClick={() => handleOptionSelect('modify')}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 theme-text"
              >
                MODIFY
              </button>
              <button
                onClick={() => handleOptionSelect('move')}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 theme-text"
              >
                MOVE
              </button>
              <button
                onClick={() => handleOptionSelect('double-book')}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 theme-text"
              >
                DOUBLE BOOK
              </button>
              <button
                onClick={() => handleOptionSelect('delete')}
                className="w-full text-left px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Time Modification Modal */}
      {isModifyingTime && modifyingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 theme-text">
              <h3 className="text-lg font-semibold mb-4">Modify Appointment Time</h3>
              <div className="mb-4">
                <p className="text-sm theme-text opacity-70 mb-2">
                  Client: {modifyingAppointment.clients?.full_name || modifyingAppointment.client_name || 'Unknown'}
                </p>
                <p className="text-sm theme-text opacity-70 mb-4">
                  Current Duration: {modifyingAppointment.duration || 60} minutes
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text mb-2">
                    New Duration (minutes)
                  </label>
                  <select 
                    className="w-full p-2 border theme-border rounded-md theme-bg theme-text"
                    defaultValue={modifyingAppointment.duration || 60}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value)
                      handleTimeModification(newDuration)
                    }}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={150}>2.5 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsModifyingTime(false)
                      setModifyingAppointment(null)
                    }}
                    className="flex-1 px-4 py-2 border theme-border theme-text rounded-md hover:opacity-80 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => {
                      const newDuration = (modifyingAppointment.duration || 60) + 30
                      handleTimeModification(newDuration)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    EXTEND BY 30 MIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Confirmation Modal */}
      {showExtendConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 theme-text">
              <h3 className="text-lg font-semibold mb-4">Extend Booking</h3>
              <p className="text-sm theme-text opacity-70 mb-6">
                Are you sure you want to extend this booking?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowExtendConfirmation(false)}
                  className="flex-1 px-4 py-2 border theme-border theme-text rounded-md hover:opacity-80 transition-colors"
                >
                  NO, CANCEL
                </button>
                <button
                  onClick={handleExtendConfirmation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  YES, CONTINUE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b theme-border">
              <h2 className="text-xl font-semibold theme-text">Calendar Interaction Guide</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="theme-text opacity-70 hover:opacity-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 theme-text">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Double Click */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-400">Double Click</h3>
                  <p className="text-sm opacity-80">Opens client profile screen</p>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <p className="text-xs">Double-click to navigate to client details</p>
                  </div>
                </div>

                {/* Long Press */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-400">Long Press (800ms)</h3>
                  <p className="text-sm opacity-80">Shows options overlay</p>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                    <p className="text-xs">Hold for 800ms to see: PARK, MODIFY, MOVE, DOUBLE BOOK, DELETE</p>
                  </div>
                </div>

                {/* Bottom Drag */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-400">Bottom Drag</h3>
                  <p className="text-sm opacity-80">Modify appointment duration</p>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                    <p className="text-xs">Drag bottom edge to extend/shorten time</p>
                  </div>
                </div>

                {/* Move */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-400">Move</h3>
                  <p className="text-sm opacity-80">Drag and drop to new time</p>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                    <p className="text-xs">Select MOVE from overlay, then drag to new slot</p>
                  </div>
                </div>

                {/* Park */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-400">Park</h3>
                  <p className="text-sm opacity-80">Move to parked section</p>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <p className="text-xs">Select PARK from overlay to move to top section</p>
                  </div>
                </div>
              </div>

              <div className="border-t theme-border pt-4">
                <h3 className="font-semibold mb-2">Parked Appointments</h3>
                <p className="text-sm opacity-80">
                  Parked appointments appear at the top of the calendar. Double-click a parked appointment to return it to the original location or delete it.
                </p>
              </div>

              <div className="border-t theme-border pt-4">
                <h3 className="font-semibold mb-2">Tips</h3>
                <ul className="text-sm opacity-80 space-y-1">
                  <li>• Long press timing is 800ms for options overlay</li>
                  <li>• All interactions work on both desktop and mobile</li>
                  <li>• Visual feedback shows when interactions are active</li>
                  <li>• Changes sync in real-time across all connected devices</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Park Confirmation Modal */}
      {showParkConfirmation && parkedAppointmentToMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b theme-border">
              <h2 className="text-xl font-semibold theme-text">Move Parked Appointment?</h2>
              <button
                onClick={() => {
                  setShowParkConfirmation(false)
                  setParkedAppointmentToMove(null)
                  setTargetDateForMove(null)
                  setTargetTimeForMove(null)
                }}
                className="theme-text opacity-70 hover:opacity-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 theme-text">
              <div className="space-y-3">
                <div>
                  <strong>Appointment:</strong> {parkedAppointmentToMove.clients?.full_name || parkedAppointmentToMove.client_name || 'Unknown'}
                </div>
                <div>
                  <strong>Service:</strong> {parkedAppointmentToMove.services?.name || parkedAppointmentToMove.service_name || 'Service'}
                </div>
                <div>
                  <strong>New Date:</strong> {new Date(targetDateForMove).toLocaleDateString()}
                </div>
                <div>
                  <strong>New Time:</strong> {targetTimeForMove}
                </div>
                <div className="text-yellow-600 dark:text-yellow-400 font-medium mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  Are you sure you want to move this parked appointment to the new location?
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowParkConfirmation(false)
                    setParkedAppointmentToMove(null)
                    setTargetDateForMove(null)
                    setTargetTimeForMove(null)
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMoveParkedAppointment(parkedAppointmentToMove, targetDateForMove, targetTimeForMove)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Move Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Confirmation Modal */}
      {showMoveConfirmation && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b theme-border">
              <h2 className="text-xl font-semibold theme-text">Move Appointment?</h2>
              <button
                onClick={() => setShowMoveConfirmation(false)}
                className="theme-text opacity-70 hover:opacity-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 theme-text">
              <div className="space-y-3">
                <div>
                  <strong>Appointment:</strong> {selectedAppointment.clients?.full_name || selectedAppointment.client_name || 'Unknown'}
                </div>
                <div>
                  <strong>Service:</strong> {selectedAppointment.services?.name || selectedAppointment.service_name || 'Service'}
                </div>
                <div>
                  <strong>Current Time:</strong> {selectedAppointment.appointment_time || formatTime(selectedAppointment.date || selectedAppointment.appointment_date)}
                </div>
                <div className="text-blue-600 dark:text-blue-400 font-medium mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  Are you sure you want to move this appointment? You can drag it to a new time slot after confirmation.
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMoveConfirmation(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveConfirmation}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Start Moving
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