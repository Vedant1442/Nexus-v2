import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Dairy & Eggs',      emoji: '🥛', query: 'milk eggs dairy',   color: 'bg-blue-50',    border: 'border-blue-100' },
  { name: 'Fruits & Veg',      emoji: '🥦', query: 'fresh fruits vegetables', color: 'bg-green-50', border: 'border-green-100' },
  { name: 'Snacks',            emoji: '🍟', query: 'chips biscuits snacks', color: 'bg-yellow-50', border: 'border-yellow-100' },
  { name: 'Cold Drinks',       emoji: '🥤', query: 'cold drinks soda juice', color: 'bg-cyan-50',  border: 'border-cyan-100' },
  { name: 'Bakery',            emoji: '🍞', query: 'bread bakery cake',   color: 'bg-orange-50',  border: 'border-orange-100' },
  { name: 'Atta, Rice & Dal',  emoji: '🌾', query: 'atta rice dal pulses', color: 'bg-amber-50',  border: 'border-amber-100' },
  { name: 'Meat & Fish',       emoji: '🍗', query: 'chicken fish mutton', color: 'bg-red-50',     border: 'border-red-100' },
  { name: 'Personal Care',     emoji: '🧴', query: 'shampoo soap personal care', color: 'bg-pink-50', border: 'border-pink-100' },
  { name: 'Cleaning',          emoji: '🧹', query: 'cleaning detergent floor cleaner', color: 'bg-indigo-50', border: 'border-indigo-100' },
  { name: 'Ice Cream',         emoji: '🍦', query: 'ice cream kulfi frozen dessert', color: 'bg-purple-50', border: 'border-purple-100' },
  { name: 'Noodles & Pasta',   emoji: '🍜', query: 'noodles pasta maggi', color: 'bg-rose-50',   border: 'border-rose-100' },
  { name: 'Tea & Coffee',      emoji: '☕', query: 'tea coffee',          color: 'bg-stone-50',   border: 'border-stone-100' },
];

