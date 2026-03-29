'use client'

import type { ResumeTemplateId } from '@/lib/resumeTypes'

export default function TemplateSelector({
  selected,
  onSelect,
}: {
  selected: ResumeTemplateId
  onSelect: (t: ResumeTemplateId) => void
}) {
  const items: { id: ResumeTemplateId; label: string; desc: string; accent: string }[] = [
    { id: 'classic',      label: 'Classic',      desc: 'Traditional serif',    accent: '#000' },
    { id: 'modern',       label: 'Modern',       desc: 'Purple sidebar',       accent: '#6c63ff' },
    { id: 'minimal',      label: 'Minimal',      desc: 'Clean lines',          accent: '#888' },
    { id: 'professional', label: 'Professional', desc: 'Navy blue · ATS-ready', accent: '#1a2a4a' },
  ]

  return (
    <div className="mb-8">
      <h3 className="mb-4 font-semibold text-white">Template</h3>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
            {/* Template thumbnail */}
            <div className="mb-3 h-24 rounded-lg border border-zinc-600 overflow-hidden bg-white relative">
              {item.id === 'modern' && (
                <div style={{ background: 'linear-gradient(90deg, #6c63ff 32%, #fff 32%)', height: '100%' }} />
              )}
              {item.id === 'professional' && (
                <div style={{ background: '#fff', height: '100%', padding: '8px 10px' }}>
                  <div style={{ height: '7px', width: '70%', background: '#1a2a4a', borderRadius: '2px', marginBottom: '5px' }} />
                  <div style={{ height: '2px', background: '#1a2a4a', marginBottom: '6px' }} />
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
                    {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: '22px', background: '#e8edf5', borderRadius: '3px', border: '1px solid #c8d4e8' }} />)}
                  </div>
                  <div style={{ height: '2px', width: '60%', background: '#1a2a4a', marginBottom: '3px' }} />
                  {[0,1,2].map(i => <div key={i} style={{ height: '3px', background: '#eee', borderRadius: '2px', marginBottom: '2px' }} />)}
                </div>
              )}
              {item.id === 'classic' && (
                <div style={{ background: '#fff', height: '100%', padding: '8px 10px' }}>
                  <div style={{ height: '7px', width: '50%', background: '#000', borderRadius: '2px', margin: '0 auto 5px' }} />
                  <div style={{ height: '1px', background: '#000', marginBottom: '5px' }} />
                  {[0,1,2,3].map(i => <div key={i} style={{ height: '3px', background: '#ddd', borderRadius: '2px', marginBottom: '3px' }} />)}
                </div>
              )}
              {item.id === 'minimal' && (
                <div style={{ background: '#fafafa', height: '100%', padding: '8px 10px' }}>
                  <div style={{ height: '6px', width: '55%', background: '#333', borderRadius: '2px', marginBottom: '6px' }} />
                  {[0,1,2,3,4].map(i => <div key={i} style={{ height: '3px', background: '#e0e0e0', borderRadius: '2px', marginBottom: '3px', width: i % 2 === 0 ? '90%' : '70%' }} />)}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-sm">{item.label}</span>
              {selected === item.id && <span className="text-violet-400 text-xs">✓</span>}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
