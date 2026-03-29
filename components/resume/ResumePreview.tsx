'use client'

import { useState } from 'react'
import type { ResumeData, ResumeTemplateId } from '@/lib/resumeTypes'
import ClassicTemplate from '@/components/resume/templates/ClassicTemplate'
import ModernTemplate from '@/components/resume/templates/ModernTemplate'
import MinimalTemplate from '@/components/resume/templates/MinimalTemplate'
import ProfessionalTemplate from '@/components/resume/templates/ProfessionalTemplate'
import { useToast } from '@/hooks/useToast'

export default function ResumePreview({
  data,
  template,
}: {
  data: ResumeData
  template: ResumeTemplateId
}) {
  const addToast = useToast((s) => s.addToast)
  const [atsOpen, setAtsOpen] = useState(false)
  const [atsResult, setAtsResult] = useState<{
    score: number
    suggestions: string[]
    strongPoints: string[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const body =
    template === 'modern' ? (
      <ModernTemplate data={data} />
    ) : template === 'minimal' ? (
      <MinimalTemplate data={data} />
    ) : template === 'professional' ? (
      <ProfessionalTemplate data={data} />
    ) : (
      <ClassicTemplate data={data} />
    )

  const exportPdf = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const { default: jsPDF } = await import('jspdf')
      const el = document.getElementById('resume-preview')
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true })
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const img = canvas.toDataURL('image/png')
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height * w) / canvas.width
      pdf.addImage(img, 'PNG', 0, 0, w, h)
      pdf.save(`${(data.fullName || 'resume').replace(/\s+/g, '-')}-resume.pdf`)
      addToast('PDF downloaded', 'success')
    } catch (e) {
      console.error(e)
      addToast('PDF export failed. Make sure your resume has content and try again.', 'error')
    }
  }

  const atsCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/resume-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ats-check', resumeData: data }),
      })
      const j = await res.json()
      if (!res.ok) {
        addToast(j.error || 'ATS check failed', 'error')
        return
      }
      setAtsResult(j)
      setAtsOpen(true)
    } catch {
      addToast('ATS check failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s: number) =>
    s < 50 ? 'text-red-400' : s <= 75 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div className="sticky top-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportPdf}
          className="rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] px-4 py-2 text-sm font-semibold text-white"
        >
          📥 Export PDF
        </button>
        <button
          type="button"
          onClick={atsCheck}
          disabled={loading}
          className="rounded-xl border border-white/20 bg-[#16161f] px-4 py-2 text-sm font-semibold text-white"
        >
          {loading ? '…' : '📊 Check ATS Score (3 credits)'}
        </button>
      </div>
      <div id="resume-preview" className="overflow-hidden rounded-xl border border-zinc-200 shadow-xl">
        {body}
      </div>

      {atsOpen && atsResult && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#16161f] p-6 text-white">
            <div className="mb-4 flex justify-between">
              <h3 className="text-lg font-bold">ATS Score</h3>
              <button type="button" onClick={() => setAtsOpen(false)} className="text-zinc-400">
                ✕
              </button>
            </div>
            <p className={`text-5xl font-bold ${scoreColor(atsResult.score)}`}>{atsResult.score}</p>
            <h4 className="mt-4 font-semibold">Suggestions</h4>
            <ul className="list-inside list-disc text-sm text-zinc-300">
              {atsResult.suggestions?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <h4 className="mt-4 font-semibold">Strong points</h4>
            <ul className="list-inside list-disc text-sm text-zinc-300">
              {atsResult.strongPoints?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setAtsOpen(false)}
              className="mt-6 w-full rounded-xl bg-violet-600 py-2 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
