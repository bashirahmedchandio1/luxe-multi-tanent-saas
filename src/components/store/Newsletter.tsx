"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";

export function Newsletter() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background with abstract blobs */}
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Subscribe to our Newsletter
            </h2>
            <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
              Be the first to know about new arrivals, sales & exclusive offers. Join our VIP list today and get 15% off your first order!
            </p>

            <form 
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email address"
                className="h-14 rounded-full px-6 bg-gray-50 border-gray-200 text-base flex-1 focus-visible:ring-primary/20"
                required
              />
              <Button type="submit" size="lg" className="h-14 rounded-full font-bold px-8">
                Subscribe Now
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-4">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
