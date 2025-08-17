import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectProfile, selectMode } from '../features/auth/authSlice'
import { selectAppointments } from '../features/appointments/appointmentsSlice'
import { selectClients } from '../features/clients/clientsSlice'
import { selectServices } from '../features/services/servicesSlice'


const Dashboard = () => {
  const profile = useSelector(selectProfile)
  const mode = useSelector(selectMode)
  const appointments = useSelector(selectAppointments)
  const clients = useSelector(selectClients)
  const services = useSelector(selectServices)
  
  const [currentTimer, setCurrentTimer] = useState({ minutes: 25, seconds: 0 })
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [totalTime, setTotalTime] = useState(45) // 45 minutes default
  
  // Timer functionality
  useEffect(() => {
    let interval = null
    if (isTimerRunning && currentTimer.minutes > 0) {
      interval = setInterval(() => {
        setCurrentTimer(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 }
          } else if (prev.minutes > 0) {
            return { minutes: prev.minutes - 1, seconds: 59 }
          } else {
            setIsTimerRunning(false)
            return prev
          }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, currentTimer.minutes])
  
  // Reset timer
  const resetTimer = () => {
    setCurrentTimer({ minutes: totalTime, seconds: 0 })
    setIsTimerRunning(false)
  }
  
  // Add time to timer
  const addTime = (hours, minutes) => {
    const newMinutes = currentTimer.minutes + (hours * 60) + minutes
    setCurrentTimer({ minutes: newMinutes, seconds: currentTimer.seconds })
    setTotalTime(newMinutes)
  }
  
  // Get today's appointments
  const today = new Date().toISOString().split('T')[0]
  const todaysAppointments = appointments.filter(apt => 
    apt.appointment_date === today
  )
  
  // Mock performance data
  const performanceData = {
    revenue: 56,
    clientRetention: 72,
    retail: 31,
    serviceGain: 86
  }
  
  // Mock notifications
  const notifications = {
    referrals: 3,
    reviews: 2,
    messages: 7
  }
  
  return (
    <div className="min-h-screen bg-black text-white">

      
      {/* Top Slider */}
      <div className="px-4 py-2">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="bg-purple-500 h-2 rounded-full w-1/3"></div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Stylist Profile Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Profile Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">Muse</span>
              </div>
            </div>
            
            {/* Rating */}
            <div className="text-2xl font-bold text-white mb-2">4.97</div>
            <div className="text-xl font-semibold text-white mb-4">{profile?.full_name || 'Tiffany Styles'}</div>
          </div>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold">{performanceData.revenue}%</span>
              </div>
              <div className="text-xs text-gray-400">REVENUE</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold">{performanceData.clientRetention}%</span>
              </div>
              <div className="text-xs text-gray-400">CLIENT RETENTION</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold">{performanceData.retail}%</span>
              </div>
              <div className="text-xs text-gray-400">RETAIL</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold">{performanceData.serviceGain}%</span>
              </div>
              <div className="text-xs text-gray-400">SERVICE GAIN</div>
            </div>
          </div>
        </div>
        
        {/* Brand Integration */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded mr-3 flex items-center justify-center">
              <span className="text-xs font-bold">SLIME</span>
            </div>
            <span className="text-white font-semibold">L3VEL3</span>
          </div>
          <span className="text-2xl">+</span>
          <span className="text-2xl font-bold">X</span>
        </div>
        
        {/* Current Client Timer */}
        {todaysAppointments.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold mb-2">
                {todaysAppointments[0]?.client_name || 'Jon Klein'}
              </div>
              <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto relative">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {String(currentTimer.minutes).padStart(2, '0')}:{String(currentTimer.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-300">{totalTime} Mins</div>
                </div>
              </div>
            </div>
            
            {/* Timer Controls */}
            <div className="flex justify-center space-x-4 mb-4">
              <button 
                className={`px-4 py-2 rounded-lg ${isTimerRunning ? 'bg-red-500' : 'bg-green-500'} text-white font-semibold`}
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? 'Pause' : 'Start'}
              </button>
              <button 
                className="px-4 py-2 bg-gray-600 rounded-lg text-white font-semibold"
                onClick={resetTimer}
              >
                Reset
              </button>
            </div>
            
            {/* Timer Adjustment */}
            <div className="flex items-center justify-center space-x-2">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Hours</div>
                <input 
                  type="number" 
                  className="w-12 h-8 bg-gray-700 rounded text-center text-white" 
                  defaultValue="0"
                  min="0"
                  max="12"
                  id="hours-input"
                />
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Min</div>
                <input 
                  type="number" 
                  className="w-12 h-8 bg-gray-700 rounded text-center text-white" 
                  defaultValue="0"
                  min="0"
                  max="59"
                  id="minutes-input"
                />
              </div>
              <button 
                className="px-3 py-2 bg-purple-500 rounded text-white text-sm"
                onClick={() => {
                  const hours = parseInt(document.getElementById('hours-input').value) || 0
                  const minutes = parseInt(document.getElementById('minutes-input').value) || 0
                  addTime(hours, minutes)
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
        
        {/* Appointments List */}
        <div className="space-y-3 mb-6">
          {todaysAppointments.slice(0, 4).map((appointment, index) => (
            <div key={appointment.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-white">
                  {appointment.client_name || `Client ${index + 1}`}
                </div>
                <div className="text-sm text-gray-400">
                  {appointment.service_name || 'Service'} • ${appointment.price || '0'}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">25</span>
                </div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Waiting List */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <h3 className="text-lg font-semibold">Waiting list</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="font-semibold">Client name 1</div>
              <div className="text-sm text-orange-400">{'{Needs attention}'}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="font-semibold">Client name 2</div>
              <div className="text-sm text-orange-400">{'{Needs attention}'}</div>
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="flex space-x-3">
          <Link 
            to="/referrals" 
            className="flex-1 bg-gray-800 rounded-lg p-4 text-center relative"
          >
            <div className="text-lg font-semibold mb-1">Referrals</div>
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mx-auto text-xs font-bold">
              {notifications.referrals}
            </div>
          </Link>
          
          <Link 
            to="/reviews" 
            className="flex-1 bg-gray-800 rounded-lg p-4 text-center relative"
          >
            <div className="text-lg font-semibold mb-1">Reviews</div>
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-xs font-bold">
              {notifications.reviews}
            </div>
          </Link>
          
          <Link 
            to="/messages" 
            className="flex-1 bg-gray-800 rounded-lg p-4 text-center relative"
          >
            <div className="text-lg font-semibold mb-1">Messages</div>
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mx-auto text-xs font-bold">
              {notifications.messages}
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 