"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  MessageSquare,
  Handshake,
  Mail,
  BarChart3,
  Settings,
  CreditCard,
  UserCog,
  Shield,
  LogOut,
  Zap,
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
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: `/luxe/${slug}/dashboard`,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Users",
    items: [
      {
        title: "Sellers",
        href: `/luxe/${slug}/dashboard/users/sellers`,
        icon: Store,
      },
      {
        title: "Buyers",
        href: `/luxe/${slug}/dashboard/users/buyers`,
        icon: Users,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        title: "All Orders",
        href: `/luxe/${slug}/dashboard/orders`,
        icon: ShoppingBag,
      },
      {
        title: "Sales & Promotions",
        href: `/luxe/${slug}/dashboard/sales`,
        icon: Zap,
      },
      {
        title: "Communications",
        href: `/luxe/${slug}/dashboard/communications`,
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "CRM",
        href: `/luxe/${slug}/dashboard/crm`,
        icon: Handshake,
      },
      {
        title: "Email Center",
        href: `/luxe/${slug}/dashboard/email`,
        icon: Mail,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Platform Analytics",
        href: `/luxe/${slug}/dashboard/analytics`,
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Settings",
        href: `/luxe/${slug}/dashboard/settings`,
        icon: Settings,
      },
      {
        title: "Billing",
        href: `/luxe/${slug}/dashboard/settings`,
        icon: CreditCard,
      },
      {
        title: "Admin Account",
        href: `/luxe/${slug}/dashboard/account`,
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

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const slug = session?.user?.name ? slugify(session.user.name) : "";
  const navGroups = getNavGroups(slug);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/store" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Luxe Admin</span>
        </Link>
        <p className="mt-2 truncate text-sm text-muted-foreground">
          {session?.user?.name || "Administrator"}
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
