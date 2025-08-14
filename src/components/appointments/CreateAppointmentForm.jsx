import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  createAppointment, 
  updateAppointment, 
  resetLoadingState,
  optimisticCreateAppointment,
  optimisticUpdateAppointment
} from '../../features/appointments/appointmentsSlice'
import { fetchClients, resetLoadingState as resetClientsLoading } from '../../features/clients/clientsSlice'
import { fetchServices, resetLoadingState as resetServicesLoading } from '../../features/services/servicesSlice'
import { addSuccess, addError } from '../../features/alerts/alertsSlice'
import { Calendar, Clock, User, DollarSign, FileText, X } from 'lucide-react'
import ClientSelector from '../clients/ClientSelector'
import ServiceSelector from '../services/ServiceSelector'
import LoadingSpinner from '../shared/LoadingSpinner'

const CreateAppointmentForm = ({ onClose, selectedDate = null, appointment = null, onSubmit = null, isEditing = false }) => {
  const dispatch = useDispatch()
  const { isLoading } = useSelector(state => state.appointments)
  const { clients, isLoading: clientsLoading } = useSelector(state => state.clients)
  const { services, isLoading: servicesLoading } = useSelector(state => state.services)
  const { profile } = useSelector(state => state.auth)

  // Initialize form data based on whether we're editing or creating
  const getInitialFormData = () => {
    let initialData
    
    if (isEditing && appointment) {
      initialData = {
        client_id: appointment.client_id || '',
        service_id: appointment.service_id || '',
        date: new Date(appointment.date).toISOString().slice(0, 16),
        duration: appointment.duration || 60,
        price: appointment.price || 0,
        type: appointment.type || 'normal',
        deposit_percent: appointment.deposit_percent || 0,
        notes: appointment.notes || ''
      }
    } else {
      initialData = {
        client_id: '',
        service_id: '',
        date: selectedDate ? new Date(selectedDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        duration: 60,
        price: 50, // Set default price to enable button
        type: 'normal',
        deposit_percent: 0,
        notes: ''
      }
    }
    

    return initialData
  }

  const [formData, setFormData] = useState(getInitialFormData())

  const [errors, setErrors] = useState({})
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedService, setSelectedService] = useState(null)

  // Check if form is valid for enabling submit button
  const isFormValid = () => {
    // Don't allow submission while loading
    if (clientsLoading || servicesLoading) {
      return false
    }
    
    // Check all required fields
    const isValid = (
      formData.client_id &&
      formData.service_id &&
      formData.date &&
      formData.duration >= 15 &&
      formData.price > 0
    )
    
    return isValid
  }

  // Fetch clients and services on component mount
  useEffect(() => {
    // Load data when component mounts
    const loadData = async () => {
      try {
        // Load clients if not already loaded
        if (clients.length === 0 && !clientsLoading) {
          await dispatch(fetchClients()).unwrap()
        }
        
        // Load services if not already loaded
        if (services.length === 0 && !servicesLoading) {
          await dispatch(fetchServices()).unwrap()
        }
      } catch (error) {
        console.error('CreateAppointmentForm: Error loading data:', error)
      }
    }
    
    loadData()
  }, [dispatch])



  // Reset loading states if data is available but loading is still true
  useEffect(() => {
    if (clientsLoading && clients.length > 0) {
      dispatch(resetClientsLoading())
    }
    if (servicesLoading && services.length > 0) {
      dispatch(resetServicesLoading())
    }
  }, [clientsLoading, servicesLoading, clients.length, services.length, dispatch])

  // Force reset loading states after a timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (clientsLoading && clients.length > 0) {
        dispatch(resetClientsLoading())
      }
      if (servicesLoading && services.length > 0) {
        dispatch(resetServicesLoading())
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [clientsLoading, servicesLoading, clients.length, services.length, dispatch])

  // Reset appointments loading state after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        dispatch(resetLoadingState())
      }
    }, 10000) // 10 second timeout for appointment operations

    return () => clearTimeout(timeout)
  }, [isLoading, dispatch])

  // Set selected client and service when editing
  useEffect(() => {
    if (isEditing && appointment && clients.length > 0 && services.length > 0) {
      const client = clients.find(c => c.id === appointment.client_id)
      const service = services.find(s => s.id === appointment.service_id)
      
      if (client) {
        setSelectedClient(client)
      }
      
      if (service) {
        setSelectedService(service)
      }
    }
  }, [isEditing, appointment, clients, services])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.client_id) {
      newErrors.client_id = 'Please select a client'
    }
    if (!formData.service_id) {
      newErrors.service_id = 'Please select a service'
    }
    if (!formData.date) {
      newErrors.date = 'Date and time are required'
    }
    if (!formData.duration || formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes'
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }

    // Additional validation for selected items
    if (!selectedClient) {
      newErrors.client_id = 'Please select a client'
    }
    if (!selectedService) {
      newErrors.service_id = 'Please select a service'
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const appointmentData = {
        ...formData,
        stylist_id: profile.id,
        brand_id: profile.brand_id
      }

      if (onSubmit) {
        // Use custom onSubmit if provided (for calendar integration)
        await onSubmit(appointmentData)
      } else if (isEditing) {
        // Handle editing with optimistic update
        // Apply optimistic update immediately
        dispatch(optimisticUpdateAppointment({
          id: appointment.id,
          updates: appointmentData
        }))
        
        // Show success message immediately
        dispatch(addSuccess('Appointment updated successfully!'))
        
        // Close modal immediately for instant feedback
        onClose()
        
        // Perform actual update
        await dispatch(updateAppointment({
          id: appointment.id,
          updates: appointmentData
        })).unwrap()
      } else {
        // Handle creating with optimistic update
        // Create a temporary ID for optimistic update
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Get client and service data for better optimistic update
        const selectedClient = clients.find(c => c.id === appointmentData.client_id)
        const selectedService = services.find(s => s.id === appointmentData.service_id)
        
        const optimisticAppointment = {
          ...appointmentData,
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
        
        // Show success message immediately
        dispatch(addSuccess('Appointment created successfully!'))
        
        // Close modal immediately for instant feedback
        onClose()
        
        // Perform actual creation
        await dispatch(createAppointment(appointmentData)).unwrap()
      }
      
      // Reset loading state after successful submission
      dispatch(resetLoadingState())
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Failed to create appointment'
      dispatch(addError(`Failed to create appointment: ${errorMessage}`))
      // Reset loading state on error
      dispatch(resetLoadingState())
    }
  }

  const handleClientSelect = (client) => {

    setSelectedClient(client)
    setFormData(prev => ({
      ...prev,
      client_id: client.id
    }))
    // Clear error when client is selected
    if (errors.client_id) {
      setErrors(prev => ({
        ...prev,
        client_id: ''
      }))
    }
  }

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    setFormData(prev => ({
      ...prev,
      service_id: service.id,
      price: service.price || 0,
      duration: service.duration || 60
    }))
    // Clear error when service is selected
    if (errors.service_id) {
      setErrors(prev => ({
        ...prev,
        service_id: ''
      }))
    }
  }

  const handleServiceChange = (e) => {
    const serviceId = e.target.value
    const selectedService = services.find(s => s.id === serviceId)
    
    setFormData(prev => ({
      ...prev,
      service_id: serviceId,
      duration: selectedService?.duration || 60,
      price: selectedService?.price || 0
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="theme-modal rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border theme-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b theme-border">
          <h2 className="text-2xl font-bold theme-text">
            {isEditing ? 'Edit Appointment' : 'Create New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="theme-text opacity-70 hover:opacity-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Loading Indicator */}
          {(clientsLoading || servicesLoading) && (
            <div className="theme-card border theme-border rounded-md p-4 mb-4">
              <LoadingSpinner 
                color="blue" 
                text={clientsLoading && servicesLoading ? 'Loading clients and services...' :
                      clientsLoading ? 'Loading clients...' :
                      'Loading services...'}
              />
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium theme-text">
              Customer *
            </label>
            <div className={`${errors.client_id ? 'border-red-500' : ''}`}>
              <ClientSelector
                selectedClient={selectedClient}
                onClientSelect={handleClientSelect}
                onClose={() => {}}
                data-client-selector="true"
              />
            </div>
            {errors.client_id && (
              <p className="text-red-500 text-sm">{errors.client_id}</p>
            )}
            {clientsLoading && (
              <p className="text-blue-400 text-sm">Loading clients...</p>
            )}
            {!clientsLoading && clients.length === 0 && (
              <div className="bg-yellow-900 border border-yellow-700 rounded-md p-3">
                <p className="text-yellow-300 text-sm">No clients available. Please create a client first.</p>
                <button
                  type="button"
                  onClick={() => {
                    // This will trigger the ClientSelector to show the add form
                    const clientSelector = document.querySelector('[data-client-selector]')
                    if (clientSelector) {
                      clientSelector.click()
                    }
                  }}
                  className="text-yellow-400 hover:text-yellow-300 text-sm underline mt-1"
                >
                  Create your first client
                </button>
              </div>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium theme-text">
              Service *
            </label>
            <div className={`${errors.service_id ? 'border-red-500' : ''}`}>
              <ServiceSelector
                selectedService={selectedService}
                onServiceSelect={handleServiceSelect}
                onClose={() => {}}
                data-service-selector="true"
              />
            </div>
            {errors.service_id && (
              <p className="text-red-500 text-sm">{errors.service_id}</p>
            )}
            {servicesLoading && (
              <p className="text-blue-400 text-sm">Loading services...</p>
            )}
            {!servicesLoading && services.length === 0 && (
              <div className="bg-yellow-900 border border-yellow-700 rounded-md p-3">
                <p className="text-yellow-300 text-sm">No services available. Please create a service first.</p>
                <button
                  type="button"
                  onClick={() => {
                    // This will trigger the ServiceSelector to show the add form
                    const serviceSelector = document.querySelector('[data-service-selector]')
                    if (serviceSelector) {
                      serviceSelector.click()
                    }
                  }}
                  className="text-yellow-400 hover:text-yellow-300 text-sm underline mt-1"
                >
                  Create your first service
                </button>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium theme-text mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 theme-input border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.date ? 'border-red-500' : 'theme-border'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium theme-text mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="15"
                step="15"
                className={`w-full px-3 py-2 theme-input border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.duration ? 'border-red-500' : 'theme-border'
                }`}
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Price and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium theme-text mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 theme-input border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.price ? 'border-red-500' : 'theme-border'
                }`}
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium theme-text mb-2">
                Appointment Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 theme-input border theme-border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="normal" className="theme-input theme-text">Normal</option>
                <option value="consultation" className="theme-input theme-text">Consultation</option>
                <option value="follow_up" className="theme-input theme-text">Follow Up</option>
              </select>
            </div>
          </div>

          {/* Deposit */}
          <div>
            <label className="block text-sm font-medium theme-text mb-2">
              Deposit Percentage (%)
            </label>
            <input
              type="number"
              name="deposit_percent"
              value={formData.deposit_percent}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="w-full px-3 py-2 theme-input border theme-border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium theme-text mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 theme-input border theme-border rounded-md theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Any special instructions or notes..."
            />
          </div>



          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t theme-border">
            <button
              type="button"
              onClick={() => {
                dispatch(resetClientsLoading())
                dispatch(resetServicesLoading())
                dispatch(resetLoadingState())
              }}
              className="px-2 py-1 text-xs theme-text opacity-70 theme-card rounded border theme-border hover:opacity-80"
            >
              Reset Loading
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 theme-text theme-card rounded-md hover:opacity-80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="px-4 py-2 theme-gradient text-white rounded-md theme-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[140px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Appointment' : 'Create Appointment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAppointmentForm 