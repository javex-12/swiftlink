"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { type User } from "@supabase/supabase-js";
import {
  getShopPath,
  parseShopFromPathname,
  getPublicStoreSlug,
  normalizeStoreUsername,
} from "@/lib/utils";
import { defaultShopState, loadStateLocal, normalizeShopState, type ShopState, type AppNotification } from "@/lib/types";
import {
  accountPlanFor,
  effectiveProductLimitFor,
  productLimitBlockedMessage,
  reconcileAccountPlan,
  visibleProductCount,
} from "@/lib/plans";
import { clearEditorDraft, writeEditorDraft, type EditorDraft } from "@/lib/draft-store";
import { deleteStoreDraft, storeDraftKey, writeStoreDraft } from "@/lib/store-drafts";
import { recordOrderIntent, toMinorUnits, type OrderIntentItem } from "@/lib/inquiry-write";
import { buildCartOrderMessage, type CartOrderLine } from "@/lib/order-message";
import { type ToastType, ToastContainer } from "@/components/CustomToast";

type CartMap = Record<number, number>;

type TourStepView = "launcher" | "business";

type TourStep = {
  title: string;
  desc: string;
  view: TourStepView;
  action?: () => Promise<void>;
};

type SwiftLinkContextValue = {
  state: ShopState;
  stores: ShopState[];
  switchStore: (id: string) => Promise<void>;
  createNewStore: (name: string) => Promise<void>;
  transferStore: (targetEmail: string) => Promise<boolean>;
  cart: CartMap;
  user: User | null;
  isAdmin: boolean;
  isSupabaseActive: boolean;
  isOwner: boolean;
  tourOpen: boolean;
  currentTourStep: number;
  isSimulating: boolean;
  handHidden: boolean;
  handStyle: React.CSSProperties;
  handClick: boolean;
  loadingOverlay: boolean;
  cartOpen: boolean;
  navigateTo: (view: TourStepView) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  closeTour: () => void;
  updateState: (field: keyof ShopState, value: unknown) => void;
  setStateMerge: (partial: Partial<ShopState>) => void;
  saveFullState: (next: ShopState) => void;
  /** Autosaved drafts keyed by store id. Never live until `saveFullState`. */
  drafts: Record<string, EditorDraft>;
  /** Autosave the merchant's working copy (local + server). Publishes nothing. */
  saveDraft: (next: ShopState) => Promise<{ savedAt: string | null; synced: boolean }>;
  /** Drop a draft once it has been published or the merchant discards it. */
  discardDraft: (storeKey?: string | null) => Promise<void>;
  copyShopLink: () => void;
  handleSignOut: () => void;
  authSignOut: () => Promise<void>;
  emailSignIn: (e: string, p: string) => Promise<void>;
  emailSignUp: (e: string, p: string) => Promise<void>;
  addProduct: () => void;
  updateProduct: (id: number, field: string, value: unknown) => void;
  removeProduct: (id: number) => void;
  handleImageUpload: (
    file: File | undefined,
    field: "bizImage" | "heroImage" | "image",
    productId?: number,
  ) => void;
  addProductImage: (productId: number, file: File) => void;
  removeProductImage: (productId: number, index: number) => void;
  setPrimaryImage: (productId: number, index: number) => void;
  updateCart: (id: number, delta: number) => void;
  toggleCartDrawer: (open: boolean) => void;
  sendWhatsAppOrder: () => void;
  cartItemCount: number;
  isSyncing: boolean;
  toasts: any[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  addToast: (msg: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  addSystemNotification: (title: string, message: string, type?: "order" | "message" | "trend" | "feedback") => void;
  feedbackOpen: boolean;
  setFeedbackOpen: React.Dispatch<React.SetStateAction<boolean>>;
  socialHubOpen: boolean;
  setSocialHubOpen: React.Dispatch<React.SetStateAction<boolean>>;
  submitFeedback: (type: string, message: string) => Promise<void>;
  logEvent: (type: string, metadata?: any) => Promise<void>;
};

const SwiftLinkContext = createContext<SwiftLinkContextValue | null>(null);


const PROTECTED_PATHS = ["/pro", "/business", "/account", "/cart"];

export function SwiftLinkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<ShopState>(defaultShopState());
  const [stores, setStores] = useState<ShopState[]>([]);
  const [drafts, setDrafts] = useState<Record<string, EditorDraft>>({});
  const [cart, setCart] = useState<CartMap>({});
  const [user, setUser] = useState<User | null>(null);

  const fetchStores = useCallback(async (userId: string) => {
    try {
      if (!isSupabaseConfigured()) return [];
      // Select plan and account_status columns alongside state_json
      const { data } = await supabase.from('stores').select('id, owner_id, plan, account_status, plan_grace_until, plan_lapsed_at, state_json').eq('owner_id', userId);
      if (data) {
          /*
           * Entitlements are per *account*, not per row: every store this user
           * owns belongs to the same subscription, so the account's plan is the
           * most privileged plan among them (`accountPlanFor`). Reading `s.plan`
           * one row at a time instead let a single stale or free row cap a
           * paying Business account at the free tier's 6 products — the store
           * created by `createNewStore` used to be inserted as `plan: 'free'`,
           * and this load treats the column as authoritative.
           */
          const { accountPlan, staleIds } = reconcileAccountPlan(data as any[]);

          const loadedStores = data.map((s: any) => {
            return normalizeShopState({
              ...(s.state_json as Partial<ShopState>),
              id: s.id,
              ownerId: s.owner_id,
              plan: accountPlan,
              planGraceUntil: s.plan_grace_until ?? null,
              planLapsedAt: s.plan_lapsed_at ?? null,
            });
          });
          setStores(loadedStores);

          // Repair any row whose `plan` column disagrees with the account's, so
          // the mismatch cannot reappear on the next load. Best-effort: a failed
          // repair must never stop the console from opening.
          if (staleIds.length) {
            void (async () => {
              const { error: repairError } = await supabase
                .from('stores')
                .update({ plan: accountPlan })
                .in('id', staleIds);
              if (repairError) console.warn("Store plan reconciliation failed:", repairError);
            })();
          }

          // Autosaved drafts. They live in their own owner-scoped table, never on
          // the world-readable `stores` row, so unpublished work cannot leak to
          // the storefront. A missing table (older backend) just means no draft.
          const draftMap: Record<string, EditorDraft> = {};
          const storeIds = loadedStores.map((s) => s.id).filter(Boolean) as string[];
          if (storeIds.length) {
            const { data: draftRows } = await supabase
              .from('store_drafts')
              .select('store_id, draft_json, updated_at')
              .in('store_id', storeIds);
            (draftRows || []).forEach((row: any) => {
              if (!row?.draft_json) return;
              draftMap[row.store_id] = {
                savedAt: row.updated_at || new Date().toISOString(),
                state: normalizeShopState(row.draft_json as Partial<ShopState>),
              };
            });
          }
          setDrafts(draftMap);

          // Check if the primary store is banned
          const primaryStore = data[0];
          if (primaryStore?.account_status === 'banned') {
            router.replace('/banned');
          }

          return loadedStores;
      }
    } catch (e) {
      console.warn("fetchStores database query failed:", e);
    }
    return [];
  }, [router]);

  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [handHidden, setHandHidden] = useState(true);
  const [handStyle, setHandStyle] = useState<React.CSSProperties>({
    top: 0,
    left: 0,
  });
  const [handClick, setHandClick] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [authReady, setAuthReady] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [socialHubOpen, setSocialHubOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured()) {
      // Demo mode: admins are NEVER granted automatically
      setIsAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('system_admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      const isAdminUser = !!(data && !error);
      setIsAdmin(isAdminUser);
      // Admins always get Business tier — upgrade state immediately
      if (isAdminUser) {
        setState(prev => ({ ...prev, plan: 'business' }));
      }
    } catch (e) {
      console.warn("Failed to query system_admins table:", e);
      setIsAdmin(false);
    }
  }, []);

  // The console is DARK ONLY: permanently enforce dark tokens and the .dark class
  const applyTheme = useCallback((_t?: "light" | "dark") => {
    setTheme("dark");
    if (typeof window !== "undefined") {
      localStorage.setItem("swiftlink_theme", "dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    // Console is strictly dark-only
    applyTheme("dark");
  }, [applyTheme]);

  const loadThemeFromDB = useCallback(async (_userId: string) => {
    // Console is dark only
    applyTheme("dark");
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    // No-op for console: strictly dark only
    applyTheme("dark");
  }, [applyTheme]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const createNewStore = useCallback(async (name: string) => {
    if (!user) return;
    const newId = crypto.randomUUID();
    /*
     * A new store joins the *account's* existing plan instead of being forced
     * to 'free'. Hard-coding 'free' demoted a paying Business merchant the
     * moment they added a store — the DB `plan` column is authoritative on the
     * next load, so the whole account dropped to the free tier (6 products, no
     * multi-store switching).
     */
    const accountPlan = accountPlanFor(stores.length ? stores : [state]);
    const baseHandle = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanHandle = baseHandle || `store-${Math.random().toString(36).substring(2, 7)}`;
    
    const newState = normalizeShopState({ 
        id: newId, 
        ownerId: user.id,
        ownerName: state.ownerName || "",
        phone: state.phone || "",
        currency: state.currency || "₦",
        bizName: name, 
        plan: accountPlan,
        storeUsername: cleanHandle 
    });
    
    const { error } = await supabase.from('stores').insert({
        id: newId,
        owner_id: user.id,
        biz_name: name,
        store_username: cleanHandle,
        phone: newState.phone,
        plan: accountPlan,
        account_status: 'active',
        state_json: newState
    });

    if (error) {
        console.error("[createNewStore] Supabase error:", error);
        addToast(`Store creation failed: ${error.message}`, "error");
        return;
    }

    setStores(prev => [...prev, newState]);
    setState(newState);
    localStorage.setItem("swiftlink_state", JSON.stringify(newState));
    addToast(`"${name}" store created!`, "success");
    void fetchStores(user.id);
  }, [user, addToast, fetchStores, stores, state]);

  const switchStore = useCallback(async (id: string) => {
    const target = stores.find(s => s.id === id);
    if (target) {
        setState(target);
        addToast(`Switched to ${target.bizName}`, "success");
    }
  }, [stores, addToast]);

  const transferStore = useCallback(async (targetEmail: string) => {
    if (!user || !state.id) return false;
    
    const transferredId = state.id;
    
    // CRITICAL: Clear any pending syncs before transfer to prevent overwriting ownership
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setIsSyncing(false);

    try {
      const { error } = await supabase.rpc('transfer_store_by_email', {
        store_id_param: transferredId,
        target_email: targetEmail
      });
      if (error) {
        console.error("[transferStore] error:", error);
        addToast(error.message, "error");
        return false;
      }
      
      addToast("Store transferred successfully!", "success");

      // IMMEDIATELY update local lists and clear state for the transferred store
      setStores(prev => {
          const next = prev.filter(s => s.id !== transferredId);
          if (next.length > 0) {
              setState(next[0]);
              localStorage.setItem("swiftlink_state", JSON.stringify(next[0]));
          } else {
              const fallback = normalizeShopState({ id: crypto.randomUUID(), ownerId: user.id });
              setState(fallback);
              localStorage.setItem("swiftlink_state", JSON.stringify(fallback));
          }
          return next;
      });

      // Force refresh stores from server to be absolutely sure
      await fetchStores(user.id);
      
      return true;
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to transfer store", "error");
      return false;
    }
  }, [user, state.id, addToast, fetchStores]);

  const isOwnerRef = useRef(true);
  const userRef = useRef<User | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shopFromQuery = searchParams.get("shop");
  // `?src=` lets a merchant tag a shared link (whatsapp/instagram/tiktok) so a
  // recorded inquiry can be attributed to the channel that produced it.
  const inquirySrc = searchParams.get("src");
  const pathShop = parseShopFromPathname(pathname);
  const shopQ = shopFromQuery;

  const pathShopId = pathShop?.kind === "uid" ? pathShop.shopId : null;
  // A bare `/<handle>` is also a customer view: the store identity is in the
  // path, so the context must switch into customer mode for the same reasons it
  // does for `?shop=` (see the canonical route in app/[storeSlug]/page.tsx).
  const pathShopSlug = pathShop?.kind === "slug" ? pathShop.slug : null;
  const customerShopId = shopFromQuery || pathShopId || null;
  const isCustomerMode = Boolean(customerShopId) || Boolean(pathShopSlug);
  const isOwner = !isCustomerMode;
  const isProtectedRoute = PROTECTED_PATHS.some(
    (protectedPath) =>
      pathname === protectedPath || pathname.startsWith(`${protectedPath}/`),
  );

  isOwnerRef.current = isOwner;
  userRef.current = user;

  const navigateTo = useCallback(
    (view: TourStepView) => {
      if (view === "launcher") router.push("/pro");
      if (view === "business") router.push("/business");
    },
    [router],
  );

  const persistState = useCallback(
    (next: ShopState) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("swiftlink_state", JSON.stringify(next));
      }
      
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      setIsSyncing(true);
      
      syncTimeoutRef.current = setTimeout(async () => {
          if (!isSupabaseConfigured()) {
            // Demo mode: the local write is the only store there is, so the
            // working copy has effectively been published.
            setIsSyncing(false);
            clearEditorDraft(storeDraftKey(next));
            return;
          }
          if (isOwnerRef.current && userRef.current?.id) {
            const uid = userRef.current.id;
            
            const storeId = next.id || uid;
            const stateToSave = { ...next, id: storeId, ownerId: uid };
            
            const { error } = await supabase
              .from('stores')
              .upsert({
                id: storeId,
                owner_id: uid,
                biz_name: next.bizName,
                store_username: next.storeUsername,
                phone: next.phone,
                state_json: stateToSave,
                updated_at: new Date().toISOString()
              });

            if (error) {
              console.error("Supabase Sync Error:", error);
            } else {
              // Publishing makes the live store the newest truth, so the draft
              // for it is stale. Dropping it here — and only after a confirmed
              // write — means a failed save never costs the merchant their work.
              clearEditorDraft(storeDraftKey(stateToSave));
              void deleteStoreDraft(storeId);
              setDrafts((prev) => {
                if (!(storeId in prev)) return prev;
                const nextDrafts = { ...prev };
                delete nextDrafts[storeId];
                return nextDrafts;
              });
            }
          }
          setIsSyncing(false);
      }, 1500);
    },
    [],
  );

  const saveFullState = useCallback(
    (next: ShopState) => {
      setState(next);
      persistState(next);
    },
    [persistState],
  );

  // --- Autosave (draft) ----------------------------------------------------
  // Autosave records work in progress; it never touches the live store. The
  // local write happens first and unconditionally, so an offline merchant (or a
  // backend without the drafts table) still keeps their edits across a reload.
  const saveDraft = useCallback(
    async (next: ShopState): Promise<{ savedAt: string | null; synced: boolean }> => {
      const storeKey = storeDraftKey(next);
      const localSavedAt = writeEditorDraft(storeKey, next);

      const ownerId = userRef.current?.id || null;
      const storeId = typeof next.id === "string" && next.id ? next.id : ownerId;
      let serverSavedAt: string | null = null;
      if (isOwnerRef.current && ownerId && storeId) {
        serverSavedAt = await writeStoreDraft(storeId, ownerId, next);
        if (serverSavedAt) {
          setDrafts((prev) => ({ ...prev, [storeId]: { savedAt: serverSavedAt as string, state: next } }));
        }
      }
      return { savedAt: serverSavedAt || localSavedAt, synced: Boolean(serverSavedAt) };
    },
    [],
  );

  const discardDraft = useCallback(async (storeKey?: string | null) => {
    const key = storeDraftKey({ id: storeKey ?? null, ownerId: userRef.current?.id });
    if (!key) return;
    clearEditorDraft(key);
    await deleteStoreDraft(key);
    setDrafts((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setStateMerge = useCallback(
    (partial: Partial<ShopState>) => {
      setState((prev) => {
        const next = { ...prev, ...partial };
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  const updateState = useCallback(
    (field: keyof ShopState, value: unknown) => {
      let nextValue: unknown = value;
      if (typeof value === "string") {
        if (field === "bizName") nextValue = value.slice(0, 60);
        if (field === "tagline") nextValue = value.slice(0, 120);
        if (field === "phone") nextValue = value.slice(0, 20);
        if (field === "storeUsername")
          nextValue = normalizeStoreUsername(value).slice(0, 32);
      }
      setState((prev) => {
        const next = { ...prev, [field]: nextValue } as ShopState;
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  const addSystemNotification = useCallback((title: string, message: string, type: "order" | "message" | "trend" | "feedback" = "message") => {
    const id = Date.now().toString();
    const newNotif: AppNotification = {
        id,
        title,
        message,
        type,
        timestamp: "Just now",
        read: false
    };
    setState(prev => {
        const next = { ...prev, notifications: [newNotif, ...(prev.notifications || [])].slice(0, 20) };
        persistState(next);
        return next;
    });
  }, [persistState]);

  const submitFeedback = useCallback(async (type: string, message: string) => {
    if (!message.trim()) return;
    
    if (isSupabaseConfigured() && userRef.current) {
        const { error } = await supabase.from('user_feedback').insert({
            user_id: userRef.current.id,
            store_id: stateRef.current.id,
            type,
            message,
            metadata: {
                path: window.location.pathname,
                userAgent: navigator.userAgent
            }
        });

        if (error) {
            addToast("Failed to send feedback. Try again.", "error");
            console.error(error);
        } else {
            addToast("Feedback sent! Thank you for helping us improve.", "success");
            setFeedbackOpen(false);
            addSystemNotification("Feedback Sent", "We've received your report.", "feedback");
        }
    } else {
        // Fallback or guest feedback
        addToast("Please sign in to send feedback.", "error");
    }
  }, [addToast, addSystemNotification]);

  const logEvent = useCallback(async (event_type: string, metadata: any = {}) => {
    const sid = metadata.shopId || stateRef.current.id;
    if (!sid || !isSupabaseConfigured()) return;

    void supabase.from('store_events').insert({
        store_id: sid,
        event_type,
        product_id: metadata.productId || null,
        metadata: {
            ...metadata,
            url: window.location.href,
            referrer: document.referrer
        }
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoadingOverlay(false), 2000);
    
    // STRICT PRODUCTION LOGIC:
    // We do NOT call setState(loadStateLocal()) immediately.
    // Instead, we wait for the session check in initAuth() or handle it here.
    if (isSupabaseConfigured()) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        setState(session ? loadStateLocal() : defaultShopState());
      });
      setIsSupabaseActive(true);
    } else {
      // Demo / unconfigured: the Supabase client throws by design, so never touch
      // it here (docs/04-SUPABASE-WORKFLOW.md §4). Restore the local blob when a
      // demo login is active, otherwise start from a fresh store.
      const isDemo =
        typeof window !== "undefined" &&
        localStorage.getItem("swiftlink_demo_login") === "true";
      setState(isDemo ? loadStateLocal() : defaultShopState());
    }
    
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isCustomerMode && customerShopId) {
      setState((prev) => ({ ...prev, id: customerShopId }));
    }
  }, [isCustomerMode, customerShopId]);

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      const isDemo = typeof window !== "undefined" && localStorage.getItem("swiftlink_demo_login") === "true";

      if (!isSupabaseConfigured()) {
        setIsSupabaseActive(false);
        if (isDemo) {
          // Demo mode: generic placeholder, never an admin
          setUser({ id: "demo-user-id", email: "demo@swiftlink.local" } as any);
          setIsAdmin(false);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setAuthReady(true);
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setIsSupabaseActive(true);
          void checkAdminStatus(session.user.id);
          void loadThemeFromDB(session.user.id);
        } else if (isDemo) {
          setUser({ id: "demo-user-id", email: "demo@swiftlink.local" } as any);
          setIsAdmin(false);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (e) {
        if (isDemo) {
          setUser({ id: "demo-user-id", email: "demo@swiftlink.local" } as any);
          setIsAdmin(false);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
      setAuthReady(true);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const isDemoActive = typeof window !== "undefined" && localStorage.getItem("swiftlink_demo_login") === "true";
        const u = session?.user ?? (isDemoActive ? { id: "demo-user-id", email: "demo@swiftlink.local" } as any : null);
        setUser(u);
        userRef.current = u;

        if (u) {
            setIsSupabaseActive(true);
            void checkAdminStatus(u.id);
            void loadThemeFromDB(u.id);

            void fetchStores(u.id).then((storesList) => {
                if (isOwnerRef.current) {
                    if (storesList && storesList.length > 0) {
                        // Plan comes from DB via fetchStores — no hardcoded override
                        const nextState = normalizeShopState(storesList[0]);
                        setState(nextState);
                        localStorage.setItem("swiftlink_state", JSON.stringify(nextState));
                    } else {
                        const nextState = normalizeShopState({ id: u.id, ownerId: u.id, plan: 'free' });
                        setState(nextState);
                    }
                }
            });
        } else {
            // Never reset the workspace while viewing a customer storefront: the
            // storefront's own state is loaded above and must not be clobbered
            // by a signed-out auth event (canonical `/<handle>` route).
            if (isOwnerRef.current) setState(defaultShopState());
            setIsAdmin(false);
            if (typeof window !== "undefined") {
              localStorage.removeItem("swiftlink_state");
            }
        }
      });
      unsub = subscription;
    };

    void initAuth();

    // Listen for shop changes if viewing a customer shop
    const directId = shopQ || (pathShop?.kind === "uid" ? pathShop.shopId : null);
    const slugPath = pathShop?.kind === "slug" ? pathShop.slug : null;
    let channel: any = null;

    if ((directId || slugPath) && isSupabaseConfigured()) {
       const applyStoreState = (sid: string, raw: any) => {
         if (raw) {
           setState(prev => normalizeShopState({ ...prev, ...(raw as Partial<ShopState>), id: sid }));
         }
       };

       const openStoreChannel = (sid: string) => {
         channel = supabase
           .channel('store-updates')
           .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${sid}` }, payload => {
              applyStoreState(sid, payload.new?.state_json);
           })
           .subscribe();
       };

       if (directId) {
         supabase.from('stores').select('state_json').eq('id', directId).single().then(({ data }) => {
             applyStoreState(directId, data?.state_json);
         });
         openStoreChannel(directId);
       } else if (slugPath) {
         // Canonical `/<handle>`: resolve the handle to its id first. The order
         // flow reads phone/products from the context state, so without this the
         // WhatsApp order would be built from the wrong store.
         supabase
           .from('stores')
           .select('id, state_json')
           .eq('store_username', slugPath)
           .maybeSingle()
           .then(({ data }) => {
             if (!data?.id) return;
             applyStoreState(data.id, data.state_json);
             openStoreChannel(data.id);
           });
       }
    }

    return () => {
      unsub?.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [pathname, shopQ]);

  useEffect(() => {
    const isDemoMode = typeof window !== "undefined" && localStorage.getItem("swiftlink_demo_login") === "true";
    if (!authReady) return;
    if (isProtectedRoute && !user && !isDemoMode) {
      router.replace("/signup?mode=login");
    }
  }, [authReady, isProtectedRoute, router, user]);

  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/pro" || !isSupabaseActive) return;
    
    // Don't redirect while we are still verifying the session
    if (!userRef.current && loadingOverlay) return;

    // If no business name is set and it's not a temporary session, 
    // we consider them a "new user" who should see the landing page first.
    const saved = localStorage.getItem("swiftlink_state");
    const hasBizLocal = state.bizName;
    const hasBizSaved = saved ? (JSON.parse(saved) as ShopState).bizName : false;
    
    if (!hasBizLocal && !hasBizSaved && !localStorage.getItem("swiftlink_tour_done")) {
      // Small check: if we are logged in, maybe wait a bit for the Supabase data to sync
      const t = setTimeout(() => {
         if (!stateRef.current.bizName) router.push("/signup");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [pathname, router, isSupabaseActive, state.bizName, loadingOverlay]);

  useEffect(() => {
    if (!isOwner || pathname !== "/pro" || typeof window === "undefined") return;
    if (!localStorage.getItem("swiftlink_tour_done")) {
      const t = setTimeout(() => {
        setCurrentTourStep(0);
        setTourOpen(true);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [isOwner, pathname]);

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const src = r.result as string;
        const img = new window.Image();
        img.src = src;
        img.onload = () => {
          const cvs = document.createElement("canvas");
          const ctx = cvs.getContext("2d");
          if (!ctx) return reject("No canvas context");
          cvs.width = 500;
          cvs.height = 500;
          ctx.drawImage(img, 0, 0, 500, 500);
          resolve(cvs.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = () => reject("Image load error");
      };
      r.onerror = () => reject("FileReader error");
      r.readAsDataURL(file);
    });
  };

  const sleep = (ms: number) =>
    new Promise<void>((r) => {
      setTimeout(r, ms);
    });

  const typeEffectOnInput = async (
    el: HTMLInputElement | HTMLTextAreaElement | null,
    text: string,
  ) => {
    if (!el) return;
    el.value = "";
    for (let i = 0; i < text.length; i++) {
      el.value += text[i];
      el.dispatchEvent(new Event("input", { bubbles: true }));
      // eslint-disable-next-line no-await-in-loop
      await sleep(50);
    }
    await sleep(500);
  };

  const moveHandTo = async (el: Element | null) => {
    if (!el || typeof window === "undefined") return;
    setHandHidden(false);
    const rect = el.getBoundingClientRect();
    setHandStyle({
      top: rect.top + rect.height / 2,
      left: rect.left + rect.width / 2,
    });
    await sleep(800);
  };

  const simulateClick = async (el: HTMLElement | null) => {
    if (!el) return;
    setHandClick(true);
    await sleep(200);
    setHandClick(false);
    el.click();
    await sleep(500);
  };

  const tourHelpersRef = useRef({
    sleep,
    typeEffectOnInput,
    moveHandTo,
    simulateClick,
  });
  tourHelpersRef.current = {
    sleep,
    typeEffectOnInput,
    moveHandTo,
    simulateClick,
  };

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        title: "Welcome",
        desc: "SwiftLink Pro is your Command Center. We'll show you how it works.",
        view: "launcher",
        action: async () => {
          setHandHidden(true);
        },
      },
      {
        title: "1. Business identity",
        desc: "First, give your store a name and a WhatsApp number.",
        view: "business",
        action: async () => {
          const h = tourHelpersRef.current;
          await h.sleep(300);
          const name = document.getElementById(
            "biz-name",
          ) as HTMLInputElement | null;
          const phone = document.getElementById(
            "biz-phone",
          ) as HTMLInputElement | null;
          await h.moveHandTo(name);
          await h.typeEffectOnInput(name, "Elite Fashion");
          await h.moveHandTo(phone);
          await h.typeEffectOnInput(phone, "2348085741430");
        },
      },
      {
        title: "2. Add products",
        desc: "Add items to your inventory so customers can shop.",
        view: "business",
        action: async () => {
          const h = tourHelpersRef.current;
          const addBtn = document.querySelector(
            "[data-tour-add-product]",
          ) as HTMLButtonElement | null;
          await h.moveHandTo(addBtn);
          await h.simulateClick(addBtn);
          await h.sleep(200);
          const lp = stateRef.current.products[0];
          if (!lp) return;
          const pName = document.querySelector(
            `[data-product-name="${lp.id}"]`,
          ) as HTMLInputElement | null;
          const pPrice = document.querySelector(
            `[data-product-price="${lp.id}"]`,
          ) as HTMLInputElement | null;
          await h.moveHandTo(pName);
          await h.typeEffectOnInput(pName, "Vintage Shirt");
          await h.moveHandTo(pPrice);
          await h.typeEffectOnInput(pPrice, "15000");
        },
      },
      {
        title: "3. Share store link",
        desc: "Tap the link icon to copy your shop link. Click it now!",
        view: "business",
        action: async () => {
          const h = tourHelpersRef.current;
          const btn = document.querySelector(
            "[data-tour-copy-shop]",
          ) as HTMLElement | null;
          await h.moveHandTo(btn);
        },
      },
      {
        title: "All set",
        desc: "You're ready to build and share your storefront.",
        view: "launcher",
        action: async () => {
          setHandHidden(true);
        },
      },
    ],
    [],
  );

  useEffect(() => {
    if (!tourOpen) return;
    let cancelled = false;
    (async () => {
      setIsSimulating(true);
      const step = tourSteps[currentTourStep];
      if (!step) {
        setIsSimulating(false);
        return;
      }
      navigateTo(step.view);
      await tourHelpersRef.current.sleep(400);
      if (cancelled) return;
      if (step.action) await step.action();
      if (!cancelled) setIsSimulating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tourOpen, currentTourStep, navigateTo, tourSteps]);

  const startTour = useCallback(() => {
    setCurrentTourStep(0);
    setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    setHandHidden(true);
    localStorage.setItem("swiftlink_tour_done", "true");
    router.push("/pro");
  }, [router]);

  const nextTourStep = useCallback(() => {
    if (isSimulating) return;
    setCurrentTourStep((s) => {
      const n = s + 1;
      if (n >= tourSteps.length) {
        setTourOpen(false);
        setHandHidden(true);
        localStorage.setItem("swiftlink_tour_done", "true");
        router.push("/pro");
        return s;
      }
      return n;
    });
  }, [isSimulating, tourSteps.length, router]);

  const prevTourStep = useCallback(() => {
    if (isSimulating || currentTourStep === 0) return;
    setCurrentTourStep((s) => Math.max(0, s - 1));
  }, [isSimulating, currentTourStep]);

  const copyShopLinkInternal = useCallback(() => {
    if (!state.id) {
      addToast("Store ID not ready yet. Try again.", "error");
      return;
    }
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${getShopPath(state)}`
        : "";
    void navigator.clipboard.writeText(url);
    addToast("Shop Link Copied to Clipboard!");
  }, [state, addToast]);

  const copyShopLink = useCallback(() => {
    copyShopLinkInternal();
    if (tourOpen && currentTourStep === 3) nextTourStep();
  }, [copyShopLinkInternal, tourOpen, currentTourStep, nextTourStep]);

  const handleSignOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("swiftlink_demo_login");
      localStorage.removeItem("swiftlink_state");
    }
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setState(defaultShopState());
    addToast("Signed out successfully", "info");
    router.push("/signup?mode=login");
  }, [addToast, router]);

  const authSignOut = useCallback(async () => {
    await handleSignOut();
  }, [handleSignOut]);

  const addProduct = useCallback(() => {
    setState((prev) => {
      if (visibleProductCount(prev.products) >= effectiveProductLimitFor(prev.plan)) {
        addToast(productLimitBlockedMessage(prev.plan), "error");
        return prev;
      }

      const next = {
        ...prev,
        products: [
          {
            id: Date.now(),
            name: "New Product",
            price: 0,
            description: "",
            image: "",
            images: [],
            outOfStock: false,
          },
          ...prev.products,
        ],
      };
      persistState(next);
      return next;
    });
  }, [persistState, addToast]);

  const updateProduct = useCallback(
    (id: number, field: string, value: unknown) => {
      setState((prev) => {
        const products = prev.products.map((p) =>
          p.id === id ? { ...p, [field]: value } : p,
        );
        const next = { ...prev, products };
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  const removeProduct = useCallback(
    async (id: number) => {
      const ok = await (window as any).customConfirm("Delete Item?", "Are you sure you want to remove this product?");
      if (!ok) return;
      setState((prev) => {
        const next = {
          ...prev,
          products: prev.products.filter((p) => p.id !== id),
        };
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  const handleImageUpload = useCallback(
    async (file: File | undefined, field: "bizImage" | "heroImage" | "image", productId?: number) => {
      if (!file) return;
      if (!userRef.current) {
        addToast("Connecting… please wait a moment and try again.", "error");
        return;
      }

      setIsSyncing(true);
      const folder = userRef.current.id;
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const path = productId != null 
        ? `${folder}/products/${productId}/${fileName}`
        : `${folder}/branding/${fileName}`;
      
      const { data, error } = await supabase.storage.from('branding').upload(path, file);

      if (error) {
          console.error("Storage Upload Error:", error);
          setIsSyncing(false);
          addToast(`Upload failed: ${error.message}`, "error");
          return;
      }

      const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);

      setState((prev) => {
          let next = { ...prev };
          if (productId != null) {
            const products = prev.products.map((p) => {
              if (p.id === productId) {
                const newImages = p.images?.length ? [...p.images] : (p.image ? [p.image] : []);
                if (newImages.length === 0) newImages.push(publicUrl);
                else newImages[0] = publicUrl; 
                return { ...p, image: publicUrl, images: newImages };
              }
              return p;
            });
            next = { ...next, products };
          } else {
            next = { ...next, [field]: publicUrl };
          }
          persistState(next);
          return next;
      });
      setIsSyncing(false);
    },
    [persistState, addToast],
  );

  const addProductImage = useCallback(
    async (productId: number, file: File) => {
      if (!userRef.current) return;

      setIsSyncing(true);
      const folder = userRef.current.id;
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const path = `${folder}/products/${productId}/${fileName}`;
      
      const { data, error } = await supabase.storage.from('branding').upload(path, file);

      if (error) {
          console.error(error);
          setIsSyncing(false);
          return;
      }

      const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);

      setState((prev) => {
          const products = prev.products.map((p) => {
            if (p.id === productId) {
              const currentImgs = p.images || (p.image ? [p.image] : []);
              const nextImgs = [...currentImgs, publicUrl];
              return { ...p, images: nextImgs, image: nextImgs[0] };
            }
            return p;
          });
          const next = { ...prev, products };
          persistState(next);
          return next;
      });
      setIsSyncing(false);
    },
    [persistState]
  );

  const emailSignIn = useCallback(async (email: string, pass: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
  }, []);

  const emailSignUp = useCallback(async (email: string, pass: string) => {
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
  }, []);

  const removeProductImage = useCallback(
    (productId: number, index: number) => {
      setState((prev) => {
        const products = prev.products.map((p) => {
          if (p.id === productId) {
            const nextImgs = [...(p.images || [])];
            nextImgs.splice(index, 1);
            return {
              ...p,
              images: nextImgs,
              image: nextImgs.length > 0 ? nextImgs[0] : "",
            };
          }
          return p;
        });
        const next = { ...prev, products };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const setPrimaryImage = useCallback(
    (productId: number, index: number) => {
      setState((prev) => {
        const products = prev.products.map((p) => {
          if (p.id === productId) {
            const imgs = p.images || [];
            if (index < 0 || index >= imgs.length) return p;
            const nextImgs = [...imgs];
            const [selected] = nextImgs.splice(index, 1);
            nextImgs.unshift(selected); // Put it at the beginning
            return { ...p, images: nextImgs, image: selected };
          }
          return p;
        });
        const next = { ...prev, products };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const updateCart = useCallback(
    (id: number, delta: number) => {
      setCart((prev) => {
        const cur = prev[id] || 0;
        const res = cur + delta;
        const next = { ...prev };
        if (res <= 0) delete next[id];
        else next[id] = res;
        return next;
      });
    },
    [],
  );

  const toggleCartDrawer = useCallback((open: boolean) => {
    setCartOpen(open);
  }, []);

  const sendWhatsAppOrder = useCallback(() => {
    if (Object.keys(cart).length === 0) {
      addToast("Your cart is empty.", "error");
      return;
    }
    // Strip everything except digits
    let phone = state.phone.replace(/\D/g, "");
    
    // If it starts with 0 and is likely a local number, we have a problem because we don't know the country.
    // However, if the user used our CountrySelector, the state.phone already has +234 etc.
    // If state.phone was "+234 808...", digits is "234808...".
    // If state.phone was "0808..." and they are in Nigeria, they need 234.
    
    if (!phone) {
      addToast("This store has no WhatsApp number configured yet.", "error");
      return;
    }

    if (state.isLive === false) {
      addToast("This store is not accepting orders right now.", "error");
      return;
    }
    const ref = "SL-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const lines: CartOrderLine[] = [];
    const intents: OrderIntentItem[] = [];
    Object.entries(cart).forEach(([id, q]) => {
      const p = state.products.find((x) => x.id === Number(id));
      if (!p) return;
      lines.push({
        productId: p.id,
        name: p.name,
        quantity: q,
        unitPrice: p.price,
        // `image` is the thumbnail and is kept in sync with the first gallery
        // image; fall back to the gallery for older products. The message sends
        // the photo as a URL, which is the only way a click-to-chat link can
        // carry a picture — WhatsApp previews the first one it finds.
        imageUrl: p.image || p.images?.[0] || null,
      });
      intents.push({
        productId: p.id,
        productName: p.name,
        unitPriceMinor: toMinorUnits(p.price),
        quantity: q,
      });
    });

    const msg = buildCartOrderMessage({
      reference: ref,
      currency: state.currency,
      storeName: state.bizName,
      lines,
    });

    // Open the chat first and synchronously: `window.open` inside a click
    // handler is what keeps popup blockers from eating the order.
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
    );

    // Then record the intent, deliberately not awaited — the inquiries screen
    // and the daily stats rollup are fed from here, and a tracking failure must
    // never interfere with the sale that just happened
    // (docs/05-IMPROVEMENT-PLAN.md R-05/R-06).
    void recordOrderIntent({
      storeId: state.id,
      currency: state.currency,
      srcParam: inquirySrc,
      items: intents,
    });
  }, [cart, state, addToast, inquirySrc]);

  const cartItemCount = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart],
  );

  useEffect(() => {
    if (cartItemCount === 0) setCartOpen(false);
  }, [cartItemCount]);

  const value: SwiftLinkContextValue = {
    state,
    stores,
    switchStore,
    createNewStore,
    transferStore,
    cart,
    user,
    isAdmin,
    isSupabaseActive,
    isOwner,
    tourOpen,
    currentTourStep,
    isSimulating,
    handHidden,
    handStyle,
    handClick,
    loadingOverlay,
    cartOpen,
    navigateTo,
    startTour,
    nextTourStep,
    prevTourStep,
    closeTour,
    updateState,
    setStateMerge,
    saveFullState,
    drafts,
    saveDraft,
    discardDraft,
    copyShopLink,
    handleSignOut,
    authSignOut,
    emailSignIn,
    emailSignUp,
    addProduct,
    updateProduct,
    removeProduct,
    handleImageUpload,
    updateCart,
    toggleCartDrawer,
    sendWhatsAppOrder,
    cartItemCount,
    addProductImage,
    removeProductImage,
    setPrimaryImage,
    isSyncing,
    toasts,
    theme,
    toggleTheme,
    addToast,
    removeToast,
    addSystemNotification,
    feedbackOpen,
    setFeedbackOpen,
    socialHubOpen,
    setSocialHubOpen,
    submitFeedback,
    logEvent,
  };

  return (
    <SwiftLinkContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </SwiftLinkContext.Provider>
  );
}

export function useSwiftLink() {
  const ctx = useContext(SwiftLinkContext);
  if (!ctx) throw new Error("useSwiftLink must be used within SwiftLinkProvider");
  return ctx;
}
