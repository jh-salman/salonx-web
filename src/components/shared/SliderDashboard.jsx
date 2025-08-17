import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Settings,
  TrendingUp,
  User,
  Scissors,
  Home,
  Clock,
  Star,
  X,
  Plus
} from 'lucide-react'
import { selectProfile } from '../../features/auth/authSlice'
import { selectPerformance } from '../../features/performance/performanceSlice'
import { selectAppointments } from '../../features/appointments/appointmentsSlice'
import { selectWaitlist } from '../../features/waitlist/waitlistSlice'
import { selectClients } from '../../features/clients/clientsSlice'
import { selectServices } from '../../features/services/servicesSlice'
import { selectCurrentTheme, setTheme } from '../../features/theme/themeSlice'
import { addSuccess } from '../../features/alerts/alertsSlice'
import { THEME_COLORS } from '../../lib/constants'
import SignoutButton from '../SignoutButton'

const SliderDashboard = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const profile = useSelector(selectProfile)
  const performance = useSelector(selectPerformance)
  const appointments = useSelector(selectAppointments)
  const waitlist = useSelector(selectWaitlist)
  const clients = useSelector(selectClients)
  const services = useSelector(selectServices)
  const currentTheme = useSelector(selectCurrentTheme)

  // Theme colors state
  const [themeColors, setThemeColors] = React.useState(THEME_COLORS[currentTheme] || THEME_COLORS.dark)

  // Update theme colors when theme changes
  React.useEffect(() => {
    setThemeColors(THEME_COLORS[currentTheme] || THEME_COLORS.dark)
  }, [currentTheme])

  // Get theme color function
  const getThemeColor = (colorName, variant = 'base') => {
    const colors = themeColors
    switch (variant) {
      case 'light':
        return colors[colorName]?.replace('linear-gradient', '') || colors[colorName] || '#6b7280'
      case 'medium':
        return colors[colorName]?.replace('linear-gradient', '') || colors[colorName] || '#9ca3af'
      case 'dark':
        return colors[colorName]?.replace('linear-gradient', '') || colors[colorName] || '#374151'
      default:
        return colors[colorName] || '#6b7280'
    }
  }

  const menuItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      color: 'text-blue-500'
    },
    {
      name: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      color: 'text-green-500'
    },
    {
      name: 'Clients',
      icon: Users,
      path: '/clients',
      color: 'text-purple-500'
    },
    {
      name: 'Services',
      icon: Scissors,
      path: '/services',
      color: 'text-orange-500'
    },
    {
      name: 'Performance',
      icon: TrendingUp,
      path: '/performance',
      color: 'text-indigo-500'
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      color: 'text-gray-500'
    }
  ]

  // Calculate stats
  const totalAppointments = appointments?.length || 0
  const todayAppointments = appointments?.filter(apt => {
    const today = new Date().toISOString().split('T')[0]
    const aptDate = apt.appointment_date || apt.date
    return aptDate === today && !apt.parked
  }).length || 0
  const totalClients = clients?.length || 0
  const totalServices = services?.length || 0
  const totalWaitlist = waitlist?.length || 0
  const todayRevenue = performance?.todayRevenue || 0

  const quickStats = [
    {
      name: 'Total Appointments',
      value: totalAppointments,
      icon: Calendar,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      name: 'Today\'s Appointments',
      value: todayAppointments,
      icon: Clock,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      name: 'Total Clients',
      value: totalClients,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      name: 'Services',
      value: totalServices,
      icon: Scissors,
      color: 'bg-orange-500',
      textColor: 'text-orange-500'
    },
    {
      name: 'Waitlist',
      value: totalWaitlist,
      icon: Star,
      color: 'bg-red-500',
      textColor: 'text-red-500'
    },
    {
      name: 'Revenue Today',
      value: `$${todayRevenue}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    }
  ]

  const recentActivity = [
    {
      type: 'appointment',
      message: 'New appointment with Sarah Johnson',
      time: '2 minutes ago',
      icon: Calendar,
      color: 'text-green-500'
    },
    {
      type: 'client',
      message: 'New client registered',
      time: '5 minutes ago',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      type: 'review',
      message: '5-star review received',
      time: '10 minutes ago',
      icon: Star,
      color: 'text-yellow-500'
    }
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slider Dashboard */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-black shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0 bg-black">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                SalonX
              </h2>
              <p className="text-sm text-gray-300">
                {profile?.full_name || 'Stylist'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {/* Navigation Menu */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-white hover:bg-gray-800 transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {quickStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.name}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.name}</p>
                        <p className={`text-lg font-bold ${stat.textColor} truncate`}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Debug Info */}
            <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
              <div>Total Appointments: {totalAppointments}</div>
              <div>Today's Appointments: {todayAppointments}</div>
              <div>Total Clients: {totalClients}</div>
              <div>Services: {totalServices}</div>
              <div>Waitlist: {totalWaitlist}</div>
              <div>Revenue Today: ${todayRevenue}</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-32 overflow-y-auto">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Icon className={`w-4 h-4 mt-1 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{activity.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div 
            className="p-4 border-t border-gray-300 dark:border-gray-600"
          >
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-300"
            >
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  navigate('/calendar')
                  onClose()
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              >
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">View Calendar</span>
              </button>
              <button
                onClick={() => {
                  navigate('/dashboard')
                  onClose()
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              >
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium">View Dashboard</span>
              </button>
              <button
                onClick={() => {
                  onClose()
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              >
                <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium">New Appointment</span>
              </button>
            </div>
          </div>

          {/* Theme Settings */}
          <div 
            className="p-4 border-t border-gray-300 dark:border-gray-600"
          >
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-300"
            >
              Theme Settings
            </h3>
            <div className="space-y-3">
              {/* Current Theme Display */}
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    style={{ 
                      background: `linear-gradient(45deg, ${themeColors.primary}, ${themeColors.secondary})`
                    }}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Current Theme</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {currentTheme || 'light'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {currentTheme === 'dark' ? '🌙' : '☀️'}
                </div>
              </div>

              {/* Advanced Theme Color Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Theme Colors</p>
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
                  >
                    {themeColors.primary === '#1F2937' ? 'Dark' : 
                     themeColors.primary === '#FFFFFF' ? 'White' : 
                     themeColors.primary === '#3B82F6' ? 'Blue' : 
                     themeColors.primary === '#EC4899' ? 'Pink' : 
                     themeColors.primary === '#FCD34D' ? 'Yellow' : 
                     themeColors.primary === '#EF4444' ? 'Red' : 'Custom'}
                  </span>
                </div>
                
                {/* Quick Color Picker */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {Object.entries(themeColors).slice(0, 6).map(([name, color]) => (
                    <button
                      key={name}
                      onClick={() => {
                        const newColors = { ...themeColors }
                        newColors.primary = color
                        setThemeColors(newColors)
                        
                        dispatch(addSuccess({
                          message: `${name.charAt(0).toUpperCase() + name.slice(1)} theme applied`,
                          title: 'Theme Changed'
                        }))
                      }}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={`Set ${name} as primary`}
                    />
                  ))}
                </div>

                {/* Advanced Theme Editor */}
                <button
                  onClick={() => {
                    // Cycle through different color schemes
                    const colorSchemes = [
                      {
                        name: 'Dark',
                        primary: '#1F2937',    // Dark gray
                        secondary: '#374151',  // Darker gray
                        accent: '#6B7280',     // Gray
                        warning: '#F59E0B',    // Amber
                        danger: '#EF4444',     // Red
                        success: '#10B981',    // Green
                        info: '#3B82F6',       // Blue
                        dark: '#111827',       // Darker
                        light: '#F9FAFB',      // Light gray
                        white: '#FFFFFF',      // White
                        pink: '#EC4899',       // Pink
                        yellow: '#FCD34D'      // Yellow
                      },
                      {
                        name: 'White',
                        primary: '#FFFFFF',    // White
                        secondary: '#F3F4F6',  // Light gray
                        accent: '#E5E7EB',     // Gray
                        warning: '#F59E0B',    // Amber
                        danger: '#EF4444',     // Red
                        success: '#10B981',    // Green
                        info: '#3B82F6',       // Blue
                        dark: '#1F2937',       // Dark
                        light: '#F9FAFB',      // Light
                        white: '#FFFFFF',      // White
                        pink: '#EC4899',       // Pink
                        yellow: '#FCD34D'      // Yellow
                      },
                      {
                        name: 'Blue',
                        primary: '#3B82F6',    // Blue
                        secondary: '#1D4ED8',  // Dark blue
                        accent: '#60A5FA',     // Light blue
                        warning: '#F59E0B',    // Amber
                        danger: '#EF4444',     // Red
                        success: '#10B981',    // Green
                        info: '#06B6D4',       // Cyan
                        dark: '#1F2937',       // Dark
                        light: '#F9FAFB',      // Light
                        white: '#FFFFFF',      // White
                        pink: '#EC4899',       // Pink
                        yellow: '#FCD34D'      // Yellow
                      },
                      {
                        name: 'Pink',
                        primary: '#EC4899',    // Pink
                        secondary: '#BE185D',  // Dark pink
                        accent: '#F472B6',     // Light pink
                        warning: '#F59E0B',    // Amber
                        danger: '#EF4444',     // Red
                        success: '#10B981',    // Green
                        info: '#3B82F6',       // Blue
                        dark: '#1F2937',       // Dark
                        light: '#F9FAFB',      // Light
                        white: '#FFFFFF',      // White
                        pink: '#EC4899',       // Pink
                        yellow: '#FCD34D'      // Yellow
                      },
                      {
                        name: 'Yellow',
                        primary: '#FCD34D',    // Yellow
                        secondary: '#F59E0B',  // Amber
                        accent: '#FDE68A',     // Light yellow
                        warning: '#F59E0B',    // Amber
                        danger: '#EF4444',     // Red
                        success: '#10B981',    // Green
                        info: '#3B82F6',       // Blue
                        dark: '#1F2937',       // Dark
                        light: '#F9FAFB',      // Light
                        white: '#FFFFFF',      // White
                        pink: '#EC4899',       // Pink
                        yellow: '#FCD34D'      // Yellow
                      },
                      {
                        name: 'Red',
                        primary: '#EF4444',    // Red
                        secondary: '#DC2626',  // Dark red
                        accent: '#F87171',     // Light red
                        warning: '#F59E0B',    // Amber
                        danger: '#EF4444',     // Red
                        success: '#10B981',    // Green
                        info: '#3B82F6',       // Blue
                        dark: '#1F2937',       // Dark
                        light: '#F9FAFB',      // Light
                        white: '#FFFFFF',      // White
                        pink: '#EC4899',       // Pink
                        yellow: '#FCD34D'      // Yellow
                      }
                    ]
                    
                    const currentIndex = colorSchemes.findIndex(scheme => 
                      scheme.primary === themeColors.primary
                    )
                    const nextIndex = (currentIndex + 1) % colorSchemes.length
                    const newScheme = colorSchemes[nextIndex]
                    setThemeColors(newScheme)
                    
                    dispatch(addSuccess({
                      message: `Switched to ${newScheme.name} theme`,
                      title: 'Theme Changed'
                    }))
                  }}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  title="Cycle through advanced color schemes"
                >
                  <span>🎨</span>
                  <span>Advanced Theme Editor</span>
                </button>
              </div>

              {/* Theme Selector */}
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex items-center space-x-3 mb-3">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">App Theme</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Current: {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['dark', 'day', 'blue', 'yellow', 'pink'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => dispatch(setTheme(theme))}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        currentTheme === theme
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800'
                          : 'hover:scale-105'
                      } ${
                        theme === 'dark' ? 'bg-gray-800 text-white' :
                        theme === 'day' ? 'bg-white text-gray-800 border border-gray-300' :
                        theme === 'blue' ? 'bg-blue-600 text-white' :
                        theme === 'yellow' ? 'bg-yellow-500 text-white' :
                        'bg-pink-500 text-white'
                      }`}
                      title={`Switch to ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme`}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Preview */}
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Theme Preview</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: themeColors.primary }}
                    ></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">Primary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: themeColors.secondary }}
                    ></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">Secondary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: themeColors.accent }}
                    ></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">Accent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div 
                      className="p-4 border-t border-gray-600 flex-shrink-0 bg-black"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User 
                className="w-4 h-4 text-gray-600 dark:text-gray-400" 
              />
              <span 
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {profile?.email || 'user@example.com'}
              </span>
            </div>
            <SignoutButton />
          </div>
        </div>
      </div>
    </>
  )
}

export default SliderDashboard 