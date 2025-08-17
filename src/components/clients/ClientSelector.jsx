import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchClients, createClient, optimisticCreateClient } from '../../features/clients/clientsSlice'
import { addSuccess, addError } from '../../features/alerts/alertsSlice'
import { User, Plus, ChevronDown, X, Camera } from 'lucide-react'
import LoadingSpinner from '../shared/LoadingSpinner'

const ClientSelector = ({ selectedClient, onClientSelect, onClose, ...props }) => {
  const dispatch = useDispatch()
  const clients = useSelector(state => state.clients.clients)
  const isLoading = useSelector(state => state.clients.isLoading)
  
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newClient, setNewClient] = useState({
    full_name: '',
    phone: '',
    email: '',
    birthday: ''
  })
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Load clients when component mounts
  useEffect(() => {
    console.log('ClientSelector: Component mounted, loading clients...')
    dispatch(fetchClients())
  }, [dispatch])

  // Load clients when dropdown opens if not already loaded
  useEffect(() => {
    if (isOpen && clients.length === 0 && !isLoading) {
      console.log('ClientSelector: Dropdown opened, loading clients...')
      dispatch(fetchClients())
    }
  }, [isOpen, clients.length, isLoading, dispatch])

  const handleAddClient = async () => {
    console.log('ClientSelector: handleAddClient called')
    console.log('ClientSelector: newClient data:', newClient)
    
    // Validate required fields
    if (!newClient.full_name.trim()) {
      dispatch(addError({
        message: 'Client name is required',
        title: 'Validation Error'
      }))
      return
    }
    
    try {
      // Create temporary ID for optimistic update
      const tempId = `temp_client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create client data with profile image
      const clientData = {
        ...newClient,
        profile_image: imagePreview // Add the profile image URL
      }
      
      const optimisticClient = {
        ...clientData,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('ClientSelector: Applying optimistic update:', optimisticClient)
      
      // Apply optimistic update immediately
      dispatch(optimisticCreateClient(optimisticClient))
      
      // Auto-select the newly created client immediately
      handleClientSelect(optimisticClient)
      
      // Show success message immediately
      dispatch(addSuccess({
        message: 'Client added successfully',
        title: 'Success'
      }))
      
      // Close form immediately for instant feedback
      setShowAddForm(false)
      setNewClient({ full_name: '', phone: '', email: '', birthday: '' })
      setProfileImage(null)
      setImagePreview(null)
      
      console.log('ClientSelector: Dispatching createClient...')
      
      // Perform actual creation
      const result = await dispatch(createClient(clientData)).unwrap()
      console.log('ClientSelector: createClient result:', result)
      
    } catch (error) {
      console.error('ClientSelector: Error creating client:', error)
      dispatch(addError({
        message: `Failed to add client: ${error}`,
        title: 'Error'
      }))
    }
  }

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleClientSelect = (client) => {
    onClientSelect(client)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        dispatch(addError({
          message: 'Please select a valid image file',
          title: 'Invalid File Type'
        }))
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        dispatch(addError({
          message: 'Image size should be less than 5MB',
          title: 'File Too Large'
        }))
        return
      }
      
      setProfileImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setProfileImage(null)
    setImagePreview(null)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        data-client-selector="true"
        {...props}
      >
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center mr-2 overflow-hidden">
            {selectedClient?.profile_image ? (
              <img 
                src={selectedClient.profile_image} 
                alt={selectedClient.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-3 h-3 text-gray-400" />
            )}
          </div>
          <span className={selectedClient ? 'text-white' : 'text-gray-400'}>
            {selectedClient ? selectedClient.full_name : 'Select Customer'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Header */}
          <div className="p-3 border-b border-gray-600">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Custom list</h3>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center p-2 text-blue-400 hover:bg-gray-700 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add new
            </button>
          </div>

          {/* Client List */}
          <div className="py-1">
            {isLoading ? (
              <div className="p-3 text-center text-gray-400">
                <LoadingSpinner />
                Loading clients...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-3 text-center text-gray-400">
                No clients available
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full flex items-center p-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                    {client.profile_image ? (
                      <img 
                        src={client.profile_image} 
                        alt={client.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">{client.full_name}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add New Client Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white">New Customer</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                    <Camera className="w-3 h-3 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      onClick={removeImage}
                      className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newClient.full_name}
                  onChange={(e) => setNewClient({...newClient, full_name: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Pronouns
                </label>
                <input
                  type="text"
                  value={newClient.pronouns || ''}
                  onChange={(e) => setNewClient({...newClient, pronouns: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Birthday
                </label>
                <input
                  type="date"
                  value={newClient.birthday}
                  onChange={(e) => setNewClient({...newClient, birthday: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter a birthday you turn on birthday emails in Booking & Notifications so your clients can receive a beautiful birthday email from your on their birthday!
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleAddClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientSelector 