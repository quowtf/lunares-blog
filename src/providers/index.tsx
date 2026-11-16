import React from 'react'

import { AuthSessionRefresh } from './AuthSessionRefresh'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <AuthSessionRefresh>{children}</AuthSessionRefresh>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
