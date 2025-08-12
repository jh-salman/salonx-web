import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
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
  fetchAppointments
} from '../../features/appointments/appointmentsSlice'
import { getAppointmentColorClass } from '../../features/appointments/appointmentsSlice'

const AppointmentActions = ({ appointment, onEdit, className = '' }) => {
  const dispatch = useDispatch()
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showParkConfirm, setShowParkConfirm] = useState(false)
  const [showUnparkConfirm, setShowUnparkConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

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
        className={`p-2 rounded-full hover:bg-gray-700 transition-colors ${appointmentColorClass}`}
        disabled={isLoading}
      >
        <MoreVertical className="w-4 h-4 text-white" />
      </button>

      {/* Actions Dropdown */}
      {showActions && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {/* Edit Action */}
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>

            {/* Park/Unpark Action */}
            {isParked ? (
              <button
                onClick={() => setShowUnparkConfirm(true)}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Unpark</span>
              </button>
            ) : (
              <button
                onClick={() => setShowParkConfirm(true)}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
              >
                <Park className="w-4 h-4" />
                <span>Park</span>
              </button>
            )}

            {/* Delete Action */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2"
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
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Appointment</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this appointment? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Park Confirmation Modal */}
      {showParkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Park Appointment</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to park this appointment? It will be moved to the parked list.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowParkConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handlePark}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Parking...' : 'Park'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpark Confirmation Modal */}
      {showUnparkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Unpark Appointment</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to unpark this appointment? It will be moved back to the active list.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUnparkConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUnpark}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Unparking...' : 'Unpark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentActions 