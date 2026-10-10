import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import WorkGrid from '@/components/WorkGrid';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Marquee />
      <WorkGrid />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}
