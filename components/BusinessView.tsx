"use client";

import { useRouter } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import {
  collectProductCategories,
  getPublicStoreSlug,
  getShopPath,
  normalizeStoreUsername,
} from "@/lib/utils";

export function BusinessView() {
  const router = useRouter();
  const {
    state,
    updateState,
    copyShopLink,
    addProduct,
    updateProduct,
    removeProduct,
    handleImageUpload,
  } = useSwiftLink();

  const initials = state.bizName
    ? state.bizName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
    : "SL";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Go back"
        >
          <i className="fas fa-arrow-left" />
        </button>
        <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">
          Store Manager
        </span>
        <button
          type="button"
          data-tour-copy-shop
          onClick={copyShopLink}
          className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"
        >
          <i className="fas fa-link" />
        </button>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <label
              htmlFor="biz-img-upload"
              id="biz-img-preview"
              className="image-upload-label block w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto md:mx-0 overflow-hidden"
              style={
                state.bizImage
                  ? { backgroundImage: `url(${state.bizImage})` }
                  : undefined
              }
            >
              {!state.bizImage && (
                <i className="fas fa-camera text-slate-300" />
              )}
              <input
                type="file"
                id="biz-img-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleImageUpload(
                    e.target.files?.[0],
                    "bizImage",
                    undefined,
                  )
                }
              />
            </label>
            <input
              type="text"
              id="biz-name"
              value={state.bizName}
              onChange={(e) => updateState("bizName", e.target.value)}
              className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
              placeholder="Store Name"
            />
            <div>
              <label
                htmlFor="store-username"
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2"
              >
                Store URL handle
              </label>
              <input
                type="text"
                id="store-username"
                value={state.storeUsername ?? ""}
                onChange={(e) =>
                  updateState(
                    "storeUsername",
                    normalizeStoreUsername(e.target.value),
                  )
                }
                className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none lowercase placeholder:normal-case"
                placeholder="fashionbyada"
                autoComplete="off"
              />
              <p className="mt-2 text-xs text-slate-500 leading-relaxed break-all">
                <span className="font-bold text-slate-700">Public link:</span>{" "}
                {state.id ? getShopPath(state) : `/store/${getPublicStoreSlug(state) || "your-handle"}`}
              </p>
            </div>
            <input
              type="text"
              id="biz-phone"
              value={state.phone}
              onChange={(e) => updateState("phone", e.target.value)}
              className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
              placeholder="WhatsApp Phone"
            />
            <input
              type="text"
              id="biz-tagline"
              value={state.tagline}
              onChange={(e) => updateState("tagline", e.target.value)}
              className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
              placeholder="Hero Tagline"
            />
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
              <label
                htmlFor="featured-category"
                className="block text-[10px] font-bold uppercase tracking-widest text-emerald-800"
              >
                Featured collection (storefront)
              </label>
              <p className="text-[11px] text-emerald-900/70 leading-snug">
                Pick a category to pin above your catalog. Create categories by
                typing them on each product below.
              </p>
              <select
                id="featured-category"
                value={state.featuredCategory ?? ""}
                onChange={(e) =>
                  updateState("featuredCategory", e.target.value)
                }
                className="w-full bg-white rounded-xl p-3 font-bold text-sm text-slate-900 outline-none border border-emerald-100"
              >
                <option value="">None — no featured block</option>
                {collectProductCategories(state.products).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </section>
          <section className="space-y-6">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-2xl font-black text-slate-900">Inventory</h2>
              <button
                type="button"
                data-tour-add-product
                onClick={addProduct}
                className="btn-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg"
              >
                Add Item
              </button>
            </div>
            <div id="product-list" className="space-y-4">
              {state.products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative reveal"
                >
                  <button
                    type="button"
                    onClick={() => removeProduct(p.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                  >
                    <i className="fas fa-trash-can" />
                  </button>
                  <div className="flex gap-5">
                    <label
                      htmlFor={`prod-img-${p.id}`}
                      id={`prod-prev-${p.id}`}
                      className="image-upload-label w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed flex items-center justify-center overflow-hidden"
                      style={
                        p.image
                          ? { backgroundImage: `url(${p.image})` }
                          : undefined
                      }
                    >
                      {!p.image && (
                        <i className="fas fa-image text-slate-300" />
                      )}
                      <input
                        type="file"
                        id={`prod-img-${p.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(
                            e.target.files?.[0],
                            "image",
                            p.id,
                          )
                        }
                      />
                    </label>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase">
                          Name
                        </label>
                        <input
                          data-product-name={p.id}
                          value={p.name}
                          onChange={(e) =>
                            updateProduct(p.id, "name", e.target.value)
                          }
                          className="w-full font-bold text-base outline-none focus:text-emerald-600"
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase">
                          Price
                        </label>
                        <input
                          type="number"
                          data-product-price={p.id}
                          value={p.price}
                          onChange={(e) =>
                            updateProduct(
                              p.id,
                              "price",
                              Number(e.target.value),
                            )
                          }
                          className="w-24 bg-slate-50 rounded px-2 py-1 text-slate-900 outline-none"
                          placeholder="Price"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase">
                          Category
                        </label>
                        <input
                          type="text"
                          list={`biz-cat-suggest-${p.id}`}
                          value={p.category ?? ""}
                          onChange={(e) =>
                            updateProduct(p.id, "category", e.target.value)
                          }
                          className="w-full bg-slate-50 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-900 outline-none mt-0.5"
                          placeholder="e.g. Tops, Shoes, Phones"
                        />
                        <datalist id={`biz-cat-suggest-${p.id}`}>
                          {collectProductCategories(
                            state.products.filter((x) => x.id !== p.id),
                          ).map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={p.description}
                    onChange={(e) =>
                      updateProduct(p.id, "description", e.target.value)
                    }
                    className="w-full mt-4 bg-slate-50 rounded-2xl p-4 text-xs font-bold outline-none h-20"
                    placeholder="Description..."
                  />
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={p.outOfStock}
                          onChange={(e) =>
                            updateProduct(p.id, "outOfStock", e.target.checked)
                          }
                        />
                        <div className="w-10 h-6 bg-slate-200 rounded-full transition-all peer-checked:bg-red-500" />
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4" />
                      </div>
                      <span className="ml-3 text-[10px] font-black text-slate-400 uppercase">
                        Out of Stock
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="lg:col-span-5 hidden lg:block sticky top-28 h-fit">
          <div className="iphone-frame w-[340px] mx-auto h-[680px]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-2xl z-[60]" />
            <div
              id="preview-frame-content"
              className="h-full overflow-y-auto bg-white relative custom-scrollbar"
            >
              <div className="bg-white pb-20">
                <div className="h-32 bg-slate-900 relative">
                  <div
                    className="absolute inset-0 bg-center bg-cover opacity-40"
                    style={{
                      backgroundImage: state.bizImage
                        ? `url(${state.bizImage})`
                        : undefined,
                    }}
                  />
                  <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg overflow-hidden flex items-center justify-center border-2 border-slate-50">
                      {state.bizImage ? (
                        <div
                          className="w-full h-full bg-center bg-cover rounded-full"
                          style={{
                            backgroundImage: `url(${state.bizImage})`,
                          }}
                        />
                      ) : (
                        <span className="text-slate-400 font-black text-xl">
                          {initials}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-12 text-center px-4">
                  <h2 className="font-black text-lg text-slate-900">
                    {state.bizName || "My Store"}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {state.tagline}
                  </p>
                </div>
                <div className="p-4 space-y-3 mt-4">
                  {state.products.map((p) => (
                    <div
                      key={p.id}
                      className={`flex gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm ${p.outOfStock ? "opacity-40 grayscale" : ""}`}
                    >
                      <div
                        className="w-14 h-14 bg-slate-100 rounded-xl bg-center bg-cover"
                        style={{
                          backgroundImage: p.image
                            ? `url(${p.image})`
                            : undefined,
                        }}
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-black text-[11px] text-slate-900 truncate">
                          {p.name}
                        </h4>
                        {(p.category || "").trim() ? (
                          <span className="text-[8px] font-bold uppercase tracking-wide text-slate-400 truncate mt-0.5">
                            {(p.category || "").trim()}
                          </span>
                        ) : null}
                        <div className="font-black text-emerald-600 text-[11px] mt-0.5">
                          {state.currency}
                          {Number(p.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
