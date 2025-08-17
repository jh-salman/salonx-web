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
import { Calendar, Clock, User, DollarSign, FileText, X, ChevronDown, MapPin, RotateCcw, Paperclip } from 'lucide-react'
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
    console.log('CreateAppointmentForm: getInitialFormData called with:', {
      isEditing,
      appointment: appointment ? { ...appointment, date: appointment.date } : null,
      selectedDate
    })
    
    let initialData
    
    if (isEditing && appointment) {
      // Validate appointment.date before using it
      let dateValue
      try {
        console.log('CreateAppointmentForm: Processing appointment.date:', appointment.date)
        
        if (appointment.date && appointment.date instanceof Date && !isNaN(appointment.date)) {
          console.log('CreateAppointmentForm: appointment.date is valid Date object')
          dateValue = appointment.date.toISOString().slice(0, 16)
        } else if (appointment.date && typeof appointment.date === 'string') {
          console.log('CreateAppointmentForm: appointment.date is string, parsing...')
          const parsedDate = new Date(appointment.date)
          if (!isNaN(parsedDate)) {
            dateValue = parsedDate.toISOString().slice(0, 16)
          } else {
            console.log('CreateAppointmentForm: Failed to parse appointment.date string, using current date')
            dateValue = new Date().toISOString().slice(0, 16)
          }
        } else {
          console.log('CreateAppointmentForm: appointment.date is invalid, using current date')
          dateValue = new Date().toISOString().slice(0, 16)
        }
      } catch (error) {
        console.error('CreateAppointmentForm: Error parsing appointment.date:', error)
        dateValue = new Date().toISOString().slice(0, 16)
      }
      
      initialData = {
        client_id: appointment.client_id || '',
        service_id: appointment.service_id || '',
        date: dateValue,
        duration: appointment.duration || 60,
        price: appointment.price || 0,
        type: appointment.type || 'normal',
        deposit_percent: appointment.deposit_percent || 0,
        notes: appointment.notes || ''
      }
    } else {
      // Validate selectedDate before using it
      let dateValue
      try {
        console.log('CreateAppointmentForm: Processing selectedDate:', selectedDate)
        
        if (selectedDate && selectedDate instanceof Date && !isNaN(selectedDate)) {
          console.log('CreateAppointmentForm: selectedDate is valid Date object')
          dateValue = selectedDate.toISOString().slice(0, 16)
        } else if (selectedDate && typeof selectedDate === 'string') {
          console.log('CreateAppointmentForm: selectedDate is string, parsing...')
          const parsedDate = new Date(selectedDate)
          if (!isNaN(parsedDate)) {
            dateValue = parsedDate.toISOString().slice(0, 16)
          } else {
            console.log('CreateAppointmentForm: Failed to parse selectedDate string, using current date')
            dateValue = new Date().toISOString().slice(0, 16)
          }
        } else {
          console.log('CreateAppointmentForm: selectedDate is invalid, using current date')
          dateValue = new Date().toISOString().slice(0, 16)
        }
      } catch (error) {
        console.error('CreateAppointmentForm: Error parsing selectedDate:', error)
        dateValue = new Date().toISOString().slice(0, 16)
      }
      
      initialData = {
        client_id: '',
        service_id: '',
        date: dateValue,
        duration: 60,
        price: 50, // Set default price to enable button
        type: 'normal',
        deposit_percent: 0,
        notes: ''
      }
    }
    
    console.log('CreateAppointmentForm: Final initialData:', initialData)
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
    
    console.log('CreateAppointmentForm: handleSubmit called')
    console.log('CreateAppointmentForm: formData:', formData)
    console.log('CreateAppointmentForm: profile:', profile)
    
    if (!validateForm()) {
      console.log('CreateAppointmentForm: Form validation failed')
      return
    }

    try {
      console.log('CreateAppointmentForm: Creating appointmentData...')
      const appointmentData = {
        ...formData,
        stylist_id: profile.id,
        brand_id: profile.brand_id
      }
      console.log('CreateAppointmentForm: appointmentData created:', appointmentData)

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
        // Get client and service data for better optimistic update
        const selectedClient = clients.find(c => c.id === appointmentData.client_id)
        const selectedService = services.find(s => s.id === appointmentData.service_id)
        
        // Create a temporary ID for optimistic update
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Validate dates before creating optimistic appointment
        let created_at, updated_at
        try {
          created_at = new Date().toISOString()
          updated_at = new Date().toISOString()
        } catch (error) {
          console.error('CreateAppointmentForm: Error creating dates:', error)
          created_at = new Date().toISOString()
          updated_at = new Date().toISOString()
        }
        
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
          created_at: created_at,
          updated_at: updated_at
        }
        
        console.log('CreateAppointmentForm: Applying optimistic update:', optimisticAppointment)
        
        // Apply optimistic update immediately
        dispatch(optimisticCreateAppointment(optimisticAppointment))
        
        // Show success message immediately
        dispatch(addSuccess('Appointment created successfully!'))
        
        // Close modal immediately for instant feedback
        onClose()
        
        console.log('CreateAppointmentForm: Dispatching createAppointment with data:', appointmentData)
        
        // Perform actual creation
        const result = await dispatch(createAppointment(appointmentData)).unwrap()
        
        console.log('CreateAppointmentForm: Create appointment result:', result)
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
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-900 rounded-t-lg p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">
              New Appointment
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <label className="block text-sm font-medium text-gray-300">
              Select Customer
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
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Select Service
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
          </div>

          {/* Date */}
          <div className="flex items-center p-3 border border-gray-600 rounded-md bg-gray-800">
            <Calendar className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-white flex-1">Date</span>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="bg-transparent text-white text-right outline-none"
              required
            />
          </div>

          {/* Price */}
          <div className="flex items-center p-3 border border-gray-600 rounded-md bg-gray-800">
            <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-white flex-1">Price</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="bg-transparent text-white text-right outline-none"
              placeholder="0"
            />
          </div>

          {/* Duration */}
          <div className="flex items-center p-3 border border-gray-600 rounded-md bg-gray-800">
            <Clock className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-white flex-1">Duration</span>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="15"
              step="15"
              className="bg-transparent text-white text-right outline-none"
              placeholder="60"
            />
          </div>

          {/* Appointment Type */}
          <div className="flex items-center p-3 border border-gray-600 rounded-md bg-gray-800">
            <MapPin className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-white flex-1">Appointment type</span>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="bg-transparent text-white text-right outline-none"
            >
              <option value="normal" className="bg-gray-800 text-white">Normal</option>
              <option value="consultation" className="bg-gray-800 text-white">Consultation</option>
              <option value="follow_up" className="bg-gray-800 text-white">Follow Up</option>
            </select>
          </div>

          {/* Repeat */}
          <div className="flex items-center p-3 border border-gray-600 rounded-md bg-gray-800">
            <RotateCcw className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-white flex-1">Repeat</span>
            <div className="w-10 h-6 bg-gray-600 rounded-full relative">
              <div className="w-4 h-4 bg-gray-400 rounded-full absolute top-1 left-1"></div>
            </div>
          </div>

          {/* Deposit Due */}
          <div className="flex items-center p-3 border border-gray-600 rounded-md bg-gray-800">
            <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-white flex-1">Deposit due</span>
            <span className="text-white">50%</span>
          </div>

          {/* Attachments */}
          <div className="flex items-center p-3 border border-gray-600 rounded-md bg-gray-800">
            <Paperclip className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-white flex-1">Attachments</span>
            <span className="text-blue-400">upload</span>
          </div>

          {/* Notes */}
          <div className="border border-gray-600 rounded-md bg-gray-800">
            <div className="flex justify-between items-center p-3 border-b border-gray-600">
              <span className="text-white">Notes</span>
              <span className="text-white text-sm">{formData.notes?.length || 0}/500</span>
            </div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              maxLength={500}
              rows="3"
              className="w-full p-3 bg-transparent text-white outline-none resize-none"
              placeholder=""
            />
          </div>



          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'BOOK'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-semibold"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAppointmentForm 