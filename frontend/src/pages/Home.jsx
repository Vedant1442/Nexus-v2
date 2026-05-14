import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import useSearchStore from '../store/useSearchStore';

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
    { id: 'h2',  name: 'Nandini GoodLife Milk', price: 54, mrp: 54, discount: 0, quantity: '500 ml', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h3',  name: 'Britannia Fresh Dahi', price: 40, mrp: 40, discount: 0, quantity: '400 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/09f58356-ccae-48f6-be11-bb035c678a10.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h4',  name: 'Farm Fresh Brown Eggs', price: 89,  mrp: 96,  discount: 7,  quantity: '6 pcs', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/443c5b5d-9fcb-4d40-ba7a-9774de90efb2.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
  snacks: [
    { id: 'h7',  name: 'Lays Classic Salted', price: 20, mrp: 20, discount: 0, quantity: '50 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/0fef70a3-294b-48af-b461-8cf9690f0586.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h8',  name: "Lay's Magic Masala", price: 20, mrp: 20, discount: 0, quantity: '50 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/77794356-6f81-426c-8e4a-9b883017e82b.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h9',  name: 'Doritos Cheese Nachos', price: 50, mrp: 50, discount: 0, quantity: '60 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/43da4930-58c0-4822-8302-3c829e061730.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
  fruits: [
    { id: 'h13', name: 'Bananas', price: 44, mrp: 50, discount: 12, quantity: '6 pcs', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/07688037-0cfd-4a67-9aa3-f09b266184fc.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h14', name: 'Fresh Tomatoes', price: 35, mrp: 40, discount: 12, quantity: '500 g', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/2d0e0c24-d032-473d-8697-36e6b566f1d0.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h17', name: 'Onions', price: 39, mrp: 42, discount: 7, quantity: '1 kg', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/1f03e1e2-b1e0-47b2-8509-f6226f977c07.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
    { id: 'h18', name: 'Potatoes', price: 29, mrp: 35, discount: 17, quantity: '1 kg', image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/3389025e-316e-41d6-8488-51152a514d87.jpg', source: 'blinkit', productUrl: '#', deliveryTime: '8 mins' },
  ],
};

function ProductRail({ title, products, query }) {
  const navigate = useNavigate();
  return (
    <div className="mb-12 px-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
        <button
          onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
          className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
        >
          See all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { categories, featuredProducts, fetchHomeContent, isConnected } = useSearchStore();

  useEffect(() => {
    if (isConnected) {
      fetchHomeContent();
    }
  }, [isConnected]);

  const handleCategoryClick = (cat) => {
    navigate(`/search?q=${encodeURIComponent(cat.name)}`);
  };

  return (
    <div className="w-full">
      <div className="mb-8 pt-4">
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#0c831f] to-[#14b82c] h-[160px] md:h-[220px] flex items-center px-8 shadow-xl">
          <div className="text-white z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">Live Warp Speed</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
              Blinkit in <span className="text-yellow-300">8 mins</span>
            </h1>
            <p className="text-white/80 text-sm md:text-base mt-2 font-bold max-w-md">
              Real-time prices from the Warp Pool. No more stale data.
            </p>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/10 -mr-20 -mt-20 blur-3xl" />
          <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full bg-yellow-400/10 mb-0 blur-2xl" />
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Shop by Category</h2>
        </div>
        
        {categories.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {categories.slice(0, 16).map((cat, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] shadow-sm hover:shadow-md hover:border-nexus-green transition-all group"
              >
                <div className="w-full aspect-square rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 text-center leading-tight uppercase tracking-wide line-clamp-2">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500 font-bold gap-3 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            Warping Categories...
          </div>
        )}
      </div>

      {featuredProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Warp Featured</h2>
            <button
              onClick={() => navigate('/search?q=popular')}
              className="text-primary font-black text-sm flex items-center gap-1 hover:underline"
            >
              See all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Fallback Rails */}
      <ProductRail title="🥛 Dairy, Bread & Eggs" products={CATALOG.dairy} query="milk eggs dairy bread" />
      <ProductRail title="🍟 Snacks & Munchies" products={CATALOG.snacks} query="chips biscuits snacks" />
      <ProductRail title="🥦 Fruits & Vegetables" products={CATALOG.fruits} query="fresh fruits vegetables" />
    </div>
  );
}
