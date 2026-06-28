import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border/50 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xl font-bold tracking-tight gradient-text">
            ResumeTailor AI
          </span>
        </div>
      </header>
      <main className="flex-1">
        <HeroSection />
        <FeatureCards />
      </main>
      <Footer />
    </div>
  );
}
