"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";

export function CartDrawer({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const {
    state,
    cart,
    sendWhatsAppOrder,
    cartItemCount,
  } = useSwiftLink();

  let total = 0;
  const lines = Object.entries(cart).map(([id, q]) => {
    const p = state.products.find((x) => x.id === Number(id));
    if (!p) return null;
    total += p.price * q;
    return (
      <div
        key={id}
        className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100"
      >
        <div>
          <h4 className="font-black text-sm text-slate-900">{p.name}</h4>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {q} x {state.currency}
            {Number(p.price).toLocaleString()}
          </div>
        </div>
        <div className="font-black text-lg text-emerald-600">
          {state.currency}
          {Number(p.price * q).toLocaleString()}
        </div>
      </div>
    );
  });

  return (
    <>
      <div
        id="floating-cart-btn"
        className={`fixed bottom-6 right-6 z-[60] ${cartItemCount === 0 ? "hidden" : ""}`}
      >
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="w-16 h-16 btn-primary text-white rounded-full shadow-2xl flex items-center justify-center relative hover:scale-110 active:scale-95 transition-all"
        >
          <i className="fas fa-shopping-bag text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
            {cartItemCount}
          </span>
        </button>
      </div>

      <button
        type="button"
        aria-label="Close cart overlay"
        onClick={() => onToggle(false)}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] ${open ? "" : "hidden"}`}
      />

      <div
        id="cart-drawer"
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[80] shadow-2xl max-w-md mx-auto max-h-[85vh] flex flex-col transition-transform duration-500 ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50">
          <h2 className="text-xl font-black">Your Bag</h2>
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"
          >
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="overflow-y-auto p-8 space-y-4 flex-1">
          {lines.filter(Boolean).length === 0 ? (
            <p className="text-center text-slate-400 font-bold">Your bag is empty.</p>
          ) : (
            lines
          )}
        </div>
        <div className="p-8 bg-slate-50 space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Total Amount</span>
            <span className="text-3xl text-slate-900">
              {state.currency}
              {total.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={sendWhatsAppOrder}
            className="w-full btn-primary text-white py-5 rounded-2xl font-black shadow-lg flex items-center justify-center space-x-3 active:scale-95 transition-all"
          >
            <i className="fab fa-whatsapp text-2xl" />
            <span>WhatsApp Order</span>
          </button>
        </div>
      </div>
    </>
  );
}
