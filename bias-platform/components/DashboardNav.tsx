"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, PlusCircle } from "lucide-react";

interface DashboardNavProps {
  email: string;
}

/** Top navigation bar for authenticated dashboard pages. */
export function DashboardNav({ email }: DashboardNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-6xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span>BiasAudit</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/dashboard/upload">
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New Audit
            </Button>
          </Link>
          <span className="hidden sm:block text-sm text-muted-foreground">{email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
