"use client"

import { useEffect } from 'react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const blogPosts = [
  {
    category: 'Interview Tips',
    title: '10 Common System Design Interview Questions and How to Answer Them',
    desc: 'System design interviews are notoriously tough. Here are the most common questions and frameworks to answer them confidently.',
    readTime: '8 min',
    date: 'March 15, 2026'
  },
  {
    category: 'Career Advice',
    title: 'How to Use AI Tools During Your Interview Without Getting Caught',
    desc: 'A complete guide to using AI interview assistants ethically and effectively, including how invisible mode works.',
    readTime: '6 min',
    date: 'March 10, 2026'
  },
  {
    category: 'Interview Tips',
    title: 'STAR Method: The Only Framework You Need for Behavioral Interviews',
    desc: 'Structured answers using Situation, Task, Action, Result — with 10 real examples for common questions.',
    readTime: '5 min',
    date: 'March 5, 2026'
  },
  {
    category: 'Career Advice',
    title: 'How to Crack FAANG Interviews in 2026 — A Complete Roadmap',
    desc: 'From DSA preparation to system design to behavioral rounds — everything you need to land a FAANG offer.',
    readTime: '12 min',
    date: 'Feb 28, 2026'
  },
  {
    category: 'Product Update',
    title: 'Introducing Desi Mode — AI Answers That Sound Like You',
    desc: 'We built a special mode for Indian professionals that generates natural, conversational answers tailored to Indian work culture.',
    readTime: '3 min',
    date: 'Feb 20, 2026'
  },
  {
    category: 'Interview Tips',
    title: 'Top 20 Coding Interview Questions Asked at Amazon in 2026',
    desc: 'Based on reports from 500+ candidates, these are the most frequently asked DSA problems at Amazon interviews.',
    readTime: '10 min',
    date: 'Feb 15, 2026'
  }
]

export default function BlogPage() {
  useEffect(() => { document.title = 'Blog — InterviewAI' }, [])
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#F7931A] to-[#FF6B2B] bg-clip-text text-transparent">
            InterviewAI Blog
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto">
            Tips, guides and insights to help you ace your next interview
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <article key={index} className="group">
              <div className="rounded-2xl border border-white/8 p-8 hover:border-[#F7931A]/40 transition-colors group-hover:bg-[#111827] bg-[#0A0F1E]">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/30">
                  {post.category}
                </span>
                <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-[#F7931A] transition-colors">
                  {post.title}
                </h3>
                <p className="text-[#94A3B8] mb-6 leading-relaxed">
                  {post.desc}
                </p>
                <div className="flex items-center justify-between text-sm text-[#94A3B8]">
                  <span>{post.readTime}</span>
                  <span>{post.date}</span>
                </div>
                <div className="mt-6 pt-6 border-t border-white/8">
                  <a href="#" className="font-semibold text-[#F7931A] hover:text-[#FF6B2B] transition-colors">
                    Read More →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
