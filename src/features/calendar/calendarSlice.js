import { createSlice } from '@reduxjs/toolkit'
import { CALENDAR_VIEWS } from '../../lib/constants'

// Initial state
const initialState = {
  viewMode: CALENDAR_VIEWS.WEEK,
  selectedDate: new Date().toISOString(),
  selectedEvent: null,
  isModalOpen: false,
  filters: {
    stylist: null,
    service: null,
    status: null
  },
  settings: {
    showParked: true,
    showCompleted: false,
    showCancelled: false,
    timeFormat: '12h', // '12h' or '24h'
    defaultView: CALENDAR_VIEWS.WEEK
  }
}

// Calendar slice
const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload instanceof Date ? action.payload.toISOString() : action.payload
    },
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload
    },
    clearSelectedEvent: (state) => {
      state.selectedEvent = null
    },
    setModalOpen: (state, action) => {
      state.isModalOpen = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        stylist: null,
        service: null,
        status: null
      }
    },
    setSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    resetSettings: (state) => {
      state.settings = {
        showParked: true,
        showCompleted: false,
        showCancelled: false,
        timeFormat: '12h',
        defaultView: CALENDAR_VIEWS.WEEK
      }
    },
    navigateToDate: (state, action) => {
      state.selectedDate = action.payload
    },
    navigateToToday: (state) => {
      state.selectedDate = new Date().toISOString()
    },
    navigateToPrevious: (state) => {
      const currentDate = new Date(state.selectedDate)
      switch (state.viewMode) {
        case CALENDAR_VIEWS.DAY:
          currentDate.setDate(currentDate.getDate() - 1)
          break
        case CALENDAR_VIEWS.WEEK:
          currentDate.setDate(currentDate.getDate() - 7)
          break
        case CALENDAR_VIEWS.MONTH:
          currentDate.setMonth(currentDate.getMonth() - 1)
          break
        default:
          break
      }
      state.selectedDate = currentDate.toISOString()
    },
    navigateToNext: (state) => {
      const currentDate = new Date(state.selectedDate)
      switch (state.viewMode) {
        case CALENDAR_VIEWS.DAY:
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case CALENDAR_VIEWS.WEEK:
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case CALENDAR_VIEWS.MONTH:
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        default:
        break
      }
      state.selectedDate = currentDate.toISOString()
    },
    toggleShowParked: (state) => {
      state.settings.showParked = !state.settings.showParked
    },
    toggleShowCompleted: (state) => {
      state.settings.showCompleted = !state.settings.showCompleted
    },
    toggleShowCancelled: (state) => {
      state.settings.showCancelled = !state.settings.showCancelled
    },
    toggleTimeFormat: (state) => {
      state.settings.timeFormat = state.settings.timeFormat === '12h' ? '24h' : '12h'
    }
  }
})

export const {
  setViewMode,
  setSelectedDate,
  setSelectedEvent,
  clearSelectedEvent,
  setModalOpen,
  setFilters,
  clearFilters,
  setSettings,
  resetSettings,
  navigateToDate,
  navigateToToday,
  navigateToPrevious,
  navigateToNext,
  toggleShowParked,
  toggleShowCompleted,
  toggleShowCancelled,
  toggleTimeFormat
} = calendarSlice.actions

// Selectors
export const selectViewMode = (state) => state.calendar.viewMode
export const selectSelectedDate = (state) => new Date(state.calendar.selectedDate)
export const selectSelectedEvent = (state) => state.calendar.selectedEvent
export const selectIsModalOpen = (state) => state.calendar.isModalOpen
export const selectFilters = (state) => state.calendar.filters
export const selectSettings = (state) => state.calendar.settings

// Computed selectors
export const selectCalendarWeek = (state) => {
  const selectedDate = new Date(state.calendar.selectedDate)
  const startOfWeek = new Date(selectedDate)
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
  
  const week = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    week.push(day)
  }
  
  return week
}

export const selectCalendarMonth = (state) => {
  const selectedDate = new Date(state.calendar.selectedDate)
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  const monthDays = []
  const currentDate = new Date(startDate)
  
  while (currentDate.getMonth() <= month && currentDate <= lastDay || monthDays.length < 42) {
    monthDays.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return monthDays
}

export const selectIsToday = (state) => {
  const today = new Date()
  const selectedDate = new Date(state.calendar.selectedDate)
  return today.toDateString() === selectedDate.toDateString()
}

export const selectIsCurrentMonth = (state) => {
  const today = new Date()
  const selectedDate = new Date(state.calendar.selectedDate)
  return today.getMonth() === selectedDate.getMonth() && 
         today.getFullYear() === selectedDate.getFullYear()
}

export default calendarSlice.reducer 