// ── Curated catalog products (Blinkit demo rail) ───────────────────────────────
const CATALOG = {
  dairy: [
    { id: 'h1',  name: 'Amul Taaza Toned Milk', price: 68,  mrp: 72,  discount: 5,  quantity: '1 L',   image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit',   productUrl: 'https://blinkit.com/prn/amul-taaza-toned-fresh-milk/prid/12833', deliveryTime: '8 mins' },
    { id: 'h2',  name: 'Nandini GoodLife UHT Milk', price: 54, mrp: 54, discount: 0, quantity: '500 ml', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h3',  name: 'Britannia Daily Fresh Dahi', price: 40, mrp: 40, discount: 0, quantity: '400 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h4',  name: 'Farm Fresh Brown Eggs', price: 89,  mrp: 96,  discount: 7,  quantity: '6 pcs', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/443c5b5d-9fcb-4d40-ba7a-9774de90efb2.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h5',  name: 'Amul Butter', price: 58, mrp: 60, discount: 3, quantity: '100 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h6',  name: 'Mother Dairy Curd', price: 52, mrp: 55, discount: 5, quantity: '500 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
  snacks: [
    { id: 'h7',  name: 'Lays Classic Salted Chips', price: 20, mrp: 20, discount: 0, quantity: '26 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h8',  name: "Lay's Magic Masala", price: 20, mrp: 20, discount: 0, quantity: '26 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h9',  name: 'Bingo Mad Angles', price: 20, mrp: 20, discount: 0, quantity: '72 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h10', name: 'Parle-G Biscuits', price: 5,  mrp: 5,  discount: 0, quantity: '65 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/443c5b5d-9fcb-4d40-ba7a-9774de90efb2.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h11', name: 'Good Day Cashew Cookies', price: 30, mrp: 32, discount: 6, quantity: '100 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h12', name: 'Haldiram Aloo Bhujia', price: 50, mrp: 55, discount: 9, quantity: '200 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
  fruits: [
    { id: 'h13', name: 'Bananas', price: 44, mrp: 50, discount: 12, quantity: '6 pcs ~600 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h14', name: 'Fresh Tomatoes', price: 35, mrp: 40, discount: 12, quantity: '500 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/443c5b5d-9fcb-4d40-ba7a-9774de90efb2.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h15', name: 'Green Apples', price: 89, mrp: 100, discount: 11, quantity: '4 pcs', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h16', name: 'Spinach Palak', price: 25, mrp: 30, discount: 17, quantity: '200 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h17', name: 'Onions', price: 39, mrp: 42, discount: 7, quantity: '1 kg', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h18', name: 'Potatoes', price: 29, mrp: 35, discount: 17, quantity: '1 kg', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/443c5b5d-9fcb-4d40-ba7a-9774de90efb2.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
  beverages: [
    { id: 'h19', name: 'Coca-Cola 750 ml', price: 42, mrp: 45, discount: 6, quantity: '750 ml', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h20', name: 'Sprite Can', price: 45, mrp: 45, discount: 0, quantity: '300 ml', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h21', name: 'Real Fruit Juice Orange', price: 105, mrp: 115, discount: 8, quantity: '1 L', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h22', name: 'Tata Tea Gold', price: 175, mrp: 192, discount: 9, quantity: '250 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/443c5b5d-9fcb-4d40-ba7a-9774de90efb2.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h23', name: 'Nescafé Classic', price: 180, mrp: 210, discount: 14, quantity: '50 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h24', name: 'Tropicana Apple Juice', price: 99, mrp: 110, discount: 10, quantity: '1 L', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
  bakery: [
    { id: 'h25', name: 'Harvest Gold White Bread', price: 40, mrp: 42, discount: 4, quantity: '400 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h26', name: 'Britannia Chocolate Cake', price: 50, mrp: 55, discount: 9, quantity: '60 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/443c5b5d-9fcb-4d40-ba7a-9774de90efb2.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h27', name: 'Bonn Multigrain Bread', price: 55, mrp: 60, discount: 8, quantity: '400 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h28', name: 'Monginis Fresh Pastry', price: 80, mrp: 90, discount: 11, quantity: '2 pcs', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
};

// ── Product rail ───────────────────────────────────────────────────────────────
function ProductRail({ title, products, query }) {
  const navigate = useNavigate();
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
        <button
          onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
          className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
        >
          See all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

// ── Main Home page ─────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  const handleCategoryClick = (cat) => {
    navigate(`/search?q=${encodeURIComponent(cat.query)}`);
  };

  return (
    <div className="w-full">

      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="mb-8 pt-4">
        <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-emerald-600 h-[160px] md:h-[200px] flex items-center px-8 shadow-lg">
          <div className="text-white z-10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span className="text-sm font-bold text-white/80 uppercase tracking-widest">Blinkit · search & browse</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              Grocery in <span className="text-yellow-300">8 minutes</span>
            </h1>
            <p className="text-white/75 text-sm mt-1 font-medium">
              Live catalog and prices for your pin — more stores coming later
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -mr-12 -mt-12" />
          <div className="absolute right-16 bottom-0 w-32 h-32 rounded-full bg-white/5 mb-0" />
        </div>
      </div>

      {/* ── Blinkit highlight ────────────────────────────────────────────── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate('/search?q=milk')}
        className="w-full mb-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 p-5 text-left text-yellow-950 shadow-sm border border-yellow-300/60 flex items-center justify-between gap-4"
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Now on NEXUS</div>
          <div className="text-xl font-black">Blinkit</div>
          <div className="flex items-center gap-1 mt-1 text-sm font-bold opacity-90">
            <Zap className="w-3.5 h-3.5 fill-current" />
            ~8 min delivery · tap to search milk
          </div>
        </div>
        <ArrowRight className="w-8 h-8 shrink-0 opacity-80" />
      </motion.button>

      {/* ── Category grid ────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCategoryClick(cat)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border ${cat.color} ${cat.border} cursor-pointer transition hover:shadow-sm`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Product Rails ─────────────────────────────────────────────────── */}
      <ProductRail title="🥛 Dairy, Bread & Eggs" products={CATALOG.dairy}     query="milk eggs dairy bread" />
      <ProductRail title="🍟 Snacks & Munchies"   products={CATALOG.snacks}    query="chips biscuits snacks" />
      <ProductRail title="🥦 Fruits & Vegetables" products={CATALOG.fruits}    query="fresh fruits vegetables" />
      <ProductRail title="🥤 Cold Drinks & Juices" products={CATALOG.beverages} query="cold drinks juice" />
      <ProductRail title="🍞 Bakery & Cakes"       products={CATALOG.bakery}    query="bread cake bakery" />

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <div className="mt-4 mb-10 rounded-2xl bg-gray-50 border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900">Can't find what you need?</h3>
          <p className="text-gray-500 text-sm mt-0.5">Search Blinkit in real time for your saved location</p>
        </div>
        <button
          onClick={() => { const el = document.querySelector('input[type="text"]'); if (el) el.focus(); }}
          className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition shadow-sm"
        >
          Search Now <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
