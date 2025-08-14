import { THEME_COLORS } from '../lib/constants'

// Get theme colors for a specific theme
export const getThemeColors = (theme) => {
  return THEME_COLORS[theme] || THEME_COLORS.dark
}

// Get theme-aware class names
export const getThemeClasses = (theme, componentType = 'default') => {
  const colors = getThemeColors(theme)
  
  const classMap = {
    // Container classes
    container: `theme-bg theme-text`,
    card: `theme-bg border theme-border rounded-lg shadow-lg`,
    header: `theme-bg border-b theme-border shadow-lg`,
    
    // Button classes
    button: {
      primary: `theme-gradient text-white font-semibold py-2 px-4 rounded-lg transition-colors hover:theme-hover`,
      secondary: `bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors`,
      success: `bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors`,
      danger: `bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors`
    },
    
    // Input classes
    input: `theme-bg border theme-border text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500`,
    
    // Text classes
    text: {
      primary: `theme-text`,
      secondary: `text-gray-300`,
      accent: `theme-accent`,
      muted: `text-gray-400`
    },
    
    // Background classes
    bg: {
      primary: `theme-bg`,
      secondary: `bg-gray-800`,
      tertiary: `bg-gray-700`
    }
  }
  
  return classMap[componentType] || classMap.container
}

// Apply theme to a component's className
export const applyTheme = (baseClasses, theme, componentType = 'default') => {
  const themeClasses = getThemeClasses(theme, componentType)
  return `${baseClasses} ${themeClasses}`.trim()
}

// Get theme-aware gradient classes
export const getThemeGradient = (theme) => {
  const colors = getThemeColors(theme)
  return colors.primary
}

// Get theme-aware hover classes
export const getThemeHover = (theme) => {
  const colors = getThemeColors(theme)
  return colors.hover
}

// Get theme-aware border classes
export const getThemeBorder = (theme) => {
  const colors = getThemeColors(theme)
  return colors.border
}

// Get theme-aware accent color
export const getThemeAccent = (theme) => {
  const colors = getThemeColors(theme)
  return colors.accent
} 