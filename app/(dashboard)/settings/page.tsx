'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'
import {
  User,
  Shield,
  Coins,
  History,
  LogOut,
  Save,
  Check,
  AlertTriangle,
  Clock,
} from "lucide-react"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { balance } = useCredits()
  const addToast = useToast((s) => s.addToast)
  const [name, setName] = useState('')
  const [sessions, setSessions] = useState<
    { id: string; createdAt: string; mode: string; duration: number; creditsUsed: number }[]
  >([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  useEffect(() => {
    setName(session?.user?.name || '')
  }, [session?.user?.name])

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/sessions/recent?limit=20')
      if (res.ok) {
        const j = await res.json()
        setSessions(j.sessions || [])
      }
    })()
  }, [])

  const saveName = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        await update({})
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        addToast('Profile updated', 'success')
      } else {
        addToast('Update failed', 'error')
      }
    } catch {
      addToast('Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {\n    return (\n      <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n        <div style={{ width: '32px', height: '32px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>\n      </div>\n    )\n  }\n\n  if (!session?.user) {\n    return null\n  }

  const initial = (session.user.name || session.user.email || '?')[0].toUpperCase()

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px', color: 'white' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '32px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>Settings</h1>
        <p style={{ color: '#94A3B8', margin: 0 }}>Manage your account and preferences</p>
      </div>

      {/* SECTION 1 — PROFILE */}
      <section style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e3a5f, #2563EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '2rem',
            fontWeight: 'bold',
          }}>
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(37,99,235,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}>
                <User size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Profile Information</h2>
            </div>
            <p style={{ color: '#94A3B8', margin: 0 }}>Update your personal details</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>
              Full Name
            </label>
            <input
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0A0F1E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '0.95rem',
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              style={{
                width: '100%',
                padding: '12px 16px 12px 16px 0 12px 16px',
                backgroundColor: '#0A0F1E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'white',
                paddingRight: '48px',
              }}
              value={session.user.email}
              disabled
              placeholder="your@email.com"
            />
            <div style={{ position: 'absolute', inset: '0 12px 0 0', right: 0, paddingRight: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <Shield size={18} style={{ color: '#94A3B8' }} />
            </div>
          </div>
          <button
            onClick={saveName}
            disabled={saving}
            style={{
              alignSelf: 'flex-end',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10B981' }}>
              <Check size={18} />
              Profile updated successfully
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2 — CREDITS AND PLANS */}
      <section style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(245,158,11,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
          }}>
            <Coins size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: '0 0 4px 0' }}>Credits & Plans</h2>
            <p style={{ color: '#94A3B8', margin: 0 }}>Purchase credits to continue using InterviewAI</p>
          </div>
        </div>

        {/* Balance banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(6,182,212,0.1))',
          border: '1px solid rgba(37,99,235,0.3)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <Coins size={32} style={{ color: '#F59E0B' }} />
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{balance}</p>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>Credits Remaining</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>Credits never expire</p>
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr)' }}>
          {[
            {
              id: 'starter',
              title: 'Starter',
              price: '₹499',
              credits: '50 credits',
              features: ['Real-time AI answers', 'All interview types', '52+ languages', 'Credits never expire'],
              buttonText: 'Get Starter'
            },
            {
              id: 'pro',
              title: 'Pro',
              price: '₹1,199',
              credits: '150 credits',
              mostPopular: true,
              features: ['Everything in Starter', 'Desi Mode 🇮🇳', 'AI Mock Interview (3 sessions)', 'Resume AI Enhancement', 'Priority support'],
              buttonText: 'Get Pro →'
            },
            {
              id: 'power',
              title: 'Power',
              price: '₹2,499',
              credits: '400 credits',
              features: ['Everything in Pro', 'Unlimited Mock Interviews', 'Advanced session analytics', 'Custom answer style', 'Dedicated support'],
              buttonText: 'Get Power'
            }
          ].map((plan) => (
            <div key={plan.id} style={{
              position: 'relative',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '24px',
              transition: 'all 0.2s',
              ...(plan.mostPopular ? {
                borderColor: '#2563EB',
                boxShadow: '0 0 0 4px rgba(37,99,235,0.2)',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.05), transparent)',
                transform: 'scale(1.02)'
              } : {})
            }}>
              {plan.mostPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                }}>
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                {plan.title}
              </h3>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                {plan.price}
                <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#94A3B8' }}>+ GST</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563EB', marginBottom: '24px' }}>
                {plan.credits}
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '24px' }}>
                {plan.features.length === 4 ? '1-2 interviews' : plan.features.length === 5 ? '4-5 interviews' : '10+ interviews'}
              </p>
              <ul style={{ marginBottom: '32px' }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', marginBottom: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: 'rgba(16,185,129,0.2)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Check size={14} style={{ color: '#10B981' }} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                border: 'none',
                ...(plan.mostPopular ? {
                  background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(37,99,235,0.2)'
                } : {
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#94A3B8'
                })
              }}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
            🔒 Secure payments via Razorpay • Credits never expire • Instant delivery
          </p>
        </div>
      </section>

      {/* SECTION 3 — SESSION HISTORY */}
      <section style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(139,92,246,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B5CF6',
          }}>
            <History size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: '0 0 4px 0' }}>Session History</h2>
            <p style={{ color: '#94A3B8', margin: 0 }}>Your recent interview sessions</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Duration</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', color: 'white', fontWeight: '500' }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                      <Clock size={13} />
                      {Math.round(s.duration / 60)} min
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      padding: '4px 8px', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      backgroundColor: 'rgba(37,99,235,0.1)', 
                      color: 'rgb(96,165,250)', 
                      border: '1px solid rgba(37,99,235,0.2)' 
                    }}>
                      {s.mode}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                      <Coins size={13} />
                      {s.creditsUsed}
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '64px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '18px',
                        backgroundColor: 'rgba(30,58,90,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1E3A5F',
                      }}>
                        <History size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#D1D5DB' }}>No sessions yet</h3>
                      <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Start your first interview to see history here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4 — DANGER ZONE */}
      <section style={{ 
        backgroundColor: 'rgba(239,68,68,0.03)', 
        border: '1px solid rgba(239,68,68,0.2)', 
        borderRadius: '24px', 
        padding: '2rem', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EF4444',
          }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: '0 0 4px 0' }}>Account</h2>
            <p style={{ color: '#94A3B8', margin: 0 }}>Manage your account access</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px',
            padding: '14px 20px',
            color: '#EF4444',
            fontSize: '0.95rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
            e.currentTarget.style.borderColor = '#EF4444'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
          }}
        >
          <LogOut size={18} />
          Sign Out of InterviewAI
        </button>
      </section>
    </div>
  )
}

