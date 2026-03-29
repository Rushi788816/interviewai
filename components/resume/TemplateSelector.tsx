'use client'

import type { ResumeTemplateId } from '@/lib/resumeTypes'

function Thumbnail({ id }: { id: string }) {
  const bar = (w: string, h: string, bg: string, mb = '3px', radius = '2px') => (
    <div style={{ width: w, height: h, background: bg, borderRadius: radius, marginBottom: mb }} />
  )
  if (id === 'classic') return (
    <div style={{ background: '#fff', height: '100%', padding: '7px 9px' }}>
      {bar('50%', '7px', '#000', '4px')} {bar('100%', '1px', '#000', '4px')}
      {bar('90%', '3px', '#ddd')} {bar('75%', '3px', '#ddd')} {bar('80%', '3px', '#ddd')} {bar('60%', '3px', '#ddd')}
    </div>
  )
  if (id === 'modern') return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: '32%', background: '#6c63ff', height: '100%', padding: '8px 6px' }}>
        {bar('60%', '5px', 'rgba(255,255,255,0.6)', '3px', '50%')}
        {bar('80%', '3px', 'rgba(255,255,255,0.3)')} {bar('70%', '3px', 'rgba(255,255,255,0.3)')} {bar('80%', '3px', 'rgba(255,255,255,0.3)')}
      </div>
      <div style={{ flex: 1, padding: '8px 7px' }}>
        {bar('70%', '3px', '#ddd')} {bar('90%', '3px', '#eee')} {bar('80%', '3px', '#eee')} {bar('60%', '3px', '#eee')}
      </div>
    </div>
  )
  if (id === 'minimal') return (
    <div style={{ background: '#fafafa', height: '100%', padding: '10px 10px' }}>
      {bar('55%', '6px', '#333', '6px')}
      {bar('100%', '1px', '#e5e5e5', '5px')}
      {[90,75,85,65,80].map((w,i) => bar(`${w}%`, '3px', '#ddd', '3px'))}
    </div>
  )
  if (id === 'professional') return (
    <div style={{ background: '#fff', height: '100%', padding: '7px 9px' }}>
      {bar('65%', '6px', '#1a2a4a', '2px')} {bar('100%', '2px', '#1a2a4a', '5px')}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: '18px', background: '#e8edf5', borderRadius: '2px', border: '1px solid #c8d4e8' }} />)}
      </div>
      {bar('100%', '2px', '#1a2a4a', '3px')} {bar('90%', '3px', '#eee')} {bar('75%', '3px', '#eee')}
    </div>
  )
  if (id === 'executive') return (
    <div style={{ height: '100%' }}>
      <div style={{ background: '#1e3a5f', padding: '7px 9px', marginBottom: '2px' }}>
        {bar('60%', '6px', 'rgba(255,255,255,0.8)', '2px')} {bar('80%', '3px', 'rgba(255,255,255,0.4)')}
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: '32%', background: '#f4f7fb', padding: '5px 6px', borderRight: '1px solid #dde4ef' }}>
          {bar('80%', '3px', '#ccd')} {bar('70%', '3px', '#ccd')} {bar('80%', '3px', '#ccd')}
        </div>
        <div style={{ flex: 1, padding: '5px 7px' }}>
          {bar('90%', '3px', '#eee')} {bar('75%', '3px', '#eee')} {bar('80%', '3px', '#eee')}
        </div>
      </div>
    </div>
  )
  if (id === 'creative') return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: '34%', background: '#00897b', height: '100%', padding: '8px 6px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', margin: '0 auto 5px' }} />
        {bar('80%', '3px', 'rgba(255,255,255,0.4)', '2px')} {bar('70%', '3px', 'rgba(255,255,255,0.3)')}
      </div>
      <div style={{ flex: 1, padding: '8px 7px' }}>
        {bar('90%', '3px', '#e0f2f1', '3px')} {bar('80%', '3px', '#ddd')} {bar('70%', '3px', '#ddd')} {bar('85%', '3px', '#ddd')}
      </div>
    </div>
  )
  if (id === 'compact') return (
    <div style={{ background: '#fff', height: '100%', padding: '6px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        {bar('45%', '6px', '#111', '0')} {bar('30%', '4px', '#e65c00', '0')}
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(to right, #e65c00, transparent)', marginBottom: '4px', borderRadius: '1px' }} />
      {bar('100%', '3px', '#eee')} {bar('90%', '3px', '#eee')}
      <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
        <div style={{ flex: 1 }}>{bar('100%', '3px', '#eee')} {bar('85%', '3px', '#eee')}</div>
        <div style={{ flex: 1 }}>{bar('100%', '3px', '#eee')} {bar('80%', '3px', '#eee')}</div>
      </div>
    </div>
  )
  if (id === 'bold') return (
    <div style={{ background: '#fff', height: '100%', padding: '6px 9px', borderBottom: '3px solid #f59e0b' }}>
      {bar('70%', '8px', '#0f172a', '2px')} {bar('50%', '4px', '#f59e0b', '5px')}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0f172a', flexShrink: 0 }} />
        {bar('70%', '3px', '#eee', '0')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0f172a', flexShrink: 0 }} />
        {bar('60%', '3px', '#eee', '0')}
      </div>
    </div>
  )
  return <div style={{ background: '#f5f5f5', height: '100%' }} />
}

export default function TemplateSelector({
  selected,
  onSelect,
}: {
  selected: ResumeTemplateId
  onSelect: (t: ResumeTemplateId) => void
}) {
  const items: { id: ResumeTemplateId; label: string; desc: string }[] = [
    { id: 'classic',      label: 'Classic',      desc: 'Traditional serif'     },
    { id: 'modern',       label: 'Modern',       desc: 'Purple sidebar'        },
    { id: 'minimal',      label: 'Minimal',      desc: 'Clean lines'           },
    { id: 'professional', label: 'Professional', desc: 'Navy · ATS-ready'      },
    { id: 'executive',    label: 'Executive',    desc: 'Navy header + sidebar' },
    { id: 'creative',     label: 'Creative',     desc: 'Teal sidebar'          },
    { id: 'compact',      label: 'Compact',      desc: 'More content, 1 page'  },
    { id: 'bold',         label: 'Bold',         desc: 'Strong typography'     },
  ]

  return (
    <div className="mb-8">
      <h3 className="mb-4 font-semibold text-white">Template</h3>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-xl border p-3 text-left transition ${
              selected === item.id
                ? 'border-violet-500 ring-2 ring-violet-500/40'
                : 'border-white/10 bg-[#16161f] hover:border-white/20'
            }`}
          >
            <div className="mb-2 h-20 rounded-lg border border-zinc-700 overflow-hidden bg-white">
              <Thumbnail id={item.id} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-xs">{item.label}</span>
              {selected === item.id && <span className="text-violet-400 text-xs">✓</span>}
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
