import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  DollarSign,
  Edit,
  Plus,
  User,
  MapPin
} from 'lucide-react'
import { 
  fetchClients, 
  selectClientById,
  updateClient 
} from '../features/clients/clientsSlice'
import { 
  fetchAppointments,
  selectAppointmentsByDate 
} from '../features/appointments/appointmentsSlice'
import { selectProfile } from '../features/auth/authSlice'
import { addSuccess, addError } from '../features/alerts/alertsSlice'
import LoadingSpinner from '../components/shared/LoadingSpinner'

const ClientProfile = () => {
  const dispatch = useDispatch()
  const { id } = useParams()
  const profile = useSelector(selectProfile)
  
  const client = useSelector(state => selectClientById(state, id))
  const clientAppointments = useSelector(state => 
    selectAppointmentsByDate(state, new Date())
  ).filter(apt => apt.client_id === id)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    birthday: '',
    notes: ''
  })

  useEffect(() => {
    dispatch(fetchClients())
    dispatch(fetchAppointments())
  }, [dispatch])

  useEffect(() => {
    if (client) {
      setEditForm({
        full_name: client.full_name || '',
        phone: client.phone || '',
        email: client.email || '',
        birthday: client.birthday || '',
        notes: client.notes || ''
      })
    }
  }, [client])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      await dispatch(updateClient({ id, updates: editForm })).unwrap()
      setIsEditing(false)
      dispatch(addSuccess({
        message: 'Client information updated successfully',
        title: 'Success'
      }))
    } catch (error) {
      dispatch(addError({
        message: error || 'Failed to update client information',
        title: 'Error'
      }))
    }
  }

  const handleCancel = () => {
    setEditForm({
      full_name: client?.full_name || '',
      phone: client?.phone || '',
      email: client?.email || '',
      birthday: client?.birthday || '',
      notes: client?.notes || ''
    })
    setIsEditing(false)
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatBirthday = (dateString) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500">Loading client information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Link>
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Client Profile</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{profile?.full_name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {client.full_name}
                    </h2>
                    <p className="text-gray-500">Client since {formatDate(client.created_at)}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-secondary flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birthday
                    </label>
                    <input
                      type="date"
                      name="birthday"
                      value={editForm.birthday}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={editForm.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="input-field"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="btn-primary flex-1"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{client.phone}</span>
                  </div>
                  
                  {client.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{client.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      Birthday: {formatBirthday(client.birthday)}
                    </span>
                  </div>
                  
                  {client.notes && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                      <p className="text-gray-900 text-sm">{client.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Appointments and Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Today's Appointments
                </h3>
                <Link
                  to="/calendar"
                  className="btn-primary flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Appointment
                </Link>
              </div>
              
              {clientAppointments.length > 0 ? (
                <div className="space-y-3">
                  {clientAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {apt.services?.name || 'No service'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(apt.date)} • {apt.duration || 60} min
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ${apt.price || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          {apt.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments today</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This client has no appointments scheduled for today.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/calendar"
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Appointment
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-primary-50 rounded-lg text-center hover:bg-primary-100 transition-colors">
                  <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-primary-700">Schedule</div>
                </button>
                
                <button className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
                  <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-700">Payment</div>
                </button>
                
                <button className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
                  <Phone className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-blue-700">Call</div>
                </button>
                
                <button className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
                  <Mail className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-purple-700">Message</div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Appointment scheduled
                    </div>
                    <div className="text-xs text-gray-500">
                      Haircut service for tomorrow at 2:00 PM
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    2 hours ago
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Payment received
                    </div>
                    <div className="text-xs text-gray-500">
                      $75.00 for haircut and styling
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    1 day ago
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientProfile 