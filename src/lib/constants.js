// App Modes
export const APP_MODES = {
  SINGLE: 'single',
  TEAM: 'team'
}

// User Roles
export const USER_ROLES = {
  STYLIST: 'stylist',
  MANAGER: 'manager',
  ADMIN: 'admin'
}

// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  PARKED: 'parked'
}

// Appointment Colors
export const APPOINTMENT_COLORS = {
  SCHEDULED: 'bg-blue-500',
  CONFIRMED: 'bg-green-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
  NO_SHOW: 'bg-orange-500',
  PARKED: 'bg-purple-500'
}

// Appointment Color Classes for different statuses
export const APPOINTMENT_COLOR_CLASSES = {
  SCHEDULED: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  CONFIRMED: 'bg-green-500 hover:bg-green-600 border-green-600',
  IN_PROGRESS: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  COMPLETED: 'bg-gray-500 hover:bg-gray-600 border-gray-600',
  CANCELLED: 'bg-red-500 hover:bg-red-600 border-red-600',
  NO_SHOW: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
  PARKED: 'bg-purple-500 hover:bg-purple-600 border-purple-600'
}

// Calendar Views
export const CALENDAR_VIEWS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
}

// Branding Sections
export const BRANDING_SECTIONS = {
  LOGO: 'logo',
  COLORS: 'colors',
  TYPOGRAPHY: 'typography',
  SOCIAL_MEDIA: 'social_media'
}

// KPI Types
export const KPI_TYPES = {
  REVENUE: 'revenue',
  CLIENTS: 'clients',
  APPOINTMENTS: 'appointments',
  SERVICES: 'services'
}

// Time Slots
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
]

// Service Categories
export const SERVICE_CATEGORIES = {
  HAIR: 'hair',
  NAILS: 'nails',
  SKIN: 'skin',
  MASSAGE: 'massage',
  MAKEUP: 'makeup',
  OTHER: 'other'
}

// Client Status
export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  VIP: 'vip'
}

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  DIGITAL: 'digital'
}

// Notification Types
export const NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  REMINDER: 'reminder',
  PROMOTION: 'promotion',
  SYSTEM: 'system'
}

// Alert Types
export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Database Tables
export const TABLES = {
  PROFILES: 'profiles',
  BRANDS: 'brands',
  CLIENTS: 'clients',
  SERVICES: 'services',
  APPOINTMENTS: 'appointments',
  USER_BRANDS: 'user_brands'
}

// Default Values
export const DEFAULTS = {
  APPOINTMENT_DURATION: 60, // minutes
  WORKING_HOURS: {
    START: '09:00',
    END: '20:00'
  },
  CURRENCY: 'USD',
  TIMEZONE: 'UTC'
}

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

// UI Constants
export const UI = {
  MODAL_ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  INFINITE_SCROLL_THRESHOLD: 100
}

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: '/auth',
  APPOINTMENTS: '/appointments',
  CLIENTS: '/clients',
  SERVICES: '/services',
  BRANDING: '/branding',
  PERFORMANCE: '/performance'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH: 'salonx-auth',
  THEME: 'salonx-theme',
  SETTINGS: 'salonx-settings'
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  APPOINTMENT_CREATED: 'Appointment created successfully!',
  APPOINTMENT_UPDATED: 'Appointment updated successfully!',
  APPOINTMENT_DELETED: 'Appointment deleted successfully!',
  CLIENT_CREATED: 'Client created successfully!',
  CLIENT_UPDATED: 'Client updated successfully!',
  SERVICE_CREATED: 'Service created successfully!',
  SERVICE_UPDATED: 'Service updated successfully!'
} 