"use client";

import * as React from "react";
import Image from "next/image";
import { useUser } from "@/lib/user-creds-provider";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SignOutButton, LoginButton } from "@/components/auth-buttons";

import { ThreadList } from "@/components/thread-list";
import type { Thread } from "@/lib/hooks/use-threads";

type ThreadListSidebarProps = React.ComponentProps<typeof Sidebar> & {
  threads: Thread[];
  loadingThreads: boolean;
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
};

export const ThreadListSidebar = React.memo(function ThreadListSidebar({
  threads,
  loadingThreads,
  activeThreadId,
  onThreadSelect,
  onNewThread,
  ...props
}: ThreadListSidebarProps) {
  const user = useUser();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <div>
                  <Image
                    src="/images/favicon.ico"
                    alt="DolFin AI Logo"
                    width={32}
                    height={32}
                  />
                  <div className="aui-sidebar-header-heading me-6 flex flex-col gap-0.5 leading-none">
                    <span className="aui-sidebar-header-title font-semibold">
                      Dolfin AI
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="aui-sidebar-content px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ThreadList
          threads={threads}
          loading={loadingThreads}
          activeThreadId={activeThreadId}
          onThreadSelect={onThreadSelect}
          onNewThread={onNewThread}
        />
      </SidebarContent>

      <SidebarRail />

      <SidebarFooter className="aui-sidebar-footer border-t">
        <SidebarMenu>
          <SidebarMenuItem className="mt-2 flex flex-col items-start justify-center">
            <SidebarMenuButton size="lg" asChild>
              <div>
                <Image
                  src={user?.image || "/images/default-avatar.png"}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-footer-title font-semibold">
                    {user?.name || "Guest"}
                  </span>
                  <span className="aui-sidebar-footer-email text-xs text-muted-foreground">
                    {user?.email || "Not logged in"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>

            {user?.email ? <SignOutButton /> : <LoginButton />}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});
