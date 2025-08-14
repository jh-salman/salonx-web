import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentTheme } from '../../features/theme/themeSlice'

const ThemeWrapper = ({ 
  children, 
  componentType = 'default',
  className = '',
  ...props 
}) => {
  const currentTheme = useSelector(selectCurrentTheme)
  const [themeClass, setThemeClass] = useState('')

  useEffect(() => {
    // Apply theme class based on component type
    let baseClass = ''
    
    switch (componentType) {
      case 'card':
        baseClass = 'theme-card'
        break
      case 'input':
        baseClass = 'theme-input'
        break
      case 'header':
        baseClass = 'theme-header'
        break
      case 'modal':
        baseClass = 'theme-modal'
        break
      case 'button':
        baseClass = 'theme-button'
        break
      case 'container':
        baseClass = 'theme-bg theme-text'
        break
      default:
        baseClass = 'theme-bg theme-text'
    }
    
    setThemeClass(baseClass)
  }, [componentType, currentTheme])

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      // Force re-render when theme changes
      setThemeClass(prev => prev)
    }

    window.addEventListener('themeChanged', handleThemeChange)
    return () => window.removeEventListener('themeChanged', handleThemeChange)
  }, [])

  return (
    <div 
      className={`${themeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

export default ThemeWrapper 