'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { emptyResume, type ResumeData, type ResumeTemplateId } from '@/lib/resumeTypes'
import ResumeBuilder from '@/components/resume/ResumeBuilder'
import TemplateSelector from '@/components/resume/TemplateSelector'
import ResumePreview from '@/components/resume/ResumePreview'

export default function ResumeBuilderPage() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResume)
  const [template, setTemplate] = useState<ResumeTemplateId>('classic')
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  if (status !== 'authenticated') {
    return <div className="text-zinc-500">Loading…</div>
  }

  return (
    <div className="mx-auto max-w-7xl text-white">
      <h1 className="mb-8 text-2xl font-bold">Resume Builder</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <TemplateSelector selected={template} onSelect={setTemplate} />
          <ResumeBuilder data={resumeData} onChange={setResumeData} step={step} onStepChange={setStep} />
        </div>
        <div>
          <ResumePreview data={resumeData} template={template} />
        </div>
      </div>
    </div>
  )
}
