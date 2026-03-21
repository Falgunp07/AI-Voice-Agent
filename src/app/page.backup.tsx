import { Navbar } from "@/components/ui/navbar";
import { Hero } from "@/components/ui/hero";
import { Features } from "@/components/ui/features";
import { Testimonials } from "@/components/ui/testimonials";
import { Footer } from "@/components/ui/footer";

export default function Home() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-white selection:text-black">
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <Footer />
    </main>
  );
}
