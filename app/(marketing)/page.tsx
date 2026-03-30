import LandingInterviewLauncher from '@/components/landing/LandingInterviewLauncher'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import DesiModeSection from '@/components/landing/DesiModeSection'
import PlatformsSection from '@/components/landing/PlatformsSection'
import FeaturesGrid from '@/components/landing/FeaturesGrid'
import StatsRow from '@/components/landing/StatsRow'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CTABanner from '@/components/landing/CTABanner'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <main>
        <HeroSection />
        <DesiModeSection />
        <PlatformsSection />
        <FeaturesGrid />
        <StatsRow />
        <TestimonialsSection />
        <CTABanner />
      </main>
      <Footer />
      <LandingInterviewLauncher />
    </div>
  )
}
