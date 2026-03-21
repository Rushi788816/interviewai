export type ResumeTemplateId = 'classic' | 'modern' | 'minimal'

export interface ExperienceEntry {
  id: string
  company: string
  title: string
  start: string
  end: string
  current: boolean
  responsibilities: string
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  field: string
  startYear: string
  endYear: string
  gpa: string
}

export interface ProjectEntry {
  id: string
  name: string
  description: string
  tech: string[]
  liveUrl: string
  githubUrl: string
}

export interface ResumeData {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
  summary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  technicalSkills: string[]
  softSkills: string[]
  tools: string[]
  projects: ProjectEntry[]
}

export function emptyResume(): ResumeData {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    summary: '',
    experience: [],
    education: [],
    technicalSkills: [],
    softSkills: [],
    tools: [],
    projects: [],
  }
}
