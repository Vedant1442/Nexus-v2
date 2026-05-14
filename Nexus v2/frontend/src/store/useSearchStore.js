import { create } from 'zustand';
import {
  ACTIVE_SOURCES,
  emptyProductBuckets,
  buildInitialServiceStatus,
  searchStartingMessage,
} from '../config/activeSources';
import useLocationStore from './useLocationStore';

let ws = null;
let reconnectTimer = null;

function defaultWsUrl() {
  if (typeof window === 'undefined') return 'ws://localhost:5000';
  const { protocol, hostname, host } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'ws://localhost:5000';
  return protocol === 'https:' ? `wss://${host}` : `ws://${host}`;
}

const ENV_WS = import.meta.env.VITE_NEXUS_WS_URL;
const WS_URL = (typeof ENV_WS === 'string' && ENV_WS.trim() ? ENV_WS.trim() : null) || defaultWsUrl();

const useSearchStore = create((set, get) => ({
  isConnected: false,
  isSearching: false,
  statusMessage: '',
  serviceStatus: buildInitialServiceStatus('idle'),
  products: emptyProductBuckets(),
  lastQuery: '',
  searchMeta: null,

  connect: () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    if (ws) {
      try {
        ws.close();
      } catch (e) {
        /* ignore */
      }
      ws = null;
    }

    const socket = new WebSocket(WS_URL);
    ws = socket;

    socket.onopen = () => {
      set({ isConnected: true, statusMessage: 'Connected' });
      socket.send(JSON.stringify({ action: 'initialize' }));
      // If user already selected a location, forward it after browsers init
      const loc = useLocationStore.getState();
      if (loc.isSet) {
        setTimeout(() => get().setLocation(loc.locationFull), 3000);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.action === 'statusUpdate') {
          if (data.message) set({ statusMessage: data.message });
          if (data.step === 'search' && (data.status === 'completed' || data.status === 'error')) {
            set({ isSearching: false });
          }
        }

        if (data.action === 'serviceSearchUpdate') {
          set(state => ({
            serviceStatus: { ...state.serviceStatus, [data.service]: data.status }
          }));
        }

        if (data.action === 'searchResults' && data.products) {
          const nextProducts = emptyProductBuckets();
          const nextStatus = buildInitialServiceStatus('empty');
          for (const s of ACTIVE_SOURCES) {
            const list = data.products[s] || [];
            nextProducts[s] = list;
            nextStatus[s] = list.length > 0 ? 'success' : 'empty';
          }
          set({
            isSearching: false,
            products: nextProducts,
            searchMeta: data.meta ?? null,
            serviceStatus: nextStatus,
          });
        }

        if (
          data.action === 'streamUpdate' &&
          data.source &&
          ACTIVE_SOURCES.includes(data.source) &&
          Array.isArray(data.products)
        ) {
          set((state) => ({
            products: {
              ...state.products,
              [data.source]: data.products,
            },
            serviceStatus: {
              ...state.serviceStatus,
              [data.source]: 'success',
            },
            statusMessage: `${data.source.charAt(0).toUpperCase() + data.source.slice(1)} loaded…`,
          }));
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    socket.onclose = () => {
      set({ isConnected: false });
      if (ws === socket) ws = null;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => get().connect(), 4000);
    };

    socket.onerror = () => {};
  },

  setLocation: (locationStr) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    set({ statusMessage: 'Pinning your location...' });
    ws.send(JSON.stringify({ action: 'setLocation', location: locationStr }));
  },

  search: (query, opts) => {
    if (!query?.trim()) return;
    const bypassCache = !!(opts && opts.bypassCache);
    set({
      isSearching: true,
      lastQuery: query,
      searchMeta: null,
      statusMessage: bypassCache
        ? `Refreshing live prices for "${query}"…`
        : searchStartingMessage(),
      products: emptyProductBuckets(),
      serviceStatus: buildInitialServiceStatus('loading'),
    });

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      get().connect();
      setTimeout(() => get().search(query, opts), 3000);
      return;
    }
    ws.send(
      JSON.stringify({
        action: 'search',
        searchTerm: query,
        bypassCache,
      }),
    );
  },
}));

export default useSearchStore;
