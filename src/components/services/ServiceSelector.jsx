import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchServices, createService, optimisticCreateService } from '../../features/services/servicesSlice'
import { addSuccess, addError } from '../../features/alerts/alertsSlice'
import { FileText, Plus, ChevronDown, X, DollarSign, Clock } from 'lucide-react'
import LoadingSpinner from '../shared/LoadingSpinner'

const ServiceSelector = ({ selectedService, onServiceSelect, onClose, ...props }) => {
  const dispatch = useDispatch()
  const services = useSelector(state => state.services.services)
  const isLoading = useSelector(state => state.services.isLoading)
  
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 60
  })

  // Load services when component mounts
  useEffect(() => {
    console.log('ServiceSelector: Component mounted, loading services...')
    dispatch(fetchServices())
  }, [dispatch])

  // Load services when dropdown opens if not already loaded
  useEffect(() => {
    if (isOpen && services.length === 0 && !isLoading) {
      console.log('ServiceSelector: Dropdown opened, loading services...')
      dispatch(fetchServices())
    }
  }, [isOpen, services.length, isLoading, dispatch])

  const handleAddService = async () => {
    console.log('ServiceSelector: handleAddService called')
    console.log('ServiceSelector: newService data:', newService)
    
    // Validate required fields
    if (!newService.name.trim()) {
      dispatch(addError({
        message: 'Service name is required',
        title: 'Validation Error'
      }))
      return
    }
    
    if (!newService.price || newService.price <= 0) {
      dispatch(addError({
        message: 'Service price must be greater than 0',
        title: 'Validation Error'
      }))
      return
    }
    
    if (!newService.duration || newService.duration < 15) {
      dispatch(addError({
        message: 'Service duration must be at least 15 minutes',
        title: 'Validation Error'
      }))
      return
    }
    
    try {
      // Create temporary ID for optimistic update
      const tempId = `temp_service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const optimisticService = {
        ...newService,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('ServiceSelector: Applying optimistic update:', optimisticService)
      
      // Apply optimistic update immediately
      dispatch(optimisticCreateService(optimisticService))
      
      // Auto-select the newly created service immediately
      handleServiceSelect(optimisticService)
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Service added successfully',
        title: 'Success'
      }))
      
      // Close form immediately for instant feedback
      setShowAddForm(false)
      setNewService({ name: '', description: '', price: 0, duration: 60 })
      
      console.log('ServiceSelector: Dispatching createService...')
      
      // Perform actual creation
      const result = await dispatch(createService(newService)).unwrap()
      console.log('ServiceSelector: createService result:', result)
      
    } catch (error) {
      console.error('ServiceSelector: Error creating service:', error)
      dispatch(addError({
        message: `Failed to add service: ${error}`,
        title: 'Error'
      }))
    }
  }

  const filteredServices = services.filter(service =>
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleServiceSelect = (service) => {
    onServiceSelect(service)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        data-service-selector="true"
        {...props}
      >
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className={selectedService ? 'text-white' : 'text-gray-400'}>
            {selectedService ? `${selectedService.name} - $${selectedService.price}` : 'Select Service'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Search and Add New */}
          <div className="p-3 border-b border-gray-600">
            <div className="flex items-center mb-2">
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center p-2 text-purple-400 hover:bg-gray-700 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add new
            </button>
          </div>

          {/* Service List */}
          <div className="py-1">
            {isLoading ? (
              <div className="p-3 text-center text-gray-400">
                <LoadingSpinner />
                Loading services...
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-3 text-center text-gray-400">
                {searchTerm ? 'No services found matching your search' : 'No services available'}
              </div>
            ) : (
              filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="w-full flex items-center p-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-white">{service.name}</div>
                    <div className="text-sm text-gray-400 flex items-center space-x-4">
                      <span className="flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        ${service.price}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add New Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h2 className="text-lg font-semibold text-white">Add New Service</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Duration (min) *
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={newService.duration}
                    onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceSelector 