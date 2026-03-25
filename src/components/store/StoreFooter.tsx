"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, CreditCard } from "lucide-react";

export function StoreFooter() {
  return (
    <footer className="bg-gray-950 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/store" className="flex items-center gap-2 mb-6">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm border border-primary/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-primary">Luxe</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Your ultimate destination for premium lifestyle products. We curate the best items around the globe to enhance your everyday life.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>123 Commerce Avenue, New York, NY 10012</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@luxe-store.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6">Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Men's Fashion</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Women's Fashion</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Electronics & Gadgets</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Home & Living</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Health & Beauty</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Store Locator</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Our Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Customer Care</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Help Center & FAQ</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Track Your Order</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Return Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Luxe E-Commerce. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Youtube className="w-5 h-5" />
            </a>
          </div>

          {/* Payment Methods Placeholder */}
          <div className="flex items-center gap-2">
             <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400"/>
             </div>
             <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400"/>
             </div>
             <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400"/>
             </div>
             <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400"/>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
