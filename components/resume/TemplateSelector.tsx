'use client'

import type { ResumeTemplateId } from '@/lib/resumeTypes'

export default function TemplateSelector({
  selected,
  onSelect,
}: {
  selected: ResumeTemplateId
  onSelect: (t: ResumeTemplateId) => void
}) {
  const items: { id: ResumeTemplateId; label: string; desc: string }[] = [
    { id: 'classic', label: 'Classic', desc: 'Black & white' },
    { id: 'modern', label: 'Modern', desc: 'Purple sidebar' },
    { id: 'minimal', label: 'Minimal', desc: 'Clean lines' },
  ]

  return (
    <div className="mb-8">
      <h3 className="mb-4 font-semibold text-white">Template</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selected === item.id
                ? 'border-violet-500 ring-2 ring-violet-500/40'
                : 'border-white/10 bg-[#16161f] hover:border-white/20'
            }`}
          >
            <div
              className="mb-3 h-24 rounded-lg border border-zinc-600 bg-white"
              style={
                item.id === 'modern'
                  ? { background: 'linear-gradient(90deg, #6c63ff 30%, #fff 30%)' }
                  : item.id === 'minimal'
                    ? { background: '#fafafa' }
                    : {}
              }
            />
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">{item.label}</span>
              {selected === item.id && <span className="text-violet-400">✓</span>}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
