'use client'

import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import * as React from 'react'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <JotaiProvider>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </JotaiProvider>
  )
}
