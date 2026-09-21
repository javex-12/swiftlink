"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { Package, Plus, ShoppingCart, Store, Trash2, Upload } from "lucide-react";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Field,
  Icon,
  Input,
  PanelLoader,
  PromptDialog,
  Select,
  Skeleton,
  SkeletonRows,
  Switch,
  SwitchField,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
} from "@/components/ui";
import { contrastRatio } from "@/lib/theme/color";
import { buildTheme, themeToCssVars } from "@/lib/theme/derive";
import { themePresets } from "@/lib/theme/presets";
import { consoleContrastPairs, consoleDarkTokens, consoleLightTokens } from "@/lib/theme/tokens";

/**
 * Design-system showcase — the "did I break the kit or dark mode?" page.
 *
 * `docs/01-DESIGN-SYSTEM.md` §12.3/§12.4 asks for screenshot tests and a
 * Storybook-equivalent. This is the equivalent: one page rendering every kit
 * component in both console modes, every theme preset, and the real measured
 * contrast ratios. Playwright screenshots of this page are the natural next step.
 *
 * Dev only — it renders 404 in production, so it can never be indexed or shipped.
 */

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <Showcase />;
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-app-border pt-8">
      <div>
        <h2 className="text-lg font-semibold text-app-text">{title}</h2>
        {note ? <p className="text-sm text-app-text-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Showcase() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [promptOpen, setPromptOpen] = React.useState(false);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-display-3 font-semibold text-app-text">SwiftLink UI kit</h1>
        <p className="text-sm text-app-text-muted">
          Every component reads from tokens. Toggle dark mode on the console and this page should
          need no changes.
        </p>
      </header>

      <Section
        title="Console contrast"
        note="Measured live from styles/tokens.css. The table in lib/theme/tokens.ts declares which pairs must pass which minimum."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => {
            const tokens = mode === "light" ? consoleLightTokens : consoleDarkTokens;
            return (
              <div key={mode} className="rounded-lg border border-app-border p-4">
                <p className="mb-3 text-xs font-medium text-app-text-subtle">
                  {mode} mode · {Object.keys(consoleContrastPairs).length} declared pairs
                </p>
                <ul className="flex flex-col gap-1.5">
                  {consoleContrastPairs.map((pair) => {
                    const ratio = contrastRatio(
                      tokens[pair.fg as keyof typeof tokens],
                      tokens[pair.bg as keyof typeof tokens],
                    );
                    const ok = ratio >= pair.min;
                    return (
                      <li key={`${pair.fg}-${pair.bg}`} className="flex items-center gap-2 text-xs">
                        <span
                          className={ok ? "text-app-success" : "text-app-danger"}
                          aria-hidden="true"
                        >
                          {ok ? "✓" : "✕"}
                        </span>
                        <span className="font-mono text-app-text-muted">
                          {pair.fg}/{pair.bg}
                        </span>
                        <span className="ml-auto font-mono text-app-text">
                          {ratio.toFixed(2)} : {pair.min}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Theme presets"
        note="Each preset is a validated TenantTheme. Colors, type, radius, density and motion all come from the same derive() that will render the storefront."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themePresets.map((preset) => {
            const vars = themeToCssVars(preset) as React.CSSProperties;
            const derived = buildTheme(preset);
            return (
              <div key={preset.id} style={vars} className="overflow-hidden rounded-t-lg border border-app-border">
                <div
                  className="flex flex-col gap-2 p-3"
                  style={{ background: "var(--t-bg)", color: "var(--t-text)", fontFamily: "var(--t-font-display)" }}
                >
                  <span className="text-sm font-semibold">{preset.name}</span>
                  <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                    {preset.family} · {preset.fontPair} · {preset.radius} · {preset.density}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-t-sm px-2 py-1 text-xs font-medium"
                      style={{
                        background: "var(--t-accent)",
                        color: "var(--t-accent-fg)",
                        borderRadius: "var(--t-radius-sm)",
                      }}
                    >
                      Add to cart
                    </span>
                    <span
                      className="px-2 py-1 text-xs"
                      style={{
                        background: "var(--t-accent-subtle)",
                        color: "var(--t-accent-text)",
                        borderRadius: "var(--t-radius-sm)",
                      }}
                    >
                      New in
                    </span>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-app-border bg-app-surface p-3 text-xs">
                  {[
                    ["text/bg", derived.contrast.textOnBg, 7],
                    ["muted/bg", derived.contrast.textMutedOnBg, 4.5],
                    ["accent/bg", derived.contrast.accentOnBg, 3],
                    ["label/fill", derived.contrast.accentFgOnAccent, 4.5],
                  ].map(([label, value, min]) => (
                    <div key={String(label)} className="flex justify-between gap-2">
                      <dt className="text-app-text-subtle">{label}</dt>
                      <dd
                        className={
                          (value as number) >= (min as number) ? "font-mono text-app-success" : "font-mono text-app-danger"
                        }
                      >
                        {(value as number).toFixed(2)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {derived.adjustments.length > 0 ? (
                  <p className="border-t border-app-border px-3 py-2 text-xs text-app-text-muted">
                    {derived.adjustments[0]}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Save changes</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="link">Learn more</Button>
          <Button loading>Publishing</Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="outline" aria-label="Add product">
            <Icon icon={Plus} />
          </Button>
          <Tooltip content="Icon-only buttons need a label">
            <Button size="icon" variant="secondary" aria-label="Upload">
              <Icon icon={Upload} />
            </Button>
          </Tooltip>
        </div>
      </Section>

      <Section title="Badges and icons">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Draft</Badge>
          <Badge tone="accent">Live</Badge>
          <Badge tone="success">Paid</Badge>
          <Badge tone="warning">Awaiting stock</Badge>
          <Badge tone="danger">Refunded</Badge>
          <Badge tone="info">New</Badge>
          <Badge tone="outline">Optional</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-app-text-muted">
          <Icon icon={ShoppingCart} size="xs" />
          <Icon icon={ShoppingCart} size="sm" />
          <Icon icon={ShoppingCart} size="md" />
          <Icon icon={ShoppingCart} size="lg" />
          <Icon icon={Store} size="xl" />
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" hint="Shown on your storefront and receipts." required>
            <Input placeholder="Ada's Fabrics" defaultValue="Ada's Fabrics" />
          </Field>
          <Field label="Handle" hint="Letters, numbers and hyphens." error="That handle is taken.">
            <Input defaultValue="adas-fabrics" />
          </Field>
          <Field label="Category">
            <Select defaultValue="fabric">
              <option value="fabric">Fabric</option>
              <option value="tailoring">Tailoring</option>
            </Select>
          </Field>
          <Field label="Order message">
            <Textarea defaultValue={"Hi, I'd like to order:\n{cart_details}"} />
          </Field>
        </div>
        <div className="flex flex-col gap-4 rounded-lg border border-app-border p-4">
          <SwitchField label="Store is live" description="Customers can open your storefront." defaultChecked />
          <SwitchField label="Show out-of-stock products" description="Otherwise they are hidden." />
          <label className="flex items-center gap-3 text-sm text-app-text">
            <Checkbox defaultChecked /> Email me when an order arrives
          </label>
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete product
          </Button>
          <Button variant="secondary" onClick={() => setPromptOpen(true)}>
            Rename store
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Store actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Store</DropdownMenuLabel>
              <DropdownMenuItem>Preview storefront</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger">
                <Icon icon={Trash2} size="sm" /> Delete store
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete this product?"
          description="It will be removed from your storefront immediately. Past orders keep their record."
          confirmLabel="Delete product"
          tone="danger"
          onConfirm={() => setConfirmOpen(false)}
        />
        <PromptDialog
          open={promptOpen}
          onOpenChange={setPromptOpen}
          title="Rename store"
          label="Store name"
          defaultValue="Ada's Fabrics"
          confirmLabel="Rename"
          onConfirm={() => setPromptOpen(false)}
        />
      </Section>

      <Section title="Tabs and cards">
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Ankara Two-Piece</CardTitle>
                <CardDescription>₦18,500 · 4 in stock · Live</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-app-text-muted">
                Ordering happens over WhatsApp. Prices use tabular figures so columns line up.
              </CardContent>
              <CardFooter>
                <Button size="sm">Edit</Button>
                <Button size="sm" variant="ghost">
                  Duplicate
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="orders">
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Orders placed through WhatsApp will appear here with their total and status."
              action={<Button size="sm">Share store link</Button>}
            />
          </TabsContent>
          <TabsContent value="settings">
            <SkeletonRows rows={3} />
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Avatars" note="Tier 3/4 of the identity ladder: generated, deterministic, seeded — no emoji.">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Ada Lovelace" seed="user-1" size="xs" />
          <Avatar name="Ada Lovelace" seed="user-1" size="sm" />
          <Avatar name="Ada Lovelace" seed="user-1" size="md" />
          <Avatar name="Ada Ngozi Lovelace" seed="user-2" size="lg" status="online" />
          <Avatar name="Storehouse Foods" seed="store-9f2" size="xl" verified />
          <Avatar name="Branded" seed="store-9f2" size="lg" baseHue={150} hueSpread={30} />
          <Avatar
            name="With image"
            src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23047857'/%3E%3C/svg%3E"
            size="lg"
          />
          <AvatarGroup
            people={[
              { name: "Ada", seed: "a" },
              { name: "Chidi", seed: "b" },
              { name: "Ngozi", seed: "c" },
              { name: "Tunde", seed: "d" },
              { name: "Zara", seed: "e" },
              { name: "Kelechi", seed: "f" },
            ]}
          />
        </div>
      </Section>

      <Section title="Loading and empty">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <PanelLoader label="Loading products" />
        </div>
      </Section>
    </main>
  );
}
