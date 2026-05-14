import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShoppingBag, Search, RefreshCw } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import useSearchStore from '../store/useSearchStore';
import useLocationStore from '../store/useLocationStore';
import { ACTIVE_SOURCES } from '../config/activeSources';

const SOURCE_CONFIG = {
  blinkit: {
    label: 'Blinkit',
    color: 'bg-yellow-400',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    bgLight: 'bg-yellow-50',
    dot: 'bg-yellow-400',
    time: '8 mins',
  },
  zepto: {
    label: 'Zepto',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    bgLight: 'bg-purple-50',
    dot: 'bg-purple-500',
    time: '10 mins',
  },
  instamart: {
    label: 'Instamart',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    bgLight: 'bg-orange-50',
    dot: 'bg-orange-500',
    time: '15 mins',
  },
  bigbasket: {
    label: 'BigBasket',
    color: 'bg-green-600',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    bgLight: 'bg-green-50',
    dot: 'bg-green-600',
    time: '30 mins',
  },
};

function SkeletonCard() {
  return (
    <div className="w-[160px] md:w-[180px] rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse flex-shrink-0">
      <div className="h-[130px] bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-100 rounded w-12" />
          <div className="h-8 bg-gray-100 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

function describeDataFlow(meta) {
  if (!meta?.dataSource) return '';
  const ds = String(meta.dataSource);
  if (ds.includes('cache')) return 'warm replay (skip network)';
  if (ds.includes('quickcommerce') && ds.includes('scrape')) return 'live API · gaps filled locally';
  if (ds.startsWith('quickcommerce')) return 'live commercial API feed';
  if (ds === 'scrape') return 'browser extraction';
  return ds.replace(/\+/g, ' · ');
}

function relativeFetched(iso) {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 8) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function SourceSection({ source, products, isLoading }) {
  const cfg = SOURCE_CONFIG[source];
  const showSkeletons = isLoading && products.length === 0;

  if (!isLoading && products.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-8"
    >
      {/* Source Header */}
      <div className={`flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl ${cfg.bgLight} border ${cfg.borderColor}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <span className={`text-sm font-black ${cfg.textColor} tracking-wide`}>{cfg.label}</span>
        <span className={`ml-1 text-xs font-bold ${cfg.textColor} opacity-60 flex items-center gap-1`}>
          <Zap className="w-3 h-3" /> {cfg.time} delivery
        </span>
        {products.length > 0 && (
          <span className={`ml-auto text-xs font-bold ${cfg.textColor} opacity-80`}>
            {products.length} items
          </span>
        )}
        {isLoading && products.length === 0 && (
          <span className="ml-auto text-xs font-semibold text-gray-400 flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin inline-block" />
            Searching...
          </span>
        )}
      </div>

      {/* Product Scroll Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar pl-0.5">
        {showSkeletons
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p, i) => (
              <div key={p.id || `${source}-${i}`} className="flex-shrink-0">
                <ProductCard
                  product={{
                    id: p.id || `${source}-${i}`,
                    name: p.name || 'Product',
                    price: parsePrice(p.price),
                    mrp: parsePrice(p.originalPrice) || parsePrice(p.price),
                    discount: parseDiscount(p.discount),
                    quantity: p.quantity || p.weight || '',
                    image: p.imageUrl || p.image || '',
                    source,
                    productUrl: p.productUrl || '#',
                    deliveryTime: p.deliveryTime || cfg.time,
                    rating: p.rating != null ? Number(p.rating) : null,
                    ratingCount: p.ratingCount != null ? Number(p.ratingCount) : null,
                    available: p.available !== false,
                  }}
                />
              </div>
            ))}
      </div>
    </motion.div>
  );
}

function parsePrice(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const n = parseInt(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseDiscount(val) {
  if (!val) return 0;
  const n = parseInt(String(val).replace(/[^0-9]/g, ''));
  return isNaN(n) ? 0 : n;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { search, isSearching, statusMessage, products, serviceStatus, isConnected, searchMeta } =
    useSearchStore();
  const { isSet: isLocationSet } = useLocationStore();

  const [activeTab, setActiveTab] = useState('all');

  // Trigger search when ready
  useEffect(() => {
    if (query && isLocationSet && isConnected) search(query);
  }, [query, isLocationSet, isConnected]);

  // Reset tab when query changes
  useEffect(() => { setActiveTab('all'); }, [query]);

  const allProducts = useMemo(
    () => ACTIVE_SOURCES.flatMap((s) => products[s] || []),
    [products]
  );

  const counts = useMemo(() => {
    const bySource = Object.fromEntries(
      ACTIVE_SOURCES.map((s) => [s, (products[s] || []).length])
    );
    return { all: allProducts.length, ...bySource };
  }, [products, allProducts.length]);

  const hasAnyResults = allProducts.length > 0;
  const isDoneSearching = !isSearching;
  const primaryStoreLabel =
    ACTIVE_SOURCES.length === 1
      ? SOURCE_CONFIG[ACTIVE_SOURCES[0]]?.label || 'Blinkit'
      : 'all stores';

  const resultsSubtitle = isSearching
    ? statusMessage
    : hasAnyResults
      ? `${allProducts.length} product${allProducts.length === 1 ? '' : 's'} on ${
          ACTIVE_SOURCES.length === 1 ? primaryStoreLabel : 'all stores'
        }`
      : ACTIVE_SOURCES.length === 1
        ? `No matches on ${primaryStoreLabel}`
        : 'No matches across selected stores';

  // ── Not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 gap-4 text-center px-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-black text-gray-800">Connecting to live scrapers...</h2>
        <p className="text-gray-400 text-sm">Please wait a moment</p>
      </div>
    );
  }

  // ── No location set
  if (!isLocationSet) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 gap-4 text-center px-4">
        <div className="text-5xl mb-2">📍</div>
        <h2 className="text-2xl font-black text-gray-800">Set your delivery location</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Click the location picker in the top bar to get Blinkit prices for your area.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm font-medium">Results for</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">"{query}"</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
          <p className="text-gray-400 text-sm font-medium">{resultsSubtitle}</p>
          {!isSearching && query && (
            <>
              <span className="text-gray-300 text-xs hidden sm:inline">·</span>
              <button
                type="button"
                disabled={isSearching || !query}
                onClick={() => search(query, { bypassCache: true })}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-green-700 disabled:text-gray-300 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                Refresh prices
              </button>
              {searchMeta?.fetchedAt && (
                <span className="text-[11px] font-semibold text-gray-400 w-full sm:w-auto basis-full sm:basis-auto">
                  Updated {relativeFetched(searchMeta.fetchedAt)}
                  {searchMeta?.fromCache ? ' · cached' : ''}
                  {searchMeta?.dataSource ? ` · ${describeDataFlow(searchMeta)}` : ''}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab bar — only when comparing multiple sources */}
      {ACTIVE_SOURCES.length > 1 && (hasAnyResults || isSearching) && (
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {['all', ...ACTIVE_SOURCES].map((tab) => {
            const cfg = tab === 'all' ? null : SOURCE_CONFIG[tab];
            const count = counts[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive
                    ? cfg
                      ? `${cfg.color} text-white shadow`
                      : 'bg-gray-900 text-white shadow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {tab === 'all' ? <ShoppingBag className="w-3.5 h-3.5" /> : (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : cfg.dot}`} />
                )}
                {tab === 'all' ? 'All' : SOURCE_CONFIG[tab].label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {ACTIVE_SOURCES.length === 1 ? (
          <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {ACTIVE_SOURCES.map((src) => (
              <SourceSection
                key={src}
                source={src}
                products={products[src] || []}
                isLoading={
                  isSearching &&
                  serviceStatus[src] !== 'success' &&
                  serviceStatus[src] !== 'empty' &&
                  serviceStatus[src] !== 'error'
                }
              />
            ))}
            {isDoneSearching && !hasAnyResults && (
              <div className="flex flex-col items-center justify-center pt-16 gap-4 text-center">
                <div className="text-5xl">🔍</div>
                <h2 className="text-xl font-black text-gray-800">No results found</h2>
                <p className="text-gray-400 text-sm max-w-xs">
                  Try another search term or confirm the backend scraper is running.
                </p>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'all' ? (
          <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {ACTIVE_SOURCES.map((src) => (
              <SourceSection
                key={src}
                source={src}
                products={products[src] || []}
                isLoading={
                  isSearching &&
                  serviceStatus[src] !== 'success' &&
                  serviceStatus[src] !== 'empty' &&
                  serviceStatus[src] !== 'error'
                }
              />
            ))}

            {isDoneSearching && !hasAnyResults && (
              <div className="flex flex-col items-center justify-center pt-16 gap-4 text-center">
                <div className="text-5xl">🔍</div>
                <h2 className="text-xl font-black text-gray-800">No results found</h2>
                <p className="text-gray-400 text-sm max-w-xs">
                  Try a different search term or check if the scraper service is running.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SourceSection
              source={activeTab}
              products={products[activeTab] || []}
              isLoading={isSearching && serviceStatus[activeTab] !== 'success' && serviceStatus[activeTab] !== 'empty'}
            />
            {isDoneSearching && (products[activeTab] || []).length === 0 && (
              <div className="flex flex-col items-center justify-center pt-16 gap-3 text-center">
                <div className="text-4xl">😕</div>
                <h3 className="text-lg font-black text-gray-700">
                  No products on {SOURCE_CONFIG[activeTab].label}
                </h3>
                <p className="text-gray-400 text-sm">Try another search or pick a different store tab</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
