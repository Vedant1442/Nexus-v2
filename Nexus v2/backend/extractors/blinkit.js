module.exports = {
  name: "blinkit",
  url: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  match: (url) => url.includes("blinkit.com/v") && url.includes("/search"),
  extract: (json) => {
    const snippets = json?.response?.snippets || [];
    return snippets
      .filter(s => s.data?.name?.text)
      .map(s => {
        const p = s.data;
        const price = p.price || (p.normal_price?.text ? parseInt(p.normal_price.text.replace(/[^0-9]/g, '')) : 0);
        const mrp = p.mrp?.text ? parseInt(p.mrp.text.replace(/[^0-9]/g, '')) : price;
        return {
          id: p.identity?.id || `b-${Math.random()}`,
          name: p.name.text,
          price: price,
          originalPrice: mrp > price ? mrp : null,
          quantity: p.variant?.text || "",
          imageUrl: p.image?.url || "",
          deliveryTime: p.eta_tag?.title?.text || "8m",
          source: 'blinkit'
        };
      });
  }
};
