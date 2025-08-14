import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentTheme, selectAvailableThemes, setTheme } from '../../features/theme/themeSlice'
import { APP_THEMES } from '../../lib/constants'

// Helper function to apply theme (copied from themeSlice)
const applyThemeToDocument = (theme) => {
  console.log('Applying theme:', theme)
  
  // Get theme colors
  const { THEME_COLORS } = require('../../lib/constants')
  const colors = THEME_COLORS[theme]
  
  if (!colors) {
    console.error('Theme colors not found for:', theme)
    return
  }
  
  // Remove existing theme classes from both html and body
  document.documentElement.classList.remove(
    'theme-blue',
    'theme-pink', 
    'theme-yellow',
    'theme-black',
    'theme-dark'
  )
  document.body.classList.remove(
    'theme-blue',
    'theme-pink', 
    'theme-yellow',
    'theme-black',
    'theme-dark'
  )
  
  // Add new theme class to both html and body
  document.documentElement.classList.add(`theme-${theme}`)
  document.body.classList.add(`theme-${theme}`)
  
  // Force multiple reflows to ensure theme changes are applied immediately
  document.documentElement.offsetHeight
  document.body.offsetHeight
  
  // Apply CSS variables and direct styles
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
    
    // Also set background color directly for immediate effect
    element.style.backgroundColor = colors.bg
    element.style.color = colors.text
  })
  
  // Trigger a custom event for real-time updates
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }))
}

const ThemeSelector = () => {
  const dispatch = useDispatch()
  const currentTheme = useSelector(selectCurrentTheme)
  const availableThemes = useSelector(selectAvailableThemes)

  const themeOptions = [
    {
      value: APP_THEMES.BLUE,
      label: 'Blue',
      icon: '🔵',
      description: 'Professional blue theme'
    },
    {
      value: APP_THEMES.PINK,
      label: 'Pink',
      icon: '🌸',
      description: 'Elegant pink theme'
    },
    {
      value: APP_THEMES.YELLOW,
      label: 'Yellow',
      icon: '🌻',
      description: 'Bright yellow theme'
    },
    {
      value: APP_THEMES.BLACK,
      label: 'Black',
      icon: '⚫',
      description: 'Classic black theme'
    },
    {
      value: APP_THEMES.DARK,
      label: 'Dark',
      icon: '🌙',
      description: 'Modern dark theme'
    }
  ]

  const handleThemeChange = (theme) => {
    dispatch(setTheme(theme))
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">🎨</span>
        Theme Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themeOptions.map((theme) => (
          <div
            key={theme.value}
            onClick={() => handleThemeChange(theme.value)}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${currentTheme === theme.value 
                ? 'border-purple-500 bg-purple-900/20' 
                : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
              }
            `}
          >
            {/* Selected indicator */}
            {currentTheme === theme.value && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{theme.icon}</span>
              <div>
                <h4 className="font-medium text-white">{theme.label}</h4>
                <p className="text-sm text-gray-400">{theme.description}</p>
              </div>
            </div>
            
            {/* Theme preview */}
            <div className="mt-3 flex space-x-2">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getThemePreviewColors(theme.value)}`}></div>
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getThemePreviewColors(theme.value)}`}></div>
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getThemePreviewColors(theme.value)}`}></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gray-700 rounded-md">
        <p className="text-sm text-gray-300">
          <span className="font-medium">Current Theme:</span> {themeOptions.find(t => t.value === currentTheme)?.label}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Your theme preference will be saved and applied across all pages.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              console.log('Current theme classes:', document.documentElement.className)
              console.log('Current body classes:', document.body.className)
              console.log('Current theme CSS variables:')
              console.log('  --theme-bg:', getComputedStyle(document.documentElement).getPropertyValue('--theme-bg'))
              console.log('  --theme-text:', getComputedStyle(document.documentElement).getPropertyValue('--theme-text'))
              console.log('  --theme-primary:', getComputedStyle(document.documentElement).getPropertyValue('--theme-primary'))
              console.log('Body background:', getComputedStyle(document.body).backgroundColor)
              console.log('HTML background:', getComputedStyle(document.documentElement).backgroundColor)
            }}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Debug Theme
          </button>
          <button
            onClick={() => {
              // Force refresh theme
              applyThemeToDocument(currentTheme)
            }}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Force Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to get theme preview colors
const getThemePreviewColors = (theme) => {
  const colors = {
    [APP_THEMES.BLUE]: 'from-blue-500 to-blue-600',
    [APP_THEMES.PINK]: 'from-pink-500 to-pink-600',
    [APP_THEMES.YELLOW]: 'from-yellow-500 to-yellow-600',
    [APP_THEMES.BLACK]: 'from-gray-800 to-black',
    [APP_THEMES.DARK]: 'from-gray-600 to-gray-700'
  }
  return colors[theme] || colors[APP_THEMES.DARK]
}

export default ThemeSelector 