import React from 'react'
import { Calendar, Clock, User, Scissors, MapPin } from 'lucide-react'
import { getAppointmentColorClass } from '../../features/appointments/appointmentsSlice'
import AppointmentActions from './AppointmentActions'

const AppointmentCard = ({ appointment, onEdit, className = '' }) => {
  const appointmentColorClass = getAppointmentColorClass(appointment)
  const isParked = appointment.parked || appointment.status === 'parked'

  const formatTime = (time) => {
    if (!time) return ''
    return time.substring(0, 5) // Show only HH:MM
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusText = (status) => {
    const statusMap = {
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
      parked: 'Parked'
    }
    return statusMap[status] || 'Scheduled'
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className} ${isParked ? 'opacity-75' : ''}`}>
      {/* Header with status color */}
      <div className={`${appointmentColorClass} -m-4 mb-3 p-4 rounded-t-lg`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-white font-medium">
              {formatDate(appointment.appointment_date)}
            </span>
          </div>
          <AppointmentActions 
            appointment={appointment} 
            onEdit={onEdit}
            className="text-white"
          />
        </div>
      </div>

      {/* Appointment Details */}
      <div className="space-y-3">
        {/* Time */}
        <div className="flex items-center space-x-2 text-gray-300">
          <Clock className="w-4 h-4" />
          <span>{formatTime(appointment.appointment_time)}</span>
        </div>

        {/* Client */}
        <div className="flex items-center space-x-2 text-gray-300">
          <User className="w-4 h-4" />
          <span>{appointment.clients?.full_name || 'Unknown Client'}</span>
        </div>

        {/* Service */}
        <div className="flex items-center space-x-2 text-gray-300">
          <Scissors className="w-4 h-4" />
          <span>{appointment.services?.name || 'Unknown Service'}</span>
        </div>

        {/* Location */}
        {appointment.location && (
          <div className="flex items-center space-x-2 text-gray-300">
            <MapPin className="w-4 h-4" />
            <span>{appointment.location}</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointmentColorClass} text-white`}>
            {getStatusText(appointment.status)}
          </span>
          
          {/* Price */}
          {appointment.services?.price && (
            <span className="text-green-400 font-medium">
              ${appointment.services.price}
            </span>
          )}
        </div>

        {/* Parked Indicator */}
        {isParked && (
          <div className="mt-2 p-2 bg-purple-900 bg-opacity-50 rounded border border-purple-600">
            <div className="flex items-center space-x-2 text-purple-300">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Parked</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentCard 