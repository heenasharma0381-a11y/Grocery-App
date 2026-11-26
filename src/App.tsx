import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Package,
  ChevronDown,
} from "lucide-react";
import { CATEGORIES, PRODUCTS, formatInr, type CategoryId, type Product } from "./data/catalog";

interface CartItem {
  productId: string;
  quantity: number;
}

interface DeliveryLocation {
  area: string;
  pincode: string;
}

interface ConfirmedOrder {
  orderId: string;
  location: DeliveryLocation;
  items: Array<{ product: Product; quantity: number }>;
  totalInr: number;
  placedAt: string;
}

const CART_STORAGE_KEY = "mygrocery_cart_v1";
const LOCATION_STORAGE_KEY = "mygrocery_location_v1";

function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item.productId === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

function loadStoredLocation(): DeliveryLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.area === "string" &&
      parsed.area.trim().length > 0 &&
      typeof parsed.pincode === "string"
    ) {
      return { area: parsed.area.trim(), pincode: parsed.pincode.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>(loadStoredCart);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(
    loadStoredLocation
  );

  const [cartOpen, setCartOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota issues
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (deliveryLocation) {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(deliveryLocation));
      }
    } catch {
      // Ignore storage quota issues
    }
  }, [deliveryLocation]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        setLocationModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesQuery =
        q.length === 0 ||
        product.name.toLowerCase().includes(q) ||
        product.categoryLabel.toLowerCase().includes(q) ||
        product.packSize.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const cartDetails = useMemo(() => {
    const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));
    const rows: Array<{ product: Product; quantity: number }> = [];
    let totalItems = 0;
    let totalInr = 0;

    for (const item of cart) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      rows.push({ product, quantity: item.quantity });
      totalItems += item.quantity;
      totalInr += product.priceInr * item.quantity;
    }

    return { rows, totalItems, totalInr };
  }, [cart]);

  function getQuantity(productId: string): number {
    return cart.find((c) => c.productId === productId)?.quantity ?? 0;
  }

  function addToCart(productId: string) {
    setConfirmedOrder(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) {
        return prev.map((c) =>
          c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setConfirmedOrder(null);
    setCart((prev) =>
      prev
        .map((c) =>
          c.productId === productId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setConfirmedOrder(null);
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  function openLocationModal() {
    setAreaInput(deliveryLocation?.area || "");
    setPincodeInput(deliveryLocation?.pincode || "");
    setLocationError(null);
    setLocationModalOpen(true);
  }

  function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault();
    const area = areaInput.trim();
    const pincode = pincodeInput.trim();
    if (area.length < 3) {
      setLocationError("Please enter a valid neighbourhood, street, or city.");
      return;
    }
    if (pincode.length > 0 && !/^\d{6}$/.test(pincode)) {
      setLocationError("Pincode should be a 6-digit number (or leave blank).");
      return;
    }
    setDeliveryLocation({ area, pincode });
    setLocationError(null);
    setLocationModalOpen(false);
  }

  function handleSimulatedCheckout() {
    if (cartDetails.rows.length === 0) return;
    if (!deliveryLocation) {
      openLocationModal();
      return;
    }
    const orderNumber = `MG-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedOrder({
      orderId: orderNumber,
      location: deliveryLocation,
      items: cartDetails.rows,
      totalInr: cartDetails.totalInr,
      placedAt: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    setCart([]);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col">
      {/* Delivery-Location & Storefront Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
          {/* Brand + Delivery Location Selector */}
          <div className="flex items-center gap-5 min-w-0">
            <a
              href="#catalog"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
            >
              My <span className="text-[#0C831F]">Grocery</span>
            </a>

            <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

            <button
              type="button"
              onClick={openLocationModal}
              data-testid="location-trigger"
              className="flex items-center gap-2 text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition-colors min-w-0 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#0C831F] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[11px] font-medium text-slate-500 leading-tight">
                  Delivering to
                </span>
                <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-[190px] sm:max-w-[240px]">
                  <span className="truncate">
                    {deliveryLocation
                      ? deliveryLocation.pincode
                        ? `${deliveryLocation.area}, ${deliveryLocation.pincode}`
                        : deliveryLocation.area
                      : "Set delivery location"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="order-3 md:order-2 w-full md:flex-1 md:max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search "milk", "tomatoes", "basmati"...'
              aria-label="Search groceries"
              data-testid="search-input"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F]/20 focus:border-[#0C831F] transition-colors"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cart Button */}
          <div className="order-2 md:order-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              data-testid="cart-button"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#0C831F] hover:bg-[#0a6e1a] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {cartDetails.totalItems > 0 ? (
                <span className="tabular-nums">
                  {cartDetails.totalItems} {cartDetails.totalItems === 1 ? "item" : "items"} ·{" "}
                  {formatInr(cartDetails.totalInr)}
                </span>
              ) : (
                <span>My Cart</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Clean Storefront Intro Strip */}
        <section className="bg-white border border-slate-200 rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Everyday groceries, organized cleanly
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse local essentials by category, compare pack sizes in INR, and build your cart.
            </p>
          </div>
          {!deliveryLocation && (
            <button
              type="button"
              onClick={openLocationModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-[#F8CB46] hover:bg-[#f0bf30] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Enter Delivery Area</span>
            </button>
          )}
        </section>

        {/* Category Navigation */}
        <section aria-label="Product categories" className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`category-${category.id}`}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing{" "}
            <strong className="font-semibold text-slate-800 tabular-nums">
              {filteredProducts.length}
            </strong>{" "}
            {filteredProducts.length === 1 ? "product" : "products"}
            {selectedCategory !== "all"
              ? ` in ${CATEGORIES.find((c) => c.id === selectedCategory)?.label}`
              : ""}
            {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ""}
          </span>
          {(selectedCategory !== "all" || searchQuery.trim().length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="font-medium text-[#0C831F] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-16 px-6 text-center">
            <p className="text-base font-semibold text-slate-900">No matching groceries found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search keyword or switch back to All Items.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#0C831F] hover:bg-[#0a6e1a] rounded-lg transition-colors cursor-pointer"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <section
            aria-label="Grocery products"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {filteredProducts.map((product) => {
              const qty = getQuantity(product.id);
              const imgFailed = failedImages[product.id];
              return (
                <article
                  key={product.id}
                  data-testid={`product-card-${product.id}`}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {!imgFailed ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [product.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
                        <Package className="w-8 h-8" />
                        <span className="text-xs text-center">{product.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {product.categoryLabel}
                      </p>
                      <h2 className="mt-1 text-[15px] font-semibold text-slate-900 leading-snug">
                        {product.name}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">{product.packSize}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {formatInr(product.priceInr)}
                      </span>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(product.id)}
                          data-testid={`add-${product.id}`}
                          className="px-4 py-1.5 text-xs font-semibold text-[#0C831F] bg-emerald-50/70 border border-[#0C831F]/40 hover:bg-[#0C831F] hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="inline-flex items-center bg-[#0C831F] text-white rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                            data-testid={`dec-${product.id}`}
                            className="px-2.5 py-1.5 hover:bg-[#0a6e1a] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span
                            data-testid={`qty-${product.id}`}
                            className="px-2 text-xs font-bold tabular-nums min-w-[24px] text-center"
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                            data-testid={`inc-${product.id}`}
                            className="px-2.5 py-1.5 hover:bg-[#0a6e1a] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>My Grocery · Local Demo Storefront</span>
          <span>Cart and delivery location are saved in your browser.</span>
        </div>
      </footer>

      {/* Cart Slide-Over Drawer */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
          onClick={() => setCartOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          <div
            className="bg-white w-full max-w-md h-full flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Cart</h2>
                {!confirmedOrder && (
                  <p className="text-xs text-slate-500 tabular-nums">
                    {cartDetails.totalItems}{" "}
                    {cartDetails.totalItems === 1 ? "item" : "items"} ·{" "}
                    {formatInr(cartDetails.totalInr)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmedOrder ? (
              <div
                data-testid="order-confirmation"
                className="flex-1 p-6 overflow-y-auto flex flex-col justify-between gap-6"
              >
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#0C831F] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-[#0C831F]">
                        Simulated Order Placed
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        Order {confirmedOrder.orderId} Confirmed
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Placed at {confirmedOrder.placedAt} · No payment was collected.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-1">
                    <p className="font-semibold text-slate-800">Delivery Location</p>
                    <p className="text-slate-600">
                      {confirmedOrder.location.area}
                      {confirmedOrder.location.pincode
                        ? ` — ${confirmedOrder.location.pincode}`
                        : ""}
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {confirmedOrder.items.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="text-slate-500">
                            {product.packSize} · Qty {quantity}
                          </p>
                        </div>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {formatInr(product.priceInr * quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="px-4 py-3 bg-slate-50 flex items-center justify-between text-sm font-bold text-slate-900">
                      <span>Order Total</span>
                      <span className="tabular-nums">{formatInr(confirmedOrder.totalInr)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    setCartOpen(false);
                  }}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-[#0C831F] hover:bg-[#0a6e1a] rounded-lg transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cartDetails.rows.length === 0 ? (
              <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-900">Your cart is empty</p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Add fresh produce, dairy, snacks, or pantry staples from the catalog to get
                  started.
                </p>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-[#0C831F] hover:bg-[#0a6e1a] rounded-lg transition-colors cursor-pointer"
                >
                  Browse Groceries
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {/* Delivery Location Summary */}
                  <div className="px-5 py-3.5 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-[#0C831F] shrink-0" />
                      <span className="text-slate-700 truncate">
                        {deliveryLocation
                          ? deliveryLocation.pincode
                            ? `${deliveryLocation.area}, ${deliveryLocation.pincode}`
                            : deliveryLocation.area
                          : "No delivery location saved"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={openLocationModal}
                      className="text-xs font-semibold text-[#0C831F] hover:underline shrink-0 cursor-pointer"
                    >
                      {deliveryLocation ? "Change" : "Set"}
                    </button>
                  </div>

                  {/* Cart Items */}
                  {cartDetails.rows.map(({ product, quantity }) => (
                    <div key={product.id} className="px-5 py-4 flex items-center gap-3.5">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.packSize} · {formatInr(product.priceInr)} each
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="inline-flex items-center border border-slate-200 rounded-md overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, -1)}
                              aria-label={`Decrease ${product.name}`}
                              className="px-2 py-1 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, 1)}
                              aria-label={`Increase ${product.name}`}
                              className="px-2 py-1 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            aria-label={`Remove ${product.name}`}
                            data-testid={`remove-${product.id}`}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                        {formatInr(product.priceInr * quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cart Footer & Simulated Checkout */}
                <div className="border-t border-slate-200 p-5 space-y-4 bg-white">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between text-slate-600 text-xs">
                      <span>Items ({cartDetails.totalItems})</span>
                      <span className="tabular-nums">{formatInr(cartDetails.totalInr)}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-900 text-base">
                      <span>Total Amount</span>
                      <span className="tabular-nums" data-testid="cart-total">
                        {formatInr(cartDetails.totalInr)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulatedCheckout}
                      data-testid="checkout-button"
                      className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-[#0C831F] hover:bg-[#0a6e1a] rounded-lg transition-colors cursor-pointer"
                    >
                      {deliveryLocation
                        ? "Place Simulated Order"
                        : "Set Location & Place Order"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delivery Location Modal */}
      {locationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
          onClick={() => setLocationModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Set delivery location"
        >
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Enter Delivery Location</h2>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                aria-label="Close location modal"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label
                  htmlFor="delivery-area"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Neighbourhood, Street, or City
                </label>
                <input
                  id="delivery-area"
                  type="text"
                  required
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="e.g. Indiranagar 100 Feet Rd, Bengaluru"
                  data-testid="location-area-input"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F]/20 focus:border-[#0C831F]"
                />
              </div>

              <div>
                <label
                  htmlFor="delivery-pincode"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Pincode (optional)
                </label>
                <input
                  id="delivery-pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="e.g. 560038"
                  data-testid="location-pincode-input"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F]/20 focus:border-[#0C831F]"
                />
              </div>

              {locationError && (
                <p className="text-xs text-red-600 font-medium">{locationError}</p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="location-save-button"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0C831F] hover:bg-[#0a6e1a] rounded-lg transition-colors cursor-pointer"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
