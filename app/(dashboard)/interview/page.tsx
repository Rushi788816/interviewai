"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import dynamic from "next/dynamic"

const InterviewAssistant = dynamic(
  () => import("@/components/interview/InterviewAssistant"),
  { ssr: false }
)

export default function InterviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#030304", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "32px", height: "32px", border: "2px solid #F7931A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  )

  if (!session) return null

  return (
    <div style={{ minHeight: "100vh", background: "#030304", padding: "32px 24px" }}>
      <InterviewAssistant
        showFloatingLauncher={false}
        defaultOpen={true}
        userId={(session.user as any)?.id}
        credits={(session.user as any)?.credits}
      />
    </div>
  )
}
