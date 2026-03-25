"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Handshake,
  Kanban,
  MessageSquare,
  Settings,
  CreditCard,
  UserCog,
  Store,
  LogOut,
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

const getNavGroups = (slug: string) => [
  {
    label: "Main",
    items: [
      {
        title: "Dashboard",
        href: `/seller/${slug}/dashboard`,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Store",
    items: [
      {
        title: "Products",
        href: `/seller/${slug}/dashboard/products`,
        icon: Package,
      },
      {
        title: "Orders",
        href: `/seller/${slug}/dashboard/orders`,
        icon: ShoppingBag,
      },
      {
        title: "Customers",
        href: `/seller/${slug}/dashboard/crm`,
        icon: Users,
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        title: "Analytics",
        href: `/seller/${slug}/dashboard/analytics`,
        icon: BarChart3,
      },
      {
        title: "CRM",
        href: `/seller/${slug}/dashboard/crm`,
        icon: Handshake,
      },
      {
        title: "Kanban",
        href: `/seller/${slug}/dashboard/kanban`,
        icon: Kanban,
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        title: "Messages",
        href: `/seller/${slug}/dashboard/messages`,
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Store Settings",
        href: `/seller/${slug}/dashboard/settings`,
        icon: Settings,
      },
      {
        title: "Billing",
        href: `/seller/${slug}/dashboard/billing`,
        icon: CreditCard,
      },
      {
        title: "Account",
        href: `/seller/${slug}/dashboard/account`,
        icon: UserCog,
      },
    ],
  },
  {
    label: "Navigation",
    items: [
      {
        title: "Back to Store",
        href: "/store",
        icon: Store,
      },
    ],
  },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const slug = session?.user?.name ? slugify(session.user.name) : "";
  const navGroups = getNavGroups(slug);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/store" className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Seller Hub</span>
        </Link>
        <p className="mt-2 truncate text-sm text-muted-foreground">
          {session?.user?.name || "Seller"}
        </p>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href + item.title}>
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
        ))}
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
