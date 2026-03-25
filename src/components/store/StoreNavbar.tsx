"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  Menu,
  ChevronDown,
  X,
  Store,
  LayoutDashboard,
  ShoppingBag,
  Headphones,
  UserCircle,
  LogIn,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, slugify } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";

const categories = [
  "Women's Fashion",
  "Men's Fashion",
  "Electronics",
  "Home & Lifestyle",
  "Medicine",
  "Sports & Outdoor",
  "Baby's & Toys",
  "Groceries & Pets",
  "Health & Beauty",
];

export function StoreNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  const user = session?.user;
  const role = (user as { role?: string } | undefined)?.role ?? "buyer";
  const slug = user?.name ? slugify(user.name) : "";

  // Fetch cart & wishlist counts when logged in
  useEffect(() => {
    if (!user) { setCartCount(0); setWishlistCount(0); return; }
    fetch("/api/buyer/cart").then((r) => r.json()).then((d) => setCartCount(d.count ?? 0)).catch(() => {});
    fetch("/api/buyer/wishlist").then((r) => r.json()).then((d) => setWishlistCount(d.count ?? 0)).catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/store/products?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/store/products");
    }
  };

  const navLinks = [
    {
      label: "Store",
      href: "/store",
      icon: Store,
      description: "Browse all products",
    },
    {
      label: "Account",
      href: user
        ? role === "seller"
          ? `/seller/${slug}/dashboard/account`
          : `/buyer/${slug}/dashboard/account`
        : "/store/auth",
      icon: UserCircle,
      description: user ? `Signed in as ${user.name}` : "Sign in or create account",
    },
    {
      label: "Buyer Dashboard",
      href: user ? `/buyer/${slug}/dashboard` : "/store/auth",
      icon: LayoutDashboard,
      description: "Orders, wishlist & billing",
    },
    {
      label: "Seller Dashboard",
      href: user ? `/seller/${slug}/dashboard` : "/store/auth",
      icon: ShoppingBag,
      description: "Products, analytics & CRM",
    },
    {
      label: "Contact Support",
      href: "mailto:support@luxe.com",
      icon: Headphones,
      description: "Get help from our team",
    },
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md transition-all duration-300",
          isScrolled ? "border-b shadow-sm" : "border-b"
        )}
      >
        {/* Main Navigation Row */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 gap-8">
            {/* Logo */}
            <Link href="/store" className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm border border-primary/20">
                <ShoppingBagIcon className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-primary">Luxe</span>
            </Link>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-2xl relative items-center"
            >
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="w-full pl-10 pr-24 h-12 rounded-full bg-muted/50 border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <Button
                type="submit"
                variant="ghost"
                className="absolute right-1 top-1 bottom-1 rounded-full px-4 hover:bg-primary/10 text-muted-foreground hover:text-primary hidden lg:flex items-center gap-1"
              >
                Search <Search className="w-4 h-4" />
              </Button>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden sm:flex hover:bg-muted/50 rounded-full"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted/50 rounded-full"
                asChild
              >
                <Link href={user ? `/buyer/${slug}/dashboard/wishlist` : "/store/auth"}>
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-primary text-[10px]">
                      {wishlistCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted/50 rounded-full"
                asChild
              >
                <Link href={user ? `/buyer/${slug}/dashboard/cart` : "/store/auth"}>
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-primary text-[10px]">
                      {cartCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Menu icon — opens the drawer */}
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted/50 rounded-full"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="hidden md:block border-t bg-white/50">
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-between h-12 text-sm font-medium text-muted-foreground overflow-x-auto hide-scrollbar">
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/store/category/${category.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                    className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 relative group"
                  >
                    {category}
                    <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Drawer Overlay + Panel */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
              onClick={closeDrawer}
            />

            {/* Drawer Panel */}
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 z-50 h-full w-1/2 min-w-[320px] bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                    <ShoppingBagIcon className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-primary">Luxe</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted/60"
                  onClick={closeDrawer}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User greeting */}
              {user ? (
                <div className="px-6 py-4 bg-muted/30 border-b">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                    Signed in as
                  </p>
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              ) : (
                <div className="px-6 py-4 bg-muted/30 border-b">
                  <p className="text-sm text-muted-foreground">Sign in to access your dashboards.</p>
                  <Link
                    href="/store/auth"
                    onClick={closeDrawer}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in / Register
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.05, duration: 0.22 }}
                  >
                    <Link
                      href={link.href}
                      onClick={closeDrawer}
                      className="flex items-center gap-4 rounded-xl px-4 py-3.5 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <link.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {link.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {link.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <Separator />

              {/* Footer */}
              <div className="px-6 py-5">
                {user ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                    onClick={() => {
                      closeDrawer();
                      signOut({
                        fetchOptions: {
                          onSuccess: () => { window.location.href = "/store/auth"; },
                        },
                      });
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                ) : (
                  <Button asChild className="w-full" onClick={closeDrawer}>
                    <Link href="/store/auth">
                      <LogIn className="mr-2 w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
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
  );
}
