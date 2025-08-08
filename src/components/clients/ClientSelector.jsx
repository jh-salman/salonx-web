import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchClients, createClient } from '../../features/clients/clientsSlice'
import { addSuccess, addError } from '../../features/alerts/alertsSlice'
import { User, Plus, ChevronDown, X } from 'lucide-react'
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
      console.log('ClientSelector: Dispatching createClient...')
      const result = await dispatch(createClient(newClient)).unwrap()
      console.log('ClientSelector: createClient result:', result)
      
      // Auto-select the newly created client
      if (result) {
        handleClientSelect(result)
      }
      
      dispatch(addSuccess({
        message: 'Client added successfully',
        title: 'Success'
      }))
      setShowAddForm(false)
      setNewClient({ full_name: '', phone: '', email: '', birthday: '' })
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
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className={selectedClient ? 'text-white' : 'text-gray-400'}>
            {selectedClient ? selectedClient.full_name : 'Select Customer'}
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
                placeholder="Search clients..."
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

          {/* Client List */}
          <div className="py-1">
            {isLoading ? (
              <div className="p-3 text-center text-gray-400">
                <LoadingSpinner />
                Loading clients...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-3 text-center text-gray-400">
                {searchTerm ? 'No clients found matching your search' : 'No clients available'}
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full flex items-center p-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">{client.full_name}</div>
                    {client.phone && (
                      <div className="text-sm text-gray-400">{client.phone}</div>
                    )}
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
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h2 className="text-lg font-semibold text-white">Add New Client</h2>
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClient.full_name}
                  onChange={(e) => setNewClient({...newClient, full_name: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
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
                  onClick={handleAddClient}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Add Client
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