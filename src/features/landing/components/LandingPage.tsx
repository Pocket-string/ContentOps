import { Navbar } from './Navbar'
import { Hero } from './Hero'
import { Features } from './Features'
import { HowItWorks } from './HowItWorks'
import { CTASection } from './CTASection'
import { Footer } from './Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
