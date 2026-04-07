"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";

export function CustomerStorefront() {
  const { state, cart, updateCart, toggleCartDrawer, cartItemCount } =
    useSwiftLink();

  const initials = state.bizName
    ? state.bizName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
    : "SL";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="customer-view">
      <div id="full-catalog-content" className="w-full flex-1">
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 md:h-20 flex items-center transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex justify-between items-center">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                    {state.bizImage ? (
                      <img
                        src={state.bizImage}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <span className="text-slate-400 font-black text-[10px] md:text-xs">
                        {initials}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-xl md:text-2xl text-slate-900 truncate max-w-[150px] md:max-w-none transition-colors hover:text-emerald-600 cursor-default">
                    {state.bizName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="relative cursor-pointer group"
                onClick={() => toggleCartDrawer(true)}
              >
                <i className="fas fa-shopping-bag text-xl md:text-2xl text-slate-700 transition-transform group-hover:scale-110" />
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white transform transition-all group-hover:scale-110">
                  {cartItemCount}
                </span>
              </button>
            </div>
          </nav>
          <header className="bg-white py-12 lg:py-32 border-b border-slate-100 relative overflow-hidden perspective-1000">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-10 text-center lg:text-left">
              <div className="animate-fade-in-up space-y-6 md:space-y-8">
                <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <i className="fas fa-bolt animate-pulse" />{" "}
                  <span>Live Catalog Powered by SwiftLink</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
                  {state.bizName}
                  <br />
                  <span className="text-emerald-500">{state.tagline}</span>
                </h1>
                <p className="text-base md:text-xl text-slate-500 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                  {state.aboutUs}
                </p>
                <div className="pt-4">
                  <a
                    href="#products"
                    className="btn-primary text-white px-10 py-5 rounded-3xl font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all inline-block"
                  >
                    Browse Selection
                  </a>
                </div>
              </div>
              <div className="flex justify-center items-center mt-8 lg:mt-0 perspective-1000">
                <div className="animate-float w-full max-w-[300px] md:max-w-[450px] aspect-square rounded-[3rem] bg-slate-50 shadow-2xl flex items-center justify-center overflow-hidden border border-slate-100 rotate-3 transform-style-3d">
                  {state.bizImage ? (
                    <img
                      src={state.bizImage}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-slate-200 font-black text-6xl md:text-[10rem] opacity-20">
                      {initials}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>
          <section
            id="products"
            className="py-12 md:py-24 bg-white flex-1"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-12 uppercase tracking-widest">
                Store Inventory
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12">
                {state.products.map((p, i) => (
                  <div
                    key={p.id}
                    className="group card-3d-hover bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-50">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt=""
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${p.outOfStock ? "grayscale opacity-40" : ""}`}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100" />
                      )}
                      {p.outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white/90 backdrop-blur-sm text-red-500 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                            Sold Out
                          </span>
                        </div>
                      )}
                      {!p.outOfStock && (
                        <button
                          type="button"
                          onClick={() => updateCart(p.id, 1)}
                          className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center transform translate-y-24 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-emerald-600"
                        >
                          <i className="fas fa-plus text-xl" />
                        </button>
                      )}
                    </div>
                    <div className="p-8 text-left">
                      <h3 className="font-black text-xl text-slate-900 mb-2 truncate group-hover:text-emerald-600 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-slate-400 text-xs font-bold mb-6 line-clamp-2 uppercase tracking-wide opacity-60">
                        {p.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-black text-slate-900">
                          {state.currency}
                          {Number(p.price).toLocaleString()}
                        </span>
                        {cart[p.id] ? (
                          <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-xs font-black animate-bounce">
                            {cart[p.id]} in cart
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <footer className="bg-slate-900 text-white py-16 px-6 text-center border-t border-white/5 mt-auto">
            <img
              src="/logo.svg"
              className="w-12 h-12 mx-auto mb-6"
              alt=""
              width={48}
              height={48}
            />
            <h3 className="text-2xl font-black tracking-tight mb-2">
              {state.bizName}
            </h3>
            <p className="text-slate-500 text-sm font-bold mb-8 opacity-60 uppercase tracking-widest">
              {state.tagline}
            </p>
            <div className="flex justify-center space-x-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <a
                href={`https://wa.me/${state.phone.replace(/\D/g, "")}`}
                className="hover:text-emerald-500 transition-colors"
              >
                WhatsApp
              </a>
              <span className="opacity-20">•</span>
              <span className="hover:text-white transition-colors cursor-default">
                Powered by SwiftLink Pro
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
