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
import { defaultShopState, loadStateLocal, type Delivery, type ShopState, type AppNotification } from "@/lib/types";
import { type ToastType, ToastContainer } from "@/components/CustomToast";

type CartMap = Record<number, number>;

type TourStepView = "launcher" | "business" | "dispatch";

type TourStep = {
  title: string;
  desc: string;
  view: TourStepView;
  action?: () => Promise<void>;
};

type SwiftLinkContextValue = {
  state: ShopState;
  cart: CartMap;
  user: User | null;
  isSupabaseActive: boolean;
  isOwner: boolean;
  currentTrackId: string | null;
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
  handleDispatchSubmit: (form: {
    sender: string;
    name: string;
    phone: string;
    item: string;
    driver: string;
    ref: string;
  }) => void;
  removeDelivery: (id: string) => void;
  copyTrackLink: (id: string) => void;
  initTracking: (id: string) => void;
  confirmDelivery: () => void;
  copyShopLink: () => void;
  copyTrackingPortalLink: () => void;
  handleSignOut: () => void;
  authSignOut: () => Promise<void>;
  emailSignIn: (e: string, p: string) => Promise<void>;
  emailSignUp: (e: string, p: string) => Promise<void>;
  addProduct: () => void;
  updateProduct: (id: number, field: string, value: unknown) => void;
  removeProduct: (id: number) => void;
  handleImageUpload: (
    file: File | undefined,
    field: "bizImage" | "image",
    productId?: number,
  ) => void;
  addProductImage: (productId: number, file: File) => void;
  removeProductImage: (productId: number, index: number) => void;
  setPrimaryImage: (productId: number, index: number) => void;
  updateCart: (id: number, delta: number) => void;
  toggleCartDrawer: (open: boolean) => void;
  sendWhatsAppOrder: () => void;
  renderDeliveryCount: () => number;
  trackingDisplay: Delivery | null;
  cartItemCount: number;
  currentLocation: { lat: number; lng: number } | null;
  startLocationTracking: () => void;
  isSyncing: boolean;
  toasts: any[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  addToast: (msg: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  addSystemNotification: (title: string, message: string, type?: "order" | "message" | "trend") => void;
};

const SwiftLinkContext = createContext<SwiftLinkContextValue | null>(null);

// EMAILS THAT GET PRO AUTOMATICALLY
const GOD_MODE_EMAILS = [
  "michaeldosunmu22@gmail.com", // You
  "dosunmumichael26@gmail.com", // Your other email
];

export function SwiftLinkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<ShopState>(defaultShopState);
  const [cart, setCart] = useState<CartMap>({});
  const [user, setUser] = useState<User | null>(null);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
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
  const [trackingDisplay, setTrackingDisplay] = useState<Delivery | null>(
    null,
  );
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("swiftlink_theme") as "light" | "dark";
    if (saved) {
      setTheme(saved);
      if (saved === "dark") document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("swiftlink_theme", next);
      if (next === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return next;
    });
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isOwnerRef = useRef(true);
  const userRef = useRef<User | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackId = searchParams.get("track");
  const shopFromQuery = searchParams.get("shop");
  const pathShop = parseShopFromPathname(pathname);
  const trackQ = trackId;
  const shopQ = shopFromQuery;

  const isTrackingMode = Boolean(trackId);
  const pathShopId = pathShop?.kind === "uid" ? pathShop.shopId : null;
  const customerShopId = shopFromQuery || pathShopId || null;
  const isCustomerMode = Boolean(customerShopId);
  const isOwner = !isTrackingMode && !isCustomerMode;

  isOwnerRef.current = isOwner;
  userRef.current = user;

  const navigateTo = useCallback(
    (view: TourStepView) => {
      if (view === "launcher") router.push("/pro");
      if (view === "dispatch") router.push("/dispatch");
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
            setIsSyncing(false);
            return;
          }
          if (isOwnerRef.current && userRef.current?.id) {
            const uid = userRef.current.id;
            
            // Ensure the ID is part of the state we save
            const stateToSave = { ...next, id: uid };
            
            const { error } = await supabase
              .from('stores')
              .upsert({
                id: uid,
                biz_name: next.bizName,
                store_username: next.storeUsername,
                phone: next.phone,
                state_json: stateToSave,
                updated_at: new Date().toISOString()
              });

            if (error) {
              console.error("Supabase Sync Error:", error);
            } else {
                const slug = getPublicStoreSlug({
                  storeUsername: next.storeUsername,
                  bizName: next.bizName,
                });
                if (slug) {
                  await supabase.from('slugs').upsert({
                    slug,
                    shop_id: uid,
                    updated_at: new Date().toISOString()
                  });
                }
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

  const addSystemNotification = useCallback((title: string, message: string, type: "order" | "message" | "trend" = "message") => {
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

  useEffect(() => {
    const t = setTimeout(() => setLoadingOverlay(false), 2000);
    
    // STRICT PRODUCTION LOGIC: 
    // We do NOT call setState(loadStateLocal()) immediately.
    // Instead, we wait for the session check in initAuth() or handle it here.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setState(loadStateLocal());
      } else {
        setState(defaultShopState());
      }
    });

    if (isSupabaseConfigured()) {
      setIsSupabaseActive(true);
    }
    
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isCustomerMode && customerShopId && !isTrackingMode) {
      setState((prev) => ({ ...prev, id: customerShopId }));
    }
  }, [isCustomerMode, customerShopId, isTrackingMode]);

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      if (!isSupabaseConfigured()) {
        setIsSupabaseActive(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setIsSupabaseActive(true);
      }

                  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {

                    const u = session?.user ?? null;

                    setUser(u);

                    userRef.current = u;

                    

                    if (u) {

                        setIsSupabaseActive(true);

                        const isGodMode = u.email && GOD_MODE_EMAILS.includes(u.email);

                        

                        if (isOwnerRef.current) {

                            supabase.from('stores').select('state_json').eq('id', u.id).single().then(({ data }) => {

                                // If no data, use default but FORCE the ID to be the user's UID

                                let nextState = data?.state_json ? (data.state_json as ShopState) : defaultShopState();

                                

                                // CRITICAL: Always ensure the state ID matches the authenticated user ID

                                nextState = { ...nextState, id: u.id };

                                

                                if (isGodMode) {

                                    nextState = { ...nextState, plan: "pro" };

                                }

                                

                                setState(nextState);

                                // Sync back to local storage immediately

                                localStorage.setItem("swiftlink_state", JSON.stringify(nextState));

                            });

                        }

                    } else {

            
            // If no user, reset state to default to avoid showing old local data
            setState(defaultShopState());
            if (typeof window !== "undefined") {
              localStorage.removeItem("swiftlink_state");
            }
        }
      });
      unsub = subscription;
    };

    void initAuth();

    // Listen for shop changes if viewing a customer shop
    const sid = shopQ || (pathShop?.kind === "uid" ? pathShop.shopId : null);
    let channel: any = null;

    if (sid && isSupabaseConfigured()) {
       supabase.from('stores').select('state_json').eq('id', sid).single().then(({ data }) => {
           if (data?.state_json) {
               setState(prev => ({ ...prev, ...(data.state_json as ShopState), id: sid }));
           }
       });

       channel = supabase
         .channel('store-updates')
         .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${sid}` }, payload => {
            if (payload.new?.state_json) {
                setState(prev => ({ ...prev, ...(payload.new.state_json as ShopState), id: sid }));
            }
         })
         .subscribe();
    }

    return () => {
      unsub?.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [pathname, trackQ, shopQ]);

  useEffect(() => {
    if (!trackId) return;
    setCurrentTrackId(trackId);
    const d = state.deliveries.find((x) => x.id === trackId) ?? null;
    setTrackingDisplay(d);
  }, [trackId, state.deliveries]);

  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/pro") return;
    
    // If no business name is set and it's not a temporary session, 
    // we consider them a "new user" who should see the landing page first.
    const saved = localStorage.getItem("swiftlink_state");
    const hasBiz = saved ? (JSON.parse(saved) as ShopState).bizName : false;
    
    if (!hasBiz && !localStorage.getItem("swiftlink_tour_done")) {
      router.push("/signup");
    }
  }, [pathname, router]);

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
        title: "4. Create a dispatch",
        desc: "Sold something? Fill the dispatch form instantly.",
        view: "dispatch",
        action: async () => {
          const h = tourHelpersRef.current;
          const cN = document.getElementById(
            "disp-name",
          ) as HTMLInputElement | null;
          const cP = document.getElementById(
            "disp-phone",
          ) as HTMLInputElement | null;
          const log = document.getElementById(
            "disp-driver",
          ) as HTMLInputElement | null;
          const refEl = document.getElementById(
            "disp-ref",
          ) as HTMLInputElement | null;
          await h.moveHandTo(cN);
          await h.typeEffectOnInput(cN, "Customer Name");
          await h.moveHandTo(cP);
          await h.typeEffectOnInput(cP, "08000000000");
          await h.moveHandTo(log);
          await h.typeEffectOnInput(log, "Dispatch Company");
          await h.moveHandTo(refEl);
          await h.typeEffectOnInput(refEl, "REF-0001");
          const submit = document.querySelector(
            "[data-dispatch-submit]",
          ) as HTMLElement | null;
          await h.moveHandTo(submit);
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

  const copyTrackingPortalLink = useCallback(() => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/` : "";
    void navigator.clipboard.writeText(url);
    addToast("Portal Link Copied!");
  }, [addToast]);

  const copyTrackLink = useCallback((id: string) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/?track=${id}`
        : "";
    void navigator.clipboard.writeText(url);
    addToast("Tracking Link Copied!");
  }, [addToast]);

  const handleSignOut = useCallback(async () => {
    const ok = await (window as any).customConfirm("Reset system?", "All local data will be lost.");
    if (ok) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const authSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    addToast("Signed out.", "success");
    router.push("/signup?mode=login");
  }, [addToast, router]);

  const handleDispatchSubmit = useCallback(
    (form: {
      sender: string;
      name: string;
      phone: string;
      item: string;
      driver: string;
      ref: string;
    }) => {
      const { sender, name, phone, item, driver, ref } = form;
      if (!name || !driver || !ref) {
        addToast("Please fill the required fields.", "error");
        return;
      }

      const deliveryId =
        "TRK-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const newDel: Delivery = {
        id: deliveryId,
        status: "dispatched",
        customer: name,
        phone,
        item,
        driver,
        ref,
      };

      // 1. Insert into dedicated tracking table for live updates
      void (async () => {
        if (isSupabaseConfigured() && user?.id) {
           await supabase.from('dispatch_tracking').insert({
              tracking_code: deliveryId,
              store_id: user.id,
              driver_name: driver,
              customer_name: name,
              destination: "", // can be expanded
              status: 'pending'
           });
        }
      })();

      const trackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/?track=${deliveryId}`
          : "";
      const driverUrl = 
        typeof window !== "undefined"
          ? `${window.location.origin}/dispatch/driver/${deliveryId}`
          : "";
      
      const msg = `Package dispatched! Track here: ${trackUrl}`;

      setState((prev) => {
        let next = { ...prev };
        if (sender && !prev.bizName) next = { ...next, bizName: sender };
        next = { ...next, deliveries: [newDel, ...next.deliveries] };
        persistState(next);
        return next;
      });

      void (async () => {
        const choice = await (window as any).customConfirm(
          "Dispatch created",
          "Send tracking link to Customer OR Driver?",
          "Customer (WA)",
          "Driver Link"
        );
        
        if (choice === true) { // Customer
          const wa = phone.replace(/\D/g, "");
          if (!wa) {
            addToast("No customer phone number provided.", "error");
            return;
          }
          window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`);
        } else if (choice === false) { // Driver
          void navigator.clipboard.writeText(driverUrl);
          addToast("Driver tracking link copied!");
        }
      })();
    },
    [addToast, persistState],
  );

  const removeDelivery = useCallback(async (id: string) => {
    const ok = await (window as any).customConfirm("Delete record?", "Are you sure you want to remove this delivery?");
    if (!ok) return;
    setState((prev) => {
      const next = {
        ...prev,
        deliveries: prev.deliveries.filter((d) => d.id !== id),
      };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const initTracking = useCallback(
    (id: string) => {
      setCurrentTrackId(id);
      const d = state.deliveries.find((x) => x.id === id) ?? null;
      setTrackingDisplay(d);
    },
    [state.deliveries],
  );

  const confirmDelivery = useCallback(async () => {
    const ok = await (window as any).customConfirm(
      "Confirm receipt?",
      "This will mark the delivery as delivered.",
    );
    if (!ok) return;
    const tid = currentTrackId;
    if (!tid) return;
    setState((prev) => {
      const deliveries = prev.deliveries.map((d) =>
        d.id === tid ? { ...d, status: "delivered" as const } : d,
      );
      const next = { ...prev, deliveries };
      persistState(next);
      const d = next.deliveries.find((x) => x.id === tid) ?? null;
      setTrackingDisplay(d);
      addToast("Delivery Confirmed. Thank you!", "success");
      return next;
    });
  }, [currentTrackId, addToast, persistState]);

  const addProduct = useCallback(() => {
    setState((prev) => {
      const next = {
        ...prev,
        products: [
          {
            id: Date.now(),
            name: "Product",
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
  }, [persistState]);

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
    async (file: File | undefined, field: "bizImage" | "image", productId?: number) => {
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
            next = { ...next, bizImage: publicUrl };
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

  const startLocationTracking = useCallback(() => {
      if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.watchPosition((pos) => {
              setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }, (err) => console.warn("Geo error:", err), { enableHighAccuracy: true });
      }
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
    const phone = state.phone.replace(/\D/g, "");
    if (!phone) {
      addToast("This store has no WhatsApp number configured yet.", "error");
      return;
    }
    if (state.isLive === false) {
      addToast("This store is not accepting orders right now.", "error");
      return;
    }
    const ref = "SL-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    let msg = `*NEW ORDER ${ref}*\n━━━━━━━━━━\n\n`;
    let total = 0;
    Object.entries(cart).forEach(([id, q]) => {
      const p = state.products.find((x) => x.id === Number(id));
      if (!p) return;
      total += p.price * q;
      msg += `📦 *${p.name}* (${q})\n   ${state.currency}${Number(p.price * q).toLocaleString()}\n\n`;
    });
    const totalStr = `${state.currency}${total.toLocaleString()}`;
    msg += `━━━━━━━━━━\n💰 *Total: ${totalStr}*\n\n_Store: ${state.bizName}_`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
    );
  }, [cart, state, addToast]);

  const renderDeliveryCount = useCallback(() => {
    return state.deliveries.filter((d) => d.status === "dispatched").length;
  }, [state.deliveries]);

  const cartItemCount = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart],
  );

  useEffect(() => {
    if (cartItemCount === 0) setCartOpen(false);
  }, [cartItemCount]);

  const value: SwiftLinkContextValue = {
    state,
    cart,
    user,
    isSupabaseActive,
    isOwner,
    currentTrackId,
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
    handleDispatchSubmit,
    removeDelivery,
    copyTrackLink,
    initTracking,
    confirmDelivery,
    copyShopLink,
    copyTrackingPortalLink,
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
    renderDeliveryCount,
    trackingDisplay,
    cartItemCount,
    addProductImage,
    removeProductImage,
    setPrimaryImage,
    currentLocation,
    startLocationTracking,
    isSyncing,
    toasts,
    theme,
    toggleTheme,
    addToast,
    removeToast,
    addSystemNotification,
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
