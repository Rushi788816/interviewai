"use client"

import { useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const subjects = [
    'General Inquiry',
    'Technical Support',
    'Billing',
    'Refund Request',
    'Partnership'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' })
      setSubmitted(false)
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto">
            We usually respond within 24 hours
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Contact Form */}
          <div className="space-y-6">
            <div className="bg-[#111827] p-8 rounded-3xl border border-rgba(37,99,235,0.2)">
              <h2 className="text-2xl font-bold mb-6 text-white">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-[#94A3B8]/30 rounded-2xl text-white placeholder-[#94A3B8]/70 focus:border-[#2563EB]/50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-[#94A3B8]/30 rounded-2xl text-white placeholder-[#94A3B8]/70 focus:border-[#2563EB]/50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-[#94A3B8]/30 rounded-2xl text-white focus:border-[#2563EB]/50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  >
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-[#94A3B8]/30 rounded-2xl text-white placeholder-[#94A3B8]/70 focus:border-[#2563EB]/50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all resize-vertical"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitted}
                  className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    submitted
                      ? 'bg-[#94A3B8]/30 text-[#94A3B8]/70 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white hover:shadow-lg hover:shadow-[#2563EB]/25 hover:scale-[1.02]'
                  }`}
                >
                  {submitted ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Message Sent!
                    </>
                  ) : (
                    'Send Message →'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8 lg:self-start">
            <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#0EA5E9]/10 p-8 rounded-3xl border border-[#2563EB]/20">
              <h3 className="text-2xl font-bold mb-6">Get in touch</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111827]/50 border border-white/10 hover:bg-[#111827]">
                  <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-bold text-xl">
                    📧
                  </div>
                  <div>
                    <p className="font-semibold text-white">Email</p>
                    <a href="mailto:support@interviewai.app" className="text-[#94A3B8] hover:text-[#2563EB] transition-colors">
                      support@interviewai.app
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111827]/50 border border-white/10 hover:bg-[#111827]">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                    📸
                  </div>
                  <div>
                    <p className="font-semibold text-white">Instagram</p>
                    <a href="https://instagram.com/interviewai.official" target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-[#2563EB] transition-colors">
                      @interviewai.official
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] p-8 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xl">
                  ⏰
                </div>
                <h3 className="text-xl font-bold">Response Time</h3>
              </div>
              <div className="space-y-2 text-[#94A3B8]">
                <p><strong>Priority Support:</strong> 2-4 hours</p>
                <p><strong>General Inquiries:</strong> Within 24 hours</p>
                <p><strong>Weekends:</strong> Next business day</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-400/10 p-6 rounded-2xl border border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg">
                  🌍
                </div>
                <h4 className="font-bold text-orange-300">Based in India</h4>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
