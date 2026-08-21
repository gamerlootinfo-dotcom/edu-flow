'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Lang, translations } from './i18n'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: typeof translations.AZ
}

const LangContext = createContext<LangContextType>({
  lang: 'AZ',
  setLang: () => {},
  t: translations.AZ,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('AZ')

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null
    if (stored && (stored === 'AZ' || stored === 'RU')) {
      setLangState(stored)
    }
  }, [])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] as typeof translations.AZ }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
