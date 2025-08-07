import React, { useState, useCallback, useMemo } from 'react'
import { Calendar } from 'react-big-calendar'
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
  X
} from 'lucide-react'
import CreateAppointmentForm from '../appointments/CreateAppointmentForm'
import ClientSelector from '../clients/ClientSelector'
import ServiceSelector from '../services/ServiceSelector'

// Custom localizer for react-big-calendar
const localizer = {
  format: (date, format) => {
    const d = new Date(date)
    switch (format) {
      case 'MMM dd':
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      case 'MMM dd, yyyy':
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      case 'h:mm a':
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      case 'HH:mm':
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      case 'EEEE':
        return d.toLocaleDateString('en-US', { weekday: 'long' })
      case 'EEEE MMM dd':
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit' })
      default:
        return d.toLocaleDateString('en-US')
    }
  },
  parse: (str) => new Date(str),
  startOfWeek: (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  },
  startOf: (date, unit) => {
    const d = new Date(date)
    switch (unit) {
      case 'day':
        d.setHours(0, 0, 0, 0)
        return d
      case 'week':
        const day = d.getDay()
        const diff = d.getDate() - day
        return new Date(d.setDate(diff))
      case 'month':
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
      case 'year':
        d.setMonth(0, 1)
        d.setHours(0, 0, 0, 0)
        return d
      default:
        return d
    }
  },
  endOf: (date, unit) => {
    const d = new Date(date)
    switch (unit) {
      case 'day':
        d.setHours(23, 59, 59, 999)
        return d
      case 'week':
        const day = d.getDay()
        const diff = 6 - day
        d.setDate(d.getDate() + diff)
        d.setHours(23, 59, 59, 999)
        return d
      case 'month':
        d.setMonth(d.getMonth() + 1, 0)
        d.setHours(23, 59, 59, 999)
        return d
      case 'year':
        d.setMonth(11, 31)
        d.setHours(23, 59, 59, 999)
        return d
      default:
        return d
    }
  },
  getDay: (date) => new Date(date).getDay(),
  addWeeks: (date, weeks) => {
    const d = new Date(date)
    d.setDate(d.getDate() + (weeks * 7))
    return d
  },
  addMonths: (date, months) => {
    const d = new Date(date)
    d.setMonth(d.getMonth() + months)
    return d
  },
  addYears: (date, years) => {
    const d = new Date(date)
    d.setFullYear(d.getFullYear() + years)
    return d
  },
  isSame: (date1, date2, unit = 'day') => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    switch (unit) {
      case 'day':
        return d1.toDateString() === d2.toDateString()
      case 'week':
        const week1 = localizer.startOf(d1, 'week')
        const week2 = localizer.startOf(d2, 'week')
        return week1.toDateString() === week2.toDateString()
      case 'month':
        return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
      case 'year':
        return d1.getFullYear() === d2.getFullYear()
      default:
        return d1.getTime() === d2.getTime()
    }
  },
  range: (start, end, unit = 'day') => {
    const dates = []
    let current = new Date(start)
    const endDate = new Date(end)
    
    while (current <= endDate) {
      dates.push(new Date(current))
      switch (unit) {
        case 'day':
          current.setDate(current.getDate() + 1)
          break
        case 'week':
          current.setDate(current.getDate() + 7)
          break
        case 'month':
          current.setMonth(current.getMonth() + 1)
          break
        case 'year':
          current.setFullYear(current.getFullYear() + 1)
          break
        default:
          current.setDate(current.getDate() + 1)
      }
    }
    
    return dates
  },
  merge: (date, time) => {
    const d = new Date(date)
    const t = new Date(time)
    d.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds())
    return d
  },
  isSameDate: (date1, date2) => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return d1.toDateString() === d2.toDateString()
  },
  add: (date, amount, unit) => {
    const d = new Date(date)
    switch (unit) {
      case 'day':
        d.setDate(d.getDate() + amount)
        break
      case 'week':
        d.setDate(d.getDate() + (amount * 7))
        break
      case 'month':
        d.setMonth(d.getMonth() + amount)
        break
      case 'year':
        d.setFullYear(d.getFullYear() + amount)
        break
      case 'hour':
        d.setHours(d.getHours() + amount)
        break
      case 'minute':
        d.setMinutes(d.getMinutes() + amount)
        break
      default:
        d.setDate(d.getDate() + amount)
    }
    return d
  },
  getTimezoneOffset: () => {
    return new Date().getTimezoneOffset()
  },
  getTotalMin: (date) => {
    const d = new Date(date)
    return d.getHours() * 60 + d.getMinutes()
  },
  getMinutesFromMidnight: (date) => {
    const d = new Date(date)
    return d.getHours() * 60 + d.getMinutes()
  }
}

