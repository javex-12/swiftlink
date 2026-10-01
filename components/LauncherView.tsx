"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Link as LinkIcon,
  Package,
  Settings,
  Store,
  Sun,
  Moon,
} from "lucide-react";
import { cn, getSmartFirstName } from "@/lib/utils";
// Deep imports, not the `@/components/ui` barrel: this file renders on `/` and
// `/pro`, and going through the barrel pulls every Radix primitive into those
// routes (measured +42 kB First Load JS once — see docs/03-DECISIONS.md P1).
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SetupGuide } from "@/components/SetupGuide";
import { WebsiteTemplatePicker } from "@/components/WebsiteTemplatePicker";

/**
 * The merchant dashboard.
 *
 * Rebuilt on the token layer and UI kit (docs/03-DECISIONS.md D5) so it reads as
 * one product with the rest of the console. The guided `SetupGuide` is the
 * centrepiece: instead of a dead-end pair of cards, a new merchant always sees
 * what is done, what is next, and one action to move forward.
 */
export function LauncherView() {
  const { copyShopLink, state, theme, toggleTheme, user } = useSwiftLink();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const firstName = getSmartFirstName(state.ownerName, user?.email, state.bizName);
  const storeName = state.bizName || "Your store";
  const handle = state.storeUsername ? `@${state.storeUsername}` : null;
  const planLabel = `${(state.plan ?? "free").toUpperCase()} PLAN`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 border-b border-app-border pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="SwiftLink"
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 object-contain lg:hidden"
          />
          <div className="min-w-0">
            <p className="text-sm text-app-text-muted">Welcome back</p>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-app-text">{firstName}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            <Icon icon={theme === "light" ? Moon : Sun} size="md" />
          </Button>
          <Link
            href="/account"
            aria-label="Account settings"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
          >
            <Avatar
              src={state.bizImage || null}
              name={storeName}
              seed={state.id ?? user?.id ?? "merchant"}
              size="md"
              ring
            />
          </Link>
        </div>
      </header>

      {/* ─── Store identity ───────────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Badge tone="accent">{planLabel}</Badge>
            <h2 className="truncate text-xl font-semibold tracking-tight text-app-text sm:text-2xl">
              {storeName}
            </h2>
            <p className="truncate text-sm text-app-text-muted">{handle ?? "No store link yet"}</p>
          </div>

          <div className="relative flex items-center gap-2">
            <Button asChild>
              <Link href="/business">
                <Icon icon={Store} size="sm" /> Open editor
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-label="Store options"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >
              <Icon
                icon={ChevronDown}
                size="md"
                className={cn("transition-transform duration-fast", dropdownOpen && "rotate-180")}
              />
            </Button>

            {dropdownOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-dropdown mt-2 w-56 overflow-hidden rounded-lg border border-app-border bg-app-surface p-1 shadow-md"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    copyShopLink();
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-app-text transition-colors hover:bg-app-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
                >
                  <Icon icon={LinkIcon} size="sm" className="text-app-accent-text" /> Copy store link
                </button>
                <Link
                  role="menuitem"
                  href="/account"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-app-text transition-colors hover:bg-app-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
                >
                  <Icon icon={Settings} size="sm" className="text-app-text-muted" /> Store settings
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {/* ─── What's next ──────────────────────────────────────────────────── */}
      <SetupGuide state={state} onShare={copyShopLink} />

      {/* ─── Choose your website ──────────────────────────────────────────── */}
      <WebsiteTemplatePicker />

      {/* ─── Store summary ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm text-app-text-muted">Products</p>
            <p className="text-3xl font-semibold tabular-nums text-app-text">{state.products.length}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/business">
              <Icon icon={Package} size="sm" /> Manage
            </Link>
          </Button>
        </Card>

        <Card className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm text-app-text-muted">Share your store</p>
            <p className="truncate text-sm font-medium text-app-text">
              {handle ?? "Set your handle first"}
            </p>
          </div>
          <Button variant="outline" onClick={copyShopLink}>
            <Icon icon={ExternalLink} size="sm" /> Copy link
          </Button>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-sm text-app-text-muted">
        <Link
          href="/business"
          className="inline-flex items-center gap-1 font-medium text-app-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          Continue building <Icon icon={ArrowRight} size="xs" />
        </Link>
      </div>
    </div>
  );
}
