import { createSlice } from '@reduxjs/toolkit'
import { APP_THEMES, THEME_COLORS, STORAGE_KEYS } from '../../lib/constants'

// Get initial theme from localStorage or default to 'dark'
const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
    if (savedTheme && Object.values(APP_THEMES).includes(savedTheme)) {
      return savedTheme
    }
  } catch (error) {
    console.warn('Error reading theme from localStorage:', error)
  }
  return APP_THEMES.DARK
}

const initialState = {
  currentTheme: getInitialTheme(),
  availableThemes: Object.values(APP_THEMES),
  colors: THEME_COLORS[getInitialTheme()]
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      const newTheme = action.payload
      if (Object.values(APP_THEMES).includes(newTheme)) {
        state.currentTheme = newTheme
        state.colors = THEME_COLORS[newTheme]
        
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
        } catch (error) {
          console.warn('Error saving theme to localStorage:', error)
        }
        
        // Apply theme to document
        applyThemeToDocument(newTheme)
      }
    },
    resetTheme: (state) => {
      state.currentTheme = APP_THEMES.DARK
      state.colors = THEME_COLORS[APP_THEMES.DARK]
      
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, APP_THEMES.DARK)
      } catch (error) {
        console.warn('Error saving theme to localStorage:', error)
      }
      
      applyThemeToDocument(APP_THEMES.DARK)
    }
  }
})

// Helper function to apply theme to document
const applyThemeToDocument = (theme) => {
  console.log('Applying theme:', theme)
  
  // Remove existing theme classes from both html and body
  document.documentElement.classList.remove(
    'theme-dark',
    'theme-day',
    'theme-blue',
    'theme-yellow',
    'theme-pink'
  )
  document.body.classList.remove(
    'theme-dark',
    'theme-day',
    'theme-blue',
    'theme-yellow',
    'theme-pink'
  )
  
  // Add new theme class to both html and body
  document.documentElement.classList.add(`theme-${theme}`)
  document.body.classList.add(`theme-${theme}`)
  
  // Force multiple reflows to ensure theme changes are applied immediately
  document.documentElement.offsetHeight
  document.body.offsetHeight
  
  // Set CSS custom properties for theme colors
  const colors = THEME_COLORS[theme]
  if (colors) {
    // Apply to both html and body
    [document.documentElement, document.body].forEach(element => {
      element.style.setProperty('--theme-primary', colors.primary)
      element.style.setProperty('--theme-secondary', colors.secondary)
      element.style.setProperty('--theme-accent', colors.accent)
      element.style.setProperty('--theme-hover', colors.hover)
      element.style.setProperty('--theme-border', colors.border)
      element.style.setProperty('--theme-bg', colors.bg)
      element.style.setProperty('--theme-text', colors.text)
      element.style.setProperty('--theme-card-bg', colors.cardBg)
      element.style.setProperty('--theme-input-bg', colors.inputBg)
      element.style.setProperty('--theme-header-bg', colors.headerBg)
      element.style.setProperty('--theme-calendar-bg', colors.calendarBg)
      element.style.setProperty('--theme-calendar-card-bg', colors.calendarCardBg)
      element.style.setProperty('--theme-calendar-border', colors.calendarBorder)
      
      // Also set background color directly for immediate effect
      element.style.backgroundColor = colors.bg
      element.style.color = colors.text
    })
  }
  
  // Trigger a custom event for real-time updates
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }))
  
  // Force a repaint
  setTimeout(() => {
    document.body.style.display = 'none'
    document.body.offsetHeight
    document.body.style.display = ''
  }, 0)
}

// Apply initial theme on slice creation
applyThemeToDocument(getInitialTheme())

export const { setTheme, resetTheme } = themeSlice.actions

// Selectors
export const selectCurrentTheme = (state) => state.theme.currentTheme
export const selectAvailableThemes = (state) => state.theme.availableThemes
export const selectThemeColors = (state) => state.theme.colors

export default themeSlice.reducer 