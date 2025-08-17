import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  Edit, 
  Park, 
  Play, 
  Trash2, 
  MoreVertical,
  Calendar,
  Clock,
  User,
  Scissors
} from 'lucide-react'
import { 
  updateAppointment, 
  deleteAppointment, 
  parkAppointment, 
  unparkAppointment,
  unparkAppointmentWithDetails,
  fetchAppointments
} from '../../features/appointments/appointmentsSlice'
import { getAppointmentColorClass } from '../../features/appointments/appointmentsSlice'

const AppointmentActions = ({ appointment, onEdit, className = '' }) => {
  const dispatch = useDispatch()
  const { services } = useSelector(state => state.services)
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showParkConfirm, setShowParkConfirm] = useState(false)
  const [showUnparkConfirm, setShowUnparkConfirm] = useState(false)
  const [showUnparkModal, setShowUnparkModal] = useState(false)
  const [showUnparkConfirmModal, setShowUnparkConfirmModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [unparkFormData, setUnparkFormData] = useState({
    service_id: '',
    date: '',
    duration: 60
  })

  const appointmentColorClass = getAppointmentColorClass(appointment)

  const handleEdit = () => {
    console.log('AppointmentActions: Edit clicked for appointment:', appointment.id)
    setShowActions(false)
    if (onEdit) {
      onEdit(appointment)
    }
  }

  const handlePark = async () => {
    console.log('AppointmentActions: Parking appointment:', appointment.id)
    setIsLoading(true)
    setError(null)
    try {
      const result = await dispatch(parkAppointment(appointment.id)).unwrap()
      console.log('AppointmentActions: Park successful:', result)
      setShowParkConfirm(false)
      setShowActions(false)
      // Note: No need to force refresh as realtime will handle the update
    } catch (error) {
      console.error('AppointmentActions: Error parking appointment:', error)
      setError(`Failed to park appointment: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnpark = async () => {
    console.log('AppointmentActions: Unparking appointment:', appointment.id)
    setIsLoading(true)
    setError(null)
    try {
      const result = await dispatch(unparkAppointment(appointment.id)).unwrap()
      console.log('AppointmentActions: Unpark successful:', result)
      setShowUnparkConfirm(false)
      setShowActions(false)
      // Note: No need to force refresh as realtime will handle the update
    } catch (error) {
      console.error('AppointmentActions: Error unparking appointment:', error)
      setError(`Failed to unpark appointment: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnparkConfirm = () => {
    setShowUnparkConfirmModal(false)
    setShowUnparkModal(true)
  }

  const handleUnparkConfirmCancel = () => {
    setShowUnparkConfirmModal(false)
    setShowActions(false)
  }

  const handleUnparkWithDetails = async () => {
    console.log('AppointmentActions: Unparking appointment with details:', appointment.id, unparkFormData)
    setIsLoading(true)
    setError(null)
    try {
      const result = await dispatch(unparkAppointmentWithDetails({
        id: appointment.id,
        serviceId: unparkFormData.service_id,
        date: unparkFormData.date,
        duration: unparkFormData.duration
      })).unwrap()
      console.log('AppointmentActions: Unpark with details successful:', result)
      setShowUnparkModal(false)
      setShowActions(false)
      // Reset form data
      setUnparkFormData({
        service_id: '',
        date: '',
        duration: 60
      })
      // Note: No need to force refresh as realtime will handle the update
    } catch (error) {
      console.error('AppointmentActions: Error unparking appointment with details:', error)
      setError(`Failed to unpark appointment: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    console.log('AppointmentActions: Deleting appointment:', appointment.id)
    setIsLoading(true)
    setError(null)
    try {
      const result = await dispatch(deleteAppointment(appointment.id)).unwrap()
      console.log('AppointmentActions: Delete successful:', result)
      setShowDeleteConfirm(false)
      setShowActions(false)
      // Note: No need to force refresh as realtime will handle the update
    } catch (error) {
      console.error('AppointmentActions: Error deleting appointment:', error)
      setError(`Failed to delete appointment: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const isParked = appointment.parked || appointment.status === 'parked'

  return (
    <div className={`relative ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-red-600 text-white text-xs rounded z-50 max-w-xs">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => setShowActions(!showActions)}
        className={`p-2 rounded-full hover:opacity-80 transition-colors ${appointmentColorClass}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <MoreVertical className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Actions Dropdown */}
      {showActions && (
        <div className="absolute right-0 top-full mt-2 w-48 theme-modal border theme-border rounded-lg shadow-lg z-50">
          <div className="py-2">
            {/* Edit Action */}
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left theme-text hover:opacity-80 flex items-center space-x-2"
              disabled={isLoading}
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>

            {/* Park/Unpark Action */}
            {isParked ? (
              <button
                onClick={() => setShowUnparkConfirmModal(true)}
                className="w-full px-4 py-2 text-left theme-text hover:opacity-80 flex items-center space-x-2"
                disabled={isLoading}
              >
                <Play className="w-4 h-4" />
                <span>Unpark</span>
              </button>
            ) : (
              <button
                onClick={() => setShowParkConfirm(true)}
                className="w-full px-4 py-2 text-left theme-text hover:opacity-80 flex items-center space-x-2"
                disabled={isLoading}
              >
                <Park className="w-4 h-4" />
                <span>Park</span>
              </button>
            )}

            {/* Delete Action */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2 text-left text-red-400 hover:opacity-80 flex items-center space-x-2"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Delete Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Are you sure you want to delete this appointment? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Park Confirmation Modal */}
      {showParkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Park Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Are you sure you want to park this appointment? It will be moved to the parked list.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowParkConfirm(false)}
                className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handlePark}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Parking...
                  </div>
                ) : (
                  'Park'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpark Confirmation Modal */}
      {showUnparkConfirmModal && (
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
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUnparkConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isLoading}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpark Modal with Form */}
      {showUnparkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="theme-modal p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Unpark Appointment</h3>
            <p className="theme-text opacity-70 mb-6">
              Please select the service and time for this appointment.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              handleUnparkWithDetails()
            }} className="space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium theme-text mb-2">
                  Service *
                </label>
                <select
                  value={unparkFormData.service_id}
                  onChange={(e) => setUnparkFormData(prev => ({
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

              {/* Date and Time */}
              <div>
                <label className="block text-sm font-medium theme-text mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={unparkFormData.date}
                  onChange={(e) => setUnparkFormData(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  className="w-full px-3 py-2 theme-input border theme-border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium theme-text mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={unparkFormData.duration}
                  onChange={(e) => setUnparkFormData(prev => ({
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
                  onClick={() => setShowUnparkModal(false)}
                  className="flex-1 px-4 py-2 theme-border border theme-text rounded hover:opacity-80"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Unparking...
                    </div>
                  ) : (
                    'Unpark'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentActions 