import { create } from 'zustand';
import useLocationStore from './useLocationStore';

let ws = null;
let reconnectTimer = null;

function defaultWsUrl() {
  if (typeof window === 'undefined') return 'ws://localhost:5000';
  const { protocol, host } = window.location;
  // If we're on 5173 (Vite), the backend is on 5000
  const wsHost = host.includes(':5173') ? host.replace(':5173', ':5000') : host;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${wsHost}`;
}

const useSearchStore = create((set, get) => ({
  isConnected: false,
  isSearching: false,
  statusMessage: 'Connecting to Warp Pool...',
  products: { blinkit: [] },
  categories: [],
  featuredProducts: [],
  lastQuery: '',

  connect: () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    
    const url = defaultWsUrl();
    console.log('[Nexus] Connecting to Warp Pool:', url);
    const socket = new WebSocket(url);
    ws = socket;

    socket.onopen = () => {
      set({ isConnected: true, statusMessage: 'Nexus Warp Ready' });
      get().fetchHomeContent();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.action === 'homeContent') {
          set({ categories: data.categories || [], featuredProducts: data.products || [] });
        }

        if (data.action === 'streamUpdate' && data.source === 'blinkit') {
          set((state) => ({
            products: { ...state.products, blinkit: data.products },
            statusMessage: 'Blinkit results loaded'
          }));
        }

        if (data.action === 'searchResults') {
          set({ isSearching: false, statusMessage: 'Search completed' });
        }
      } catch (err) {
        console.error('WS Parse Error:', err);
      }
    };

    socket.onclose = () => {
      set({ isConnected: false, statusMessage: 'Warp Pool Offline' });
      ws = null;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => get().connect(), 3000);
    };
  },

  search: (query) => {
    if (!query?.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    set({ 
      isSearching: true, 
      lastQuery: query, 
      products: { blinkit: [] },
      statusMessage: `Warping to Blinkit for "${query}"...` 
    });

    ws.send(JSON.stringify({ action: 'search', searchTerm: query }));
  },

  fetchHomeContent: () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'getHomeContent' }));
    }
  }
}));

export default useSearchStore;
