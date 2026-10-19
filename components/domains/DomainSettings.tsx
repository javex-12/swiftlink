"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Copy, Globe, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cnameTarget, domainProblem, normalizeDomain, verificationRecordName } from "@/lib/domains";
import type { Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Custom domain, in Settings.
 *
 * The panel only *asks* for things: it writes the domain row (owner-scoped RLS)
 * and calls the verification route. Whether the merchant controls the hostname is
 * decided from DNS on the server, never here — the browser cannot see DNS, and a
 * claim made in the browser would be worth nothing.
 *
 * Business-only, matching how the plan is sold. A Pro merchant sees why, rather
 * than a form that fails when they submit it.
 */

type DomainRow = {
  id: string;
  domain: string;
  verified_at: string | null;
  ssl_status: "pending" | "issued" | "failed";
  verification_token: string;
};

export function DomainSettings({
  currentPlan,
  storeId,
  storeHandle,
}: {
  currentPlan: Plan;
  storeId: string | null;
  storeHandle?: string;
}) {
  const { user, addToast } = useSwiftLink();
  const [rows, setRows] = useState<DomainRow[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("store_domains")
      .select("id, domain, verified_at, ssl_status, verification_token")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (loadError) setError(loadError.message);
    setRows((data as DomainRow[] | null) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    setError(null);
    const problem = domainProblem(value);
    if (problem) {
      setError(problem);
      return;
    }
    if (!user?.id || !storeId) {
      setError("No store to attach the domain to yet.");
      return;
    }
    const domain = normalizeDomain(value)!;
    if (rows.some((row) => row.domain === domain)) {
      setError("That domain is already on this account.");
      return;
    }

    setBusy("add");
    const { error: insertError } = await supabase.from("store_domains").insert({
      store_id: storeId,
      owner_id: user.id,
      domain,
    });
    setBusy(null);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That domain is already claimed. If it is yours, contact support."
          : insertError.message,
      );
      return;
    }
    setValue("");
    addToast(`${domain} added. Point its CNAME at ${cnameTarget()}, then verify.`, "info");
    await load();
  };

  const verify = async (domain: string) => {
    setError(null);
    setBusy(domain);
    try {
      const response = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        verified?: boolean;
        message?: string;
        error?: string;
      };
      if (payload.verified) {
        addToast(payload.message || "Domain verified.", "success");
        await load();
      } else {
        setError(payload.error || "That domain could not be verified yet.");
      }
    } catch {
      setError("Could not reach the verification service.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (row: DomainRow) => {
    if (!window.confirm(`Remove ${row.domain}? Customers using it will stop reaching your store.`)) {
      return;
    }
    setBusy(row.domain);
    const { error: deleteError } = await supabase.from("store_domains").delete().eq("id", row.id);
    setBusy(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    addToast(`${row.domain} removed.`, "success");
    await load();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("Copied.", "success");
    } catch {
      addToast("Could not copy — select the text instead.", "error");
    }
  };

  if (currentPlan !== "business") {
    return (
      <div className="flex items-start gap-3 rounded-[14px] border border-[#1E2D27] bg-[#0E1714] p-4">
        <Globe size={16} className="mt-0.5 shrink-0 text-[#9DB3A8]" />
        <p className="text-[11px] leading-relaxed text-[#9DB3A8]">
          Your own domain is a <strong className="text-[#E8F1EC]">Business</strong> feature. You keep
          using the domain you already own — point it at{" "}
          <code className="text-[#E8F1EC]">{cnameTarget()}</code> and your store answers on it with
          its own certificate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-[#1E2D27] bg-[#0E1714] p-4">
        <label htmlFor="custom-domain" className="text-[11px] font-semibold uppercase tracking-wider text-[#9DB3A8]">
          Add a domain
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="custom-domain"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="shop.yourbrand.com"
            inputMode="url"
            autoComplete="off"
            className="min-h-[44px] flex-1 rounded-[12px] border border-[#24382F] bg-[#0A1210] px-3 text-sm text-[#E8F1EC] outline-none placeholder:text-[#5C7268] focus:border-[#19C37D]"
          />
          <button
            type="button"
            onClick={() => void add()}
            disabled={busy === "add" || !storeId}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] bg-[#19C37D] px-4 text-xs font-bold text-[#04140D] transition hover:bg-[#16B070] disabled:opacity-60"
          >
            {busy === "add" ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Add domain
          </button>
        </div>
        {!storeId && (
          <p className="mt-2 text-[11px] text-[#9DB3A8]">Publish a store first, then add a domain to it.</p>
        )}
        {error && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-[11px] text-[#FF8A8A]">
            <TriangleAlert size={12} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-[11px] text-[#9DB3A8]">Checking your domains…</p>
      ) : rows.length === 0 ? (
        <p className="text-[11px] text-[#9DB3A8]">
          No domain connected yet. Your store stays reachable at{" "}
          <strong className="text-[#E8F1EC]">/{storeHandle || "your-handle"}</strong> either way.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const verified = Boolean(row.verified_at);
            return (
              <li key={row.id} className="rounded-[14px] border border-[#1E2D27] bg-[#0E1714] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className={verified ? "text-[#19C37D]" : "text-[#9DB3A8]"} />
                    <span className="text-sm font-semibold text-[#E8F1EC]">{row.domain}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        verified
                          ? "bg-[#19C37D]/15 text-[#19C37D]"
                          : "bg-[#E8B93A]/15 text-[#E8B93A]",
                      )}
                    >
                      {verified ? <CheckCircle2 size={10} /> : null}
                      {verified ? "Verified" : "Waiting for DNS"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!verified && (
                      <button
                        type="button"
                        onClick={() => void verify(row.domain)}
                        disabled={busy === row.domain}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[10px] border border-[#24382F] px-3 text-[11px] font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] disabled:opacity-60"
                      >
                        {busy === row.domain ? <Loader2 size={12} className="animate-spin" /> : null}
                        Verify now
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void remove(row)}
                      disabled={busy === row.domain}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[10px] border border-[#24382F] px-3 text-[11px] font-semibold text-[#9DB3A8] transition hover:border-[#FF8A8A]/60 hover:text-[#FF8A8A] disabled:opacity-60"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>

                {!verified && (
                  <div className="mt-3 space-y-2 rounded-[10px] border border-[#1E2D27] bg-[#0A1210] p-3 text-[11px] text-[#9DB3A8]">
                    <p>Create this record at your DNS provider, then press Verify now:</p>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#E8F1EC]">
                      <span>CNAME</span>
                      <span className="text-[#9DB3A8]">{row.domain}</span>
                      <span>→</span>
                      <span>{cnameTarget()}</span>
                      <button
                        type="button"
                        onClick={() => void copy(cnameTarget())}
                        className="text-[#9DB3A8] hover:text-[#19C37D]"
                        aria-label="Copy CNAME target"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                    <p className="text-[10px] opacity-70">
                      Optional ownership proof: TXT{" "}
                      <span className="font-mono">{verificationRecordName(row.domain)}</span> ={" "}
                      <span className="font-mono">{row.verification_token}</span>
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
