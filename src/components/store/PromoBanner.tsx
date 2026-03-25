"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function PromoBanner() {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="relative rounded-3xl overflow-hidden bg-gray-900 min-h-[300px] flex items-center">
        {/* Background Image Setup */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=2000&auto=format&fit=crop"
            alt="Promo Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-16 max-w-2xl text-white">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-md bg-white/20 backdrop-blur-md text-sm font-semibold tracking-wider mb-4 border border-white/20 uppercase">
              Limited Time Offer
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Enhance Your Workspace <br className="hidden md:block" />
              with Premium Gear
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg">
              Upgrade your productivity setup with our curated collection of high-end tech accessories and ergonomic furniture.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold px-8">
                Shop Collection
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 rounded-full font-bold px-8">
                View Details
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
