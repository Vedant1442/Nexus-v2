const axios = require('axios');

class BlinkitAPI {
    constructor() {
        this.baseUrl = 'https://blinkit.com/v1';
        this.headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'app_client': '1',
            'app_instance_id': '8665f97b-4d44-4860-9567-c6b753a99252', // Static fallback
            'device_id': '8665f97b-4d44-4860-9567-c6b753a99252',
            'origin': 'https://blinkit.com',
            'referer': 'https://blinkit.com/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        };
    }

    async search(query, lat = 19.076, lon = 72.877) {
        try {
            console.log(`[API] Searching Blinkit for: "${query}"`);
            const response = await axios.get(`${this.baseUrl}/search/search_product/`, {
                params: {
                    q: query,
                    size: 20,
                    lat: lat,
                    lon: lon
                },
                headers: this.headers
            });

            return this.transformProducts(response.data);
        } catch (error) {
            console.error('[API] Search Error:', error.response?.status || error.message);
            return [];
        }
    }

    async getLayout(lat = 19.076, lon = 72.877) {
        try {
            console.log(`[API] Fetching Blinkit Layout for ${lat}, ${lon}`);
            const response = await axios.get(`${this.baseUrl}/layout/home/`, {
                params: {
                    lat: lat,
                    lon: lon
                },
                headers: this.headers
            });

            return this.extractCategories(response.data);
        } catch (error) {
            console.error('[API] Layout Error:', error.response?.status || error.message);
            return [];
        }
    }

    extractCategories(data) {
        const categories = [];
        const widgets = data?.response?.widgets || [];
        
        widgets.forEach(widget => {
            if (widget.type === 'category_grid' || widget.data?.items) {
                const items = widget.data.items || [];
                items.forEach(item => {
                    if (item.name && item.image_url) {
                        categories.push({
                            id: item.id || item.action?.data?.category_id,
                            name: item.name,
                            image: item.image_url,
                            action: item.action
                        });
                    }
                });
            }
        });

        // Unique by name
        return Array.from(new Map(categories.map(item => [item.name, item])).values());
    }

    transformProducts(data) {
        const products = [];
        const snippets = data?.response?.snippets || [];
        
        snippets.forEach(s => {
            if (s.data?.name?.text) {
                const p = s.data;
                const price = p.price || (p.normal_price?.text ? parseInt(p.normal_price.text.replace(/[^0-9]/g, '')) : 0);
                const mrp = p.mrp?.text ? parseInt(p.mrp.text.replace(/[^0-9]/g, '')) : price;
                
                products.push({
                    id: p.identity?.id || `b-${Math.random()}`,
                    name: p.name.text,
                    price: price,
                    mrp: mrp > price ? mrp : price,
                    discount: p.discount_percentage || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0),
                    quantity: p.variant?.text || p.unit || "",
                    image: p.image?.url || "",
                    deliveryTime: p.eta_tag?.title?.text || "8m",
                    productUrl: `https://blinkit.com/prn/${p.name.text.toLowerCase().replace(/ /g, '-')}/prid/${p.identity?.id}`,
                    source: 'blinkit'
                });
            }
        });

        return products;
    }
}

module.exports = new BlinkitAPI();
