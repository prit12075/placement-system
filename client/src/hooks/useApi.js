import { useAuth } from '../context/AuthContext';

export function useApi() {
  const { token } = useAuth();

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  return {
    get: async (url) => {
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) throw await r.json();
      return r.json();
    },
    post: async (url, data) => {
      const r = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
      if (!r.ok) throw await r.json();
      return r.json();
    },
    put: async (url, data) => {
      const r = await fetch(url, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
      if (!r.ok) throw await r.json();
      return r.json();
    },
    del: async (url) => {
      const r = await fetch(url, { method: 'DELETE', headers: headers() });
      if (!r.ok) throw await r.json();
      return r.json();
    },
  };
}
