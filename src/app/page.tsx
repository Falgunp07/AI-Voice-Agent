import { Navbar } from "@/components/ui/navbar";
import { Hero } from "@/components/ui/hero";
import { Stats } from "@/components/ui/stats";
import { HowItWorks } from "@/components/ui/how-it-works";
import { Features } from "@/components/ui/features";
import { Integrations } from "@/components/ui/integrations";
import { Pricing } from "@/components/ui/pricing";
import { Testimonials } from "@/components/ui/testimonials";
import { FAQ } from "@/components/ui/faq";
import { CTABanner } from "@/components/ui/cta-banner";
import { Footer } from "@/components/ui/footer";

export default function Home() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-white selection:text-black">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Integrations />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <Footer />
    </main>
  );
}
