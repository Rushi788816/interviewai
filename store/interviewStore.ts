import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionContext } from '@/types'

interface InterviewState {
  sessionId: string | null
  qaHistory: Array<{
    question: string
    answer: string
    timestamp: number
  }>
  currentQuestion: string
  currentAnswer: string
  isActive: boolean
  creditsUsed: number
  duration: number
  sessionContext: SessionContext | null
  overlayOpacity: number

  startSession: (interviewType: string) => void
  endSession: () => void
  addQAPair: (question: string, answer: string) => void
  updateAnswer: (answer: string) => void
  reset: () => void
  tickDuration: () => void
  setSessionContext: (ctx: SessionContext | null) => void
  clearSessionContext: () => void
  setOverlayOpacity: (opacity: number) => void
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      qaHistory: [],
      currentQuestion: '',
      currentAnswer: '',
      isActive: false,
      creditsUsed: 0,
      duration: 0,
      sessionContext: null,
      overlayOpacity: 95,

      startSession: (interviewType) => {
        const id = `session_${Date.now()}`
        set({
          sessionId: id,
          isActive: true,
          qaHistory: [],
        })
      },

      endSession: () => set({ isActive: false }),

      addQAPair: (question, answer) => {
        const { qaHistory } = get()
        set({
          qaHistory: [
            ...qaHistory,
            {
              question,
              answer,
              timestamp: Date.now(),
            },
          ],
          currentQuestion: '',
          currentAnswer: '',
        })
      },

      updateAnswer: (answer) => set({ currentAnswer: answer }),

      setSessionContext: (ctx) => set({ sessionContext: ctx }),

      clearSessionContext: () => set({ sessionContext: null }),
      setOverlayOpacity: (opacity: number) => set({ overlayOpacity: opacity }),

      reset: () =>
        set({
          sessionId: null,
          qaHistory: [],
          currentQuestion: '',
          currentAnswer: '',
          isActive: false,
          creditsUsed: 0,
          duration: 0,
          sessionContext: null,
          overlayOpacity: 95,
        }),

      tickDuration: () => {
        const { isActive, duration } = get()
        if (isActive) {
          set({ duration: duration + 1 })
        }
      },
    }),
    {
      name: 'interview-storage',
      partialize: (state) => ({
        // Only persist UI preferences — NOT session/user-specific data
        overlayOpacity: state.overlayOpacity,
      }),
    }
  )
)
