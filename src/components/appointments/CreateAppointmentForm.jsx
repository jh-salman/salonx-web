import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createAppointment, updateAppointment } from '../../features/appointments/appointmentsSlice'
import { fetchClients } from '../../features/clients/clientsSlice'
import { fetchServices } from '../../features/services/servicesSlice'
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
    
    console.log('CreateAppointmentForm: Initial form data:', initialData)
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
      console.log('CreateAppointmentForm: Form not valid - data is loading')
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
    
    console.log('CreateAppointmentForm: isFormValid check:', {
      client_id: formData.client_id,
      service_id: formData.service_id,
      date: formData.date,
      duration: formData.duration,
      price: formData.price,
      clientsLoading,
      servicesLoading,
      clientsCount: clients.length,
      servicesCount: services.length,
      isValid: isValid
    })
    
    return isValid
  }

  // Fetch clients and services on component mount
  useEffect(() => {
    console.log('CreateAppointmentForm: Component mounted, loading data...')
    console.log('CreateAppointmentForm: Current clients count:', clients.length)
    console.log('CreateAppointmentForm: Current services count:', services.length)
    
    // Load data when component mounts
    const loadData = async () => {
      try {
        // Load clients if not already loaded
        if (clients.length === 0 && !clientsLoading) {
          console.log('CreateAppointmentForm: Loading clients...')
          await dispatch(fetchClients()).unwrap()
          console.log('CreateAppointmentForm: Clients loaded successfully')
        } else {
          console.log('CreateAppointmentForm: Clients already loaded, skipping fetch')
        }
        
        // Load services if not already loaded
        if (services.length === 0 && !servicesLoading) {
          console.log('CreateAppointmentForm: Loading services...')
          await dispatch(fetchServices()).unwrap()
          console.log('CreateAppointmentForm: Services loaded successfully')
        } else {
          console.log('CreateAppointmentForm: Services already loaded, skipping fetch')
        }
      } catch (error) {
        console.error('CreateAppointmentForm: Error loading data:', error)
      }
    }
    
    loadData()
  }, [dispatch])

  // Debug effect to monitor loading states
  useEffect(() => {
    console.log('CreateAppointmentForm: Loading states changed:', {
      clientsLoading,
      servicesLoading,
      clientsCount: clients.length,
      servicesCount: services.length,
      formValid: isFormValid()
    })
  }, [clientsLoading, servicesLoading, clients.length, services.length])

  // Set selected client and service when editing
  useEffect(() => {
    if (isEditing && appointment && clients.length > 0 && services.length > 0) {
      const client = clients.find(c => c.id === appointment.client_id)
      const service = services.find(s => s.id === appointment.service_id)
      
      if (client) {
        setSelectedClient(client)
        console.log('CreateAppointmentForm: Set selected client:', client)
      }
      
      if (service) {
        setSelectedService(service)
        console.log('CreateAppointmentForm: Set selected service:', service)
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

    console.log('CreateAppointmentForm: Validation errors:', newErrors)
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
        created_by: profile.id
      }

      if (onSubmit) {
        // Use custom onSubmit if provided (for calendar integration)
        await onSubmit(appointmentData)
      } else if (isEditing) {
        // Handle editing
        await dispatch(updateAppointment({
          id: appointment.id,
          updates: appointmentData
        })).unwrap()
        dispatch(addSuccess('Appointment updated successfully!'))
      } else {
        // Handle creating
        await dispatch(createAppointment(appointmentData)).unwrap()
        dispatch(addSuccess('Appointment created successfully!'))
      }
      
      onClose()
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Failed to create appointment'
      dispatch(addError(`Failed to create appointment: ${errorMessage}`))
    }
  }

  const handleClientSelect = (client) => {
    console.log('CreateAppointmentForm: Client selected:', client)
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
    console.log('CreateAppointmentForm: Service selected:', service)
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
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Appointment' : 'Create New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Loading Indicator */}
          {(clientsLoading || servicesLoading) && (
            <div className="bg-blue-900 border border-blue-700 rounded-md p-4 mb-4">
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
            <label className="block text-sm font-medium text-gray-300">
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
            <label className="block text-sm font-medium text-gray-300">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.duration ? 'border-red-500' : 'border-gray-600'
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Appointment Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="normal" className="bg-gray-700 text-white">Normal</option>
                <option value="consultation" className="bg-gray-700 text-white">Consultation</option>
                <option value="follow_up" className="bg-gray-700 text-white">Follow Up</option>
              </select>
            </div>
          </div>

          {/* Deposit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deposit Percentage (%)
            </label>
            <input
              type="number"
              name="deposit_percent"
              value={formData.deposit_percent}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Any special instructions or notes..."
            />
          </div>

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-900 p-4 rounded-md text-xs text-gray-400">
              <h4 className="font-medium mb-2">Debug Info:</h4>
              <div className="space-y-1">
                <div>Client ID: {formData.client_id || 'Not selected'}</div>
                <div>Service ID: {formData.service_id || 'Not selected'}</div>
                <div>Selected Client: {selectedClient?.full_name || 'None'}</div>
                <div>Selected Service: {selectedService?.name || 'None'}</div>
                <div>Form Valid: {isFormValid() ? 'Yes' : 'No'}</div>
                <div>Clients Count: {clients.length}</div>
                <div>Services Count: {services.length}</div>
              </div>
            </div>
          )}

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Debug Info:</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Clients Loading: {clientsLoading ? 'Yes' : 'No'}</div>
                <div>Services Loading: {servicesLoading ? 'Yes' : 'No'}</div>
                <div>Clients Count: {clients.length}</div>
                <div>Services Count: {services.length}</div>
                <div>Selected Client ID: {formData.client_id || 'None'}</div>
                <div>Selected Service ID: {formData.service_id || 'None'}</div>
                <div>Form Valid: {isFormValid() ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid() || clientsLoading || servicesLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : 
               clientsLoading || servicesLoading ? 'Loading data...' :
               (isEditing ? 'Update Appointment' : 'Create Appointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAppointmentForm 