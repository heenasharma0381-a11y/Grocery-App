export type CategoryId =
  | "all"
  | "fruits-veg"
  | "dairy-bakery"
  | "snacks-nuts"
  | "beverages"
  | "staples-oils";

export interface CategoryItem {
  id: CategoryId;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  category: Exclude<CategoryId, "all">;
  categoryLabel: string;
  packSize: string;
  priceInr: number;
  image: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "all", label: "All Items" },
  { id: "fruits-veg", label: "Fruits & Veg" },
  { id: "dairy-bakery", label: "Dairy & Bakery" },
  { id: "snacks-nuts", label: "Snacks & Nuts" },
  { id: "beverages", label: "Beverages" },
  { id: "staples-oils", label: "Staples & Oils" },
];

export const PRODUCTS: Product[] = [
  {
    id: "prod-tomatoes",
    name: "Fresh Hybrid Tomatoes",
    category: "fruits-veg",
    categoryLabel: "Fruits & Veg",
    packSize: "500 g",
    priceInr: 28,
    image: "/src/assets/images/product_fresh_tomatoes_1795700723480.jpg",
  },
  {
    id: "prod-bananas",
    name: "Robusta Yellow Bananas",
    category: "fruits-veg",
    categoryLabel: "Fruits & Veg",
    packSize: "6 pcs",
    priceInr: 42,
    image: "/src/assets/images/product_organic_bananas_1795700724074.jpg",
  },
  {
    id: "prod-milk",
    name: "Farm Fresh Whole Milk",
    category: "dairy-bakery",
    categoryLabel: "Dairy & Bakery",
    packSize: "500 ml",
    priceInr: 34,
    image: "/src/assets/images/product_farm_milk_1795700724198.jpg",
  },
  {
    id: "prod-bread",
    name: "Harvest Whole Wheat Sliced Bread",
    category: "dairy-bakery",
    categoryLabel: "Dairy & Bakery",
    packSize: "800 g",
    priceInr: 65,
    image: "/src/assets/images/product_sourdough_bread_1795700724977.jpg",
  },
  {
    id: "prod-chips",
    name: "Spiced Masala Potato Chips",
    category: "snacks-nuts",
    categoryLabel: "Snacks & Nuts",
    packSize: "150 g",
    priceInr: 45,
    image: "/src/assets/images/product_masala_chips_1795700725051.jpg",
  },
  {
    id: "prod-almonds",
    name: "Oven Roasted Almonds",
    category: "snacks-nuts",
    categoryLabel: "Snacks & Nuts",
    packSize: "340 g",
    priceInr: 295,
    image: "/src/assets/images/product_roasted_almonds_1795700724988.jpg",
  },
  {
    id: "prod-coffee",
    name: "Oak & Bean Cold Brew Coffee",
    category: "beverages",
    categoryLabel: "Beverages",
    packSize: "250 ml",
    priceInr: 85,
    image: "/src/assets/images/product_cold_coffee_1795700725150.jpg",
  },
  {
    id: "prod-tea",
    name: "Organic Sencha Green Tea",
    category: "beverages",
    categoryLabel: "Beverages",
    packSize: "20 bags",
    priceInr: 160,
    image: "/src/assets/images/product_green_tea_1795700727284.jpg",
  },
  {
    id: "prod-rice",
    name: "Aged Long-Grain Basmati Rice",
    category: "staples-oils",
    categoryLabel: "Staples & Oils",
    packSize: "1 kg",
    priceInr: 145,
    image: "/src/assets/images/product_basmati_rice_1795700729475.jpg",
  },
  {
    id: "prod-oil",
    name: "Cold-Pressed Groundnut Oil",
    category: "staples-oils",
    categoryLabel: "Staples & Oils",
    packSize: "1 L",
    priceInr: 210,
    image: "/src/assets/images/product_cold_pressed_oil_1795700726029.jpg",
  },
];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
