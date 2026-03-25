"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { ProductCard, type Product } from "./ProductCard";

interface SaleProduct {
  id: string;
  name: string;
  salePrice: number;
  originalPrice: number;
  discount: number;
  images: string[] | null;
  image: string | null;
  slug: string | null;
}

interface ActiveSale {
  id: string;
  name: string;
  endDate: string;
}

function toProductCardShape(p: SaleProduct): Product {
  const img =
    (Array.isArray(p.images) && p.images[0]) || p.image || "";
  return {
    id: p.id,
    name: p.name,
    price: p.salePrice / 100,
    originalPrice: p.originalPrice / 100,
    rating: 0,
    reviews: 0,
    image: img,
    discount: p.discount,
  };
}

function useCountdown(endDate: string | null) {
  const calc = () => {
    if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
    const s = Math.floor(diff / 1000);
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calc);

  useEffect(() => {
    if (!endDate) return;
    const timer = setInterval(() => setTimeLeft(calc), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate]);

  return timeLeft;
}

export function FlashSale() {
  const [sale, setSale] = useState<ActiveSale | null>(null);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/store/flash-sale")
      .then((r) => r.json())
      .then((d) => {
        setSale(d.sale ?? null);
        setProducts(d.products ?? []);
      })
      .finally(() => setLoaded(true));
  }, []);

  const timeLeft = useCountdown(sale?.endDate ?? null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 3 },
      "(min-width: 1280px)": { slidesToScroll: 4 },
    },
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  // Don't render section at all if no active sale
  if (loaded && !sale) return null;
  if (!loaded) return null;

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-red-500 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
        {value.toString().padStart(2, "0")}
      </div>
      <span className="text-[10px] text-gray-500 font-medium uppercase mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {sale?.name ?? "Flash Sale"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 mr-2 border-r pr-4">
              Ends in
            </span>
            <TimeUnit value={timeLeft.days} label="Days" />
            <span className="text-red-500 font-bold text-xl mt-[-16px]">:</span>
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <span className="text-red-500 font-bold text-xl mt-[-16px]">:</span>
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <span className="text-red-500 font-bold text-xl mt-[-16px]">:</span>
            <TimeUnit value={timeLeft.seconds} label="Secs" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={`p-2 rounded-full border transition-all ${
              canScrollPrev
                ? "hover:bg-gray-100 text-gray-800"
                : "opacity-30 cursor-not-allowed text-gray-400"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={`p-2 rounded-full border transition-all ${
              canScrollNext
                ? "hover:bg-gray-100 text-gray-800"
                : "opacity-30 cursor-not-allowed text-gray-400"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No products in this sale yet.
        </p>
      ) : (
        <div className="relative">
          <div className="overflow-hidden p-2 -m-2" ref={emblaRef}>
            <div className="flex backface-hidden touch-pan-y -ml-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex-[0_0_100%] min-w-0 pl-4 sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]"
                >
                  <ProductCard product={toProductCardShape(p)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
