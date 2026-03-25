"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  UserCog,
  CreditCard,
  Store,
  LogOut,
  ShoppingBag,
  MessageSquare,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const getNavItems = (slug: string) => [
  {
    title: "Dashboard",
    href: `/buyer/${slug}/dashboard`,
    icon: LayoutDashboard,
  },
  {
    title: "Cart",
    href: `/buyer/${slug}/dashboard/cart`,
    icon: ShoppingCart,
  },
  {
    title: "Wishlist",
    href: `/buyer/${slug}/dashboard/wishlist`,
    icon: Heart,
  },
  {
    title: "Messages",
    href: `/buyer/${slug}/dashboard/messages`,
    icon: MessageSquare,
  },
  {
    title: "Order History",
    href: `/buyer/${slug}/dashboard/history`,
    icon: ClipboardList,
  },
  {
    title: "Billing",
    href: `/buyer/${slug}/dashboard/billing`,
    icon: CreditCard,
  },
  {
    title: "Account",
    href: `/buyer/${slug}/dashboard/account`,
    icon: UserCog,
  },
  {
    title: "Back to Store",
    href: "/store",
    icon: Store,
  },
];

export function BuyerSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const slug = session?.user?.name ? slugify(session.user.name) : "";
  const navItems = getNavItems(slug);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/store" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Luxe</span>
        </Link>
        <p className="mt-2 truncate text-sm text-muted-foreground">
          {session?.user?.name || "Buyer"}
        </p>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/store/auth";
                },
              },
            })
          }
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
