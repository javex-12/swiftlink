import * as React from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarGeometry, avatarIds, initialsFrom, AVATAR_VIEWBOX } from "@/lib/avatar";

/**
 * Avatar — one component for every identity in the product.
 *
 * Resolution ladder (`docs/01-DESIGN-SYSTEM.md` §8):
 *   1. an uploaded image (user avatar or store logo)
 *   2. a provider image (Google profile photo)
 *   3. a deterministic generated SVG, seeded by user/store id
 *   4. branded initials over an accent gradient
 *
 * Tiers 1 and 2 arrive as `src`, so this component picks between them and the
 * generated tiers 3/4 — it never shows an empty box, which is what the old
 * `👨‍🚀` and `charCodeAt % N` avatars were papering over.
 *
 * Renders on the server (no hooks), so a storefront list of commenters costs no
 * client JS.
 */

export const AVATAR_SIZES = { xs: 20, sm: 28, md: 36, lg: 48, xl: 80 } as const;
export type AvatarSize = keyof typeof AVATAR_SIZES;

export type AvatarStatus = "online" | "offline" | "busy";

export type AvatarProps = {
  /** Tier 1/2 — uploaded or provider image. */
  src?: string | null;
  /** Display name. Used for the tier-3 seed and the tier-4 initials. */
  name?: string | null;
  /** Tier-3 seed: prefer a stable id (user id, store id) over a name. */
  seed?: string | null;
  size?: AvatarSize;
  /** Adds a token ring — use to group a stack of avatars. */
  ring?: boolean;
  status?: AvatarStatus | null;
  verified?: boolean;
  shape?: "circle" | "square";
  /** Tenants can pin generated avatars to their brand hue (storefront scope). */
  baseHue?: number;
  hueSpread?: number;
  className?: string;
};

const STATUS_CLASS: Record<AvatarStatus, string> = {
  online: "bg-app-success",
  offline: "bg-app-text-subtle",
  busy: "bg-app-warning",
};

export function Avatar({
  src,
  name,
  seed,
  size = "md",
  ring = false,
  status = null,
  verified = false,
  shape = "circle",
  baseHue,
  hueSpread,
  className,
}: AvatarProps) {
  const px = AVATAR_SIZES[size];
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-lg";
  const seedInput = seed?.trim() || name?.trim() || "swiftlink";
  const geometry = avatarGeometry(seedInput, { baseHue, hueSpread });
  const ids = avatarIds(geometry.seed);
  const initials = initialsFrom(name);

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: px, height: px }}
    >
      {src ? (
        /*
         * Deliberately a plain <img>. Avatar sources are arbitrary remote hosts
         * (Google profile photos, tenant-uploaded storage, merchant-pasted image
         * URLs); next/image needs a static host allowlist and throws at runtime
         * on an unknown host, which would break avatars rather than optimise them.
         * Product imagery — where the host *is* known — uses next/image instead.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ? `${name}'s avatar` : ""}
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-cover",
            shapeClass,
            ring && "ring-2 ring-app-surface",
          )}
        />
      ) : (
        <svg
          viewBox={`0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}`}
          width={px}
          height={px}
          aria-hidden="true"
          className={cn(shapeClass, ring && "ring-2 ring-app-surface", "overflow-hidden")}
        >
          <defs>
            <linearGradient id={ids.gradient} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={geometry.from} />
              <stop offset="100%" stopColor={geometry.to} />
            </linearGradient>
            <filter id={ids.blur} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>
          <rect width={AVATAR_VIEWBOX} height={AVATAR_VIEWBOX} fill={`url(#${ids.gradient})`} />
          <g
            filter={`url(#${ids.blur})`}
            transform={`rotate(${geometry.angle} ${AVATAR_VIEWBOX / 2} ${AVATAR_VIEWBOX / 2})`}
          >
            {geometry.stops.map((stop, i) => (
              <circle
                key={i}
                cx={stop.cx}
                cy={stop.cy}
                r={stop.r}
                fill={stop.color}
                opacity={stop.opacity}
              />
            ))}
          </g>
        </svg>
      )}

      {/* Initials sit on top of the generated mesh: tier 4 stays legible on tier 3. */}
      {!src && initials !== "?" ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex select-none items-center justify-center",
            "font-semibold text-white mix-blend-luminosity",
          )}
          style={{ fontSize: Math.max(9, Math.round(px * 0.38)) }}
        >
          {initials}
        </span>
      ) : null}

      {/* Accessible name when there is no image alt to carry it. */}
      <span className="sr-only">{name ? `${name}` : "User avatar"}</span>

      {verified ? (
        <BadgeCheck
          aria-label="Verified"
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full bg-app-surface text-app-accent",
            size === "xs" ? "h-3 w-3" : size === "sm" ? "h-4 w-4" : "h-5 w-5",
          )}
        />
      ) : status ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-app-surface",
            STATUS_CLASS[status],
            size === "xs" || size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
          )}
        />
      ) : null}
    </span>
  );
}

/** Overlapping stack for "who else bought this" and similar social proof. */
export function AvatarGroup({
  people,
  size = "sm",
  max = 4,
  className,
}: {
  people: AvatarProps[];
  size?: AvatarSize;
  max?: number;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <span className={cn("flex items-center", className)}>
      {shown.map((person, i) => (
        <Avatar
          key={person.seed ?? person.name ?? i}
          {...person}
          size={size}
          ring
          className={i > 0 ? "-ml-2" : undefined}
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            "-ml-2 inline-flex items-center justify-center rounded-full bg-app-surface-2 font-medium text-app-text-muted ring-2 ring-app-surface",
            size === "xs" ? "h-5 w-5 text-xs" : "h-7 w-7 text-xs",
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
