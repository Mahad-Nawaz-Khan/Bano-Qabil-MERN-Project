// Extracted from the original site's index.html (product-card data-* attributes).
// Product photos weren't included in the uploaded project, so `img` may not resolve —
// Card.jsx falls back to the logo when an image fails to load.
export const menuData = [
  {
    category: "Platters",
    items: [
      { name: "Arabian Feast Platter (2 Person)", price: "2,508", img: "/images/Arabian-Feast-Platter-2-Person-327x327.jpg", desc: "Chicken Turkish Kabab , Beef Adana Kabab , Irani Boti , Chicken Chop , Chicken Madbee Qtr , 3 Type of Sauces , Arabic Bread , Mandi Rice" },
      { name: "Arabian Feast Platter (4 Person)", price: "4,930", img: "/images/Arabian-Feast-Platter-4-Person-327x327.jpg", desc: "Arabic Rice, Adana Kabab, Turkish Kabab, Irani Boti, Chicken Chops 2pcs, Chicken Madbee Half, 3 Types of Sauces, 2 Arabic Bread, Grill Veggies." },
      { name: "Mandi Platter (4 Person)", price: "7,820", img: "/images/Mandi-platter-327x327.jpg", desc: "Chicken Madbee , Mutton Madfoon , Fish Madbee , Beef Adana Kabab ,Chicken Turkish Kabab , Grill Madbee Boti, Sauces, Grill Veggie, Mandi Rice" },
      { name: "Meshwi Platter (2 Persons)", price: "4,165", img: "/images/mashwi-platter-3-327x327.jpg", desc: "Turkish Kabab, Adana Kabab, Beef Bihari Boti, Malai Boti, Chicken Chops 2pcs, Arabic Bread, Puri Paratha, 3 Types of Sauces, Grill Veggies." },
    ],
  },
  {
    category: "Mutton",
    items: [
      { name: "Full Spicy Mutton (Salim)", price: "40,000", img: "/images/full-mutton-400x400.png (1).webp", desc: "" },
      { name: "Mutton Dasti", price: "5,270", img: "/images/mutton-dasti-400x400.jpg", desc: "" },
      { name: "Mutton Harara (Double Serving)", price: "5,525", img: "/images/mutton-harara-1-400x400.jpg", desc: "" },
      { name: "Mutton Madfoon (Double Serving)", price: "5,525", img: "/images/mutton-madfoon-1-327x327.jpg", desc: "" },
      { name: "Mutton Mandi (Single Serving)", price: "2,763", img: "/images/mutton-mandi-2-400x400.jpg", desc: "" },
      { name: "Laham Jalama Per KG", price: "4,080", img: "/images/laham-2-400x400.jpg", desc: "" },
    ],
  },
  {
    category: "Chicken",
    items: [
      { name: "Chicken Faham (Full With Rice)", price: "3,315", img: "/images/chicken-faham-400x400.jpg", desc: "" },
      { name: "Chicken Madbee Full Serving", price: "3,315", img: "/images/chicken-madbee-400x400.jpg", desc: "" },
      { name: "Chicken Mandi (Full)", price: "3,315", img: "/images/chicken-mandi-2-400x400.jpg", desc: "" },
    ],
  },
  {
    category: "Fish",
    items: [
      { name: "Fish Madbee (Double Serving)", price: "4,930", img: "/images/fish-madbee-400x400.jpg", desc: "" },
      { name: "Full Grilled Mushka (With Rice)", price: "4,675", img: "/images/mushka-1-400x400.jpg", desc: "" },
      { name: "Full Grilled Mushka", price: "3,400", img: "/images/mushka-400x400.jpg", desc: "" },
    ],
  },
  {
    category: "Grill & BBQ",
    items: [
      { name: "Mutton Boneless Boti", price: "2,975", img: "/images/chops-mutton-1-400x400.jpg", desc: "" },
      { name: "Charcoal Chicken (Full)", price: "3,230", img: "/images/charcoall-400x400.jpg", desc: "" },
      { name: "Chicken Turkish Kabab", price: "1,148", img: "/images/chicken-Turkish-Kabab-400x400.jpg", desc: "" },
      { name: "Mutton Chops", price: "2,975", img: "/images/Chops-400x400.jpg", desc: "" },
      { name: "Beef Bihari Boti", price: "1,267", img: "/images/beff-bihari-boti-400x400.jpg", desc: "" },
      { name: "Beef Adana Kabab", price: "1,148", img: "/images/beef-adana-kabab-400x400.jpg", desc: "" },
      { name: "Irani Boti", price: "1,182", img: "/images/irani-boti-400x400.jpg", desc: "" },
      { name: "Chicken Faham (Full) Without Rice", price: "2,805", img: "/images/chicken-faham-full-400x400.jpg", desc: "" },
      { name: "Chicken Chops Spicy", price: "1,148", img: "/images/chicken-chops-1-400x400.jpg", desc: "" },
      { name: "Malai Boti", price: "1,267", img: "/images/malai.png-1-400x400.jpg", desc: "" },
    ],
  },
  {
    category: "Istanbul Specials",
    items: [
      { name: "Chicken Shawarma", price: "935", img: "/images/chicken-s-400x400.jpg", desc: "" },
      { name: "Pepperoni Pide", price: "1,275", img: "/images/chicken-pide-400x400 (1).jpg", desc: "" },
      { name: "Chicken Pide", price: "1,275", img: "/images/chicken-pide-400x400.jpg", desc: "" },
      { name: "Mix Pide", price: "1,275", img: "/images/mix-pide-400x400.jpg", desc: "Chicken mandi, BBQ, sauces, dessert & rice" },
    ],
  },
  {
    category: "Hot Appetizers",
    items: [
      { name: "Chicken Tosser Strips", price: "1,020", img: "/images/chicken-Tosser-Strips-327x327.jpg", desc: "Chicken mandi, BBQ, sauces, dessert & rice" },
      { name: "Dynamite Chicken with Fries", price: "1,020", img: "/images/Dynamite-Chicken-with-Fries-327x327.jpg", desc: "Chicken mandi, BBQ, sauces, dessert & rice" },
      { name: "Chicken Honey Wings With Fries", price: "850", img: "/images/Chicken-Honey-Wings-327x327.jpg", desc: "" },
      { name: "Mayo Garlic Fries", price: "425", img: "/images/fries--327x327.jpg", desc: "" },
      { name: "French Fries", price: "340", img: "/images/p-fries--327x327.jpg", desc: "" },
    ],
  },
  {
    category: "Dessert",
    items: [
      { name: "Chocolate Kunafa", price: "1,063", img: "/images/c-kunafa-1-400x400.jpg", desc: "" },
      { name: "Cream Kunafa", price: "1,063", img: "/images/c-kunafa-2-400x400.jpg", desc: "" },
      { name: "Pistachio Kunafa", price: "1,700", img: "/images/p-kunafa-400x400.jpg", desc: "" },
    ],
  },
  {
    category: "Bread",
    items: [
      { name: "Pita Bread", price: "60", img: "/images/pita-400x400.png.webp", desc: "" },
      { name: "Puri Paratha", price: "85", img: "/images/puri-400x400.png.webp", desc: "" },
      { name: "Arabic Bread", price: "128", img: "/images/arabian-roti-400x400.png.webp", desc: "" },
    ],
  },
  {
    category: "Beverages",
    items: [
      { name: "Soft Drink", price: "162", img: "/images/cola-400x400.jpg", desc: "Chicken mandi, BBQ, sauces, dessert & rice" },
      { name: "Water", price: "₨ 94 – ₨ 153", img: "/images/پیچ-1-400x400.png", desc: "Chicken mandi, BBQ, sauces, dessert & rice" },
    ],
  },
];