import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectProfile, selectMode } from '../features/auth/authSlice'
import { selectAppointments, createAppointment } from '../features/appointments/appointmentsSlice'
import { selectClients } from '../features/clients/clientsSlice'
import { selectServices } from '../features/services/servicesSlice'
import CustomCalendar from '../components/calendar/CustomCalendar'
import SignoutButton from '../components/SignoutButton'
import { Plus, Calendar as CalendarIcon, Clock, User, Scissors, LogOut } from 'lucide-react'

const Calendar = () => {
  const dispatch = useDispatch()
  const profile = useSelector(selectProfile)
  const mode = useSelector(selectMode)
  const appointments = useSelector(selectAppointments)
  const clients = useSelector(selectClients)
  const services = useSelector(selectServices)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  })

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ]

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setFormData(prev => ({
      ...prev,
      appointment_date: date
    }))
    setShowCreateModal(true)
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setFormData(prev => ({
      ...prev,
      appointment_time: time
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateAppointment = async (e) => {
    e.preventDefault()
    
    try {
      await dispatch(createAppointment(formData)).unwrap()
      setShowCreateModal(false)
      setFormData({
        client_id: '',
        service_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      })
      setSelectedDate(null)
      setSelectedTime('')
    } catch (error) {
      console.error('Failed to create appointment:', error)
    }
  }

  const getAvailableTimeSlots = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    const existingAppointments = appointments.filter(apt => 
      apt.appointment_date === dateStr
    )
    const bookedTimes = existingAppointments.map(apt => apt.appointment_time)
    return timeSlots.filter(time => !bookedTimes.includes(time))
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-white">SalonX</h1>
              </div>
              <nav className="ml-10 flex space-x-8">
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/calendar"
                  className="text-purple-400 border-b-2 border-purple-400 px-1 pt-1 text-sm font-medium"
                >
                  Calendar
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 neon-purple"
              >
                <Plus className="w-4 h-4" />
                <span>New Appointment</span>
              </button>
              <div className="text-sm text-gray-300">
                <span className="font-medium">{profile?.full_name}</span>
              </div>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Appointments</p>
                <p className="text-2xl font-bold text-white">{appointments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Today's Appointments</p>
                <p className="text-2xl font-bold text-white">
                  {appointments.filter(apt => apt.appointment_date === new Date().toISOString().split('T')[0]).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="w-8 h-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Clients</p>
                <p className="text-2xl font-bold text-white">{clients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Scissors className="w-8 h-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Services</p>
                <p className="text-2xl font-bold text-white">{services.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <CustomCalendar onDateSelect={handleDateSelect} />
        </div>
      </div>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Appointment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time
                </label>
                <select
                  name="appointment_time"
                  value={formData.appointment_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                >
                  <option value="" className="bg-gray-700 text-white">Select time</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time} className="bg-gray-700 text-white">{time}</option>
                  ))}
                </select>
              </div>

              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client
                </label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                >
                  <option value="" className="bg-gray-700 text-white">Select client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id} className="bg-gray-700 text-white">
                      {client.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service
                </label>
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                >
                  <option value="" className="bg-gray-700 text-white">Select service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id} className="bg-gray-700 text-white">
                      {service.name} - ${service.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Any special notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar 