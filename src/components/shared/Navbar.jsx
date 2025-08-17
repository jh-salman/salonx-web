import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { 
  Menu, 
  Bell, 
  User,
  Scissors
} from 'lucide-react'
import { selectProfile } from '../../features/auth/authSlice'


const Navbar = ({ onMenuClick }) => {
  const location = useLocation()
  const profile = useSelector(selectProfile)

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/calendar':
        return 'Calendar'
      case '/clients':
        return 'Clients'
      case '/services':
        return 'Services'
      case '/performance':
        return 'Performance'
      case '/settings':
        return 'Settings'
      default:
        return 'SalonX'
    }
  }

  return (
    <nav className="bg-black border-b border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu button and title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-white hover:text-gray-300 hover:bg-gray-800 transition-colors"
              title="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">
                {getPageTitle()}
              </h1>
            </div>
          </div>



          {/* Right side - Notifications, profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 rounded-lg text-white hover:text-gray-300 hover:bg-gray-800 transition-colors relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {profile?.full_name || 'Stylist'}
                </p>
                <p className="text-xs text-gray-300">
                  {profile?.email || 'user@example.com'}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 