import type { Metadata } from 'next';
import { StoreNavbar } from '@/components/store/StoreNavbar';
import { HeroSection } from '@/components/store/HeroSection';
import { CategoryGrid } from '@/components/store/CategoryGrid';
import { FlashSale } from '@/components/store/FlashSale';
import { TrendingProducts } from '@/components/store/TrendingProducts';
import { PromoBanner } from '@/components/store/PromoBanner';
import { BestSellers } from '@/components/store/BestSellers';
import { Testimonials } from '@/components/store/Testimonials';
import { Newsletter } from '@/components/store/Newsletter';
import { StoreFooter } from '@/components/store/StoreFooter';

export default function StorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StoreNavbar />
      <main className="flex-1">
        <HeroSection />
        <CategoryGrid />
        <FlashSale />
        <TrendingProducts />
        <PromoBanner />
        <BestSellers />
        <Testimonials />
        <Newsletter />
      </main>
      <StoreFooter />
    </div>
  );
}