
export const redis = {
  async set(key: string, value: any, ttl?: number) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      console.warn("Redis credentials missing. Caching disabled.");
      return null;
    }

    try {
      const body = ttl 
        ? ["SET", key, JSON.stringify(value), "EX", ttl]
        : ["SET", key, JSON.stringify(value)];

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      return res.json();
    } catch (e) {
      console.error("Redis Set Error:", e);
      return null;
    }
  },

  async get(key: string) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) return null;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(["GET", key]),
      });
      const data = await res.json();
      if (data.result) {
        return JSON.parse(data.result);
      }
      return null;
    } catch (e) {
      console.error("Redis Get Error:", e);
      return null;
    }
  },

  async del(key: string) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) return null;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(["DEL", key]),
      });
      return res.json();
    } catch (e) {
      console.error("Redis Del Error:", e);
      return null;
    }
  }
};