const AdvancedCalendar = () => {
  const dispatch = useDispatch()
  const appointments = useSelector(selectAppointments)
  const parkedAppointments = useSelector(selectParkedAppointments)
  const profile = useSelector(selectProfile)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false)

  // Convert appointments to calendar events
  const events = useMemo(() => {
    return appointments.map(apt => ({
      id: apt.id,
      title: `${apt.clients?.full_name || 'Unknown Client'} - ${apt.services?.name || 'No Service'}`,
      start: new Date(apt.date),
      end: new Date(new Date(apt.date).getTime() + (apt.duration || 60) * 60000),
      appointment: apt,
      resource: {
        client: apt.clients,
        service: apt.services,
        price: apt.price,
        duration: apt.duration,
        status: apt.status,
        parked: apt.parked
      }
    }))
  }, [appointments])

  // Handle slot selection
  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedSlot({ start, end })
    setShowCreateModal(true)
  }, [])

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    setSelectedAppointment(event.appointment)
    setShowAppointmentDetails(true)
  }, [])

  // Handle appointment creation
  const handleCreateAppointment = useCallback(async (appointmentData) => {
    try {
      const newAppointment = {
        ...appointmentData,
        date: selectedSlot?.start?.toISOString() || new Date().toISOString(),
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
    
    try {
      if (selectedAppointment.parked) {
        await dispatch(unparkAppointment(selectedAppointment.id)).unwrap()
        dispatch(addSuccess({
          message: 'Appointment unparked successfully',
          title: 'Success'
        }))
      } else {
        await dispatch(parkAppointment(selectedAppointment.id)).unwrap()
        dispatch(addSuccess({
          message: 'Appointment parked successfully',
          title: 'Success'
        }))
      }
      setShowAppointmentDetails(false)
      setSelectedAppointment(null)
    } catch (error) {
      dispatch(addError({
        message: `Failed to ${selectedAppointment.parked ? 'unpark' : 'park'} appointment: ${error}`,
        title: 'Error'
      }))
    }
  }, [dispatch, selectedAppointment])

  // Event styling based on status
  const eventStyleGetter = useCallback((event) => {
    let style = {
      backgroundColor: '#3B82F6',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }

    if (event.resource.parked) {
      style.backgroundColor = '#F59E0B'
    } else if (event.resource.status === 'completed') {
      style.backgroundColor = '#10B981'
    } else if (event.resource.status === 'cancelled') {
      style.backgroundColor = '#EF4444'
    }

    return { style }
  }, [])

  // Custom toolbar
  const CustomToolbar = ({ onNavigate, onView, onViewChange, label }) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Today
        </button>
        
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900">{label}</h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onViewChange('month')}
          className={`px-3 py-1 text-sm rounded ${
            onView === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`px-3 py-1 text-sm rounded ${
            onView === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onViewChange('day')}
          className={`px-3 py-1 text-sm rounded ${
            onView === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Day
        </button>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Calendar */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 200px)' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar
          }}
          views={['month', 'week', 'day']}
          defaultView="week"
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
          max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
        />
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
                  onClick={() => {
                    setShowEditModal(true)
                    setShowAppointmentDetails(false)
                  }}
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
                  onClick={handleDeleteAppointment}
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

export default AdvancedCalendar 