'use client'

import { SPEECH_LANGUAGES } from '@/lib/speechLanguages'

interface LanguageSelectorProps {
  language: string
  onChange: (lang: string) => void
}

export default function LanguageSelector({ language, onChange }: LanguageSelectorProps) {
  return (
    <div className="relative min-w-[180px] max-w-[220px]">
      <select
        value={language}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-zinc-600 bg-zinc-900 py-2 pl-3 pr-8 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      >
        {SPEECH_LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-500">▾</span>
    </div>
  )
}
