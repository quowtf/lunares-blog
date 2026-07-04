'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

type PageClientProps = {
  theme?: 'light' | 'dark'
}

const PageClient: React.FC<PageClientProps> = ({ theme = 'light' }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme(theme)
  }, [setHeaderTheme, theme])

  return <React.Fragment />
}

export default PageClient
