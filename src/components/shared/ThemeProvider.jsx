import React from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentTheme } from '../../features/theme/themeSlice'

const ThemeProvider = ({ children }) => {
  const currentTheme = useSelector(selectCurrentTheme)

  return (
    <div className={`theme-${currentTheme} bg-black`}>
      {children}
    </div>
  )
}

export default ThemeProvider 