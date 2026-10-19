"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard } from "lucide-react";

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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getNavGroups, type NavGroup } from "./nav-items";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ rol }: { rol: string | null }) {
  const groups = getNavGroups(rol);
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="relative h-9 w-[126px] shrink-0 group-data-[collapsible=icon]:hidden">
              <Image
                src="/brand/logo-viva1a.png"
                alt="VIVA 1A IPS"
                fill
                priority
                sizes="126px"
                className="object-contain object-left"
              />
            </div>
            <div className="relative hidden size-8 shrink-0 group-data-[collapsible=icon]:block">
              <Image
                src="/brand/icono-viva1a.png"
                alt="VIVA 1A IPS"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Inicio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActivePath(pathname, "/dashboard")}
                  render={
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((group) =>
          group.collapsible ? (
            <CollapsibleGroup
              key={group.label}
              group={group}
              pathname={pathname}
            />
          ) : (
            <PlainGroup key={group.label} group={group} pathname={pathname} />
          )
        )}
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}

function PlainGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActivePath(pathname, item.href)}
                render={
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CollapsibleGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {group.label}
          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[open]/collapsible:rotate-90" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActivePath(pathname, item.href)}
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
