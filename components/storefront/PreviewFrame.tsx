"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A device frame the storefront actually believes it is inside.
 *
 * The preview used to render the storefront in a `max-w-[390px]` div. That only
 * changed the *width*: every responsive rule in the templates is a viewport
 * media query, so a 390px frame inside a 1440px browser still laid the catalog
 * out in four columns and kept the desktop nav — the phone viewport showed a
 * desktop site in a narrow box, and the switcher looked broken.
 *
 * An iframe fixes it at the root: the portal below renders the storefront inside
 * the frame's own document, so `md:`/`lg:` and every other media query resolve
 * against the frame's width, `position: fixed` chrome (the bag bar, the shopper
 * screens) pins to the frame instead of the browser, and what the merchant sees
 * is the real site at that size rather than a scaled picture of it.
 *
 * The frame document is served `about:blank` with no scripts of its own, so it
 * inherits this origin and React can portal into it; nothing here ever navigates
 * it. `sandbox` is therefore left off deliberately — the parent document is the
 * trusted one, and the frame is its rendering surface, not an untrusted page.
 *
 * The frame's document needs the app's stylesheets, which is what the head
 * mirror is for: it copies `<link>`/`<style>` tags from the parent head and keeps
 * watching, because Next injects and swaps them during development.
 */

/** Measured frame widths. The phone/tablet sizes are the common device widths. */
export const PREVIEW_DEVICE_WIDTHS = {
  phone: 390,
  tablet: 768,
} as const;

function mirrorStyles(target: Document) {
  const copy = () => {
    const head = target.head;
    if (!head) return;

    const sources = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    );
    const existing = new Map(
      Array.from(head.querySelectorAll('link[rel="stylesheet"], style')).map((node) => [
        node.getAttribute("data-preview-key") ?? "",
        node,
      ]),
    );

    sources.forEach((source, index) => {
      const key = `${index}:${source.getAttribute("href") ?? source.textContent?.length ?? 0}`;
      const clone = source.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-preview-key", key);
      const current = existing.get(key);
      if (current) current.replaceWith(clone);
      else head.appendChild(clone);
    });
  };

  copy();
  const observer = new MutationObserver(copy);
  observer.observe(document.head, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}

export function PreviewFrame({
  width,
  height,
  className,
  style,
  children,
}: {
  /** Frame width in px, or null for "as wide as the modal". */
  width: number | null;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let stopMirror: (() => void) | undefined;

    const attach = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      // Frame chrome only. Heights are deliberately left alone so the
      // storefront's own `min-h-screen` resolves to the frame's viewport and the
      // frame document is what scrolls.
      doc.documentElement.style.margin = "0";
      doc.body.style.margin = "0";
      doc.body.style.overflowX = "hidden";
      stopMirror = mirrorStyles(doc);
      setBody(doc.body);
    };

    attach();
    iframe.addEventListener("load", attach);

    return () => {
      iframe.removeEventListener("load", attach);
      stopMirror?.();
      setBody(null);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        ...style,
        width: width === null ? "100%" : `${width}px`,
        height,
      }}
    >
      <iframe
        ref={iframeRef}
        title="Storefront preview"
        className="h-full w-full border-0 bg-transparent"
        // Same-origin, no scripts of its own: the storefront is portaled in by
        // the parent React tree, so the frame document only ever holds markup.
      />
      {body ? createPortal(children, body) : null}
    </div>
  );
}