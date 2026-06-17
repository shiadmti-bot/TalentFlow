export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api`;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Attach JWT token if it exists in localStorage
  const adminToken = localStorage.getItem("admin_token");
  const candidateToken = localStorage.getItem("candidate_token");
  const token = adminToken || candidateToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Don't set Content-Type if we're sending FormData (e.g. file upload)
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Session expired or unauthorized
    if (response.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_email");
      localStorage.removeItem("admin_nome");
      localStorage.removeItem("candidate_token");
      localStorage.removeItem("candidate_email");
      localStorage.removeItem("candidate_nome");
      // Only redirect if we are trying to access protected pages and not on login pages
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/login?expired=true";
      } else if (window.location.pathname.startsWith("/candidato")) {
        window.location.href = "/candidato/login?expired=true";
      }
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Erro na requisição à API");
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { method: "GET", ...options }),
    
  post: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      method: "POST", 
      body: body instanceof FormData ? body : JSON.stringify(body), 
      ...options 
    }),
    
  put: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      method: "PUT", 
      body: body instanceof FormData ? body : JSON.stringify(body), 
      ...options 
    }),
    
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      method: "PATCH", 
      body: body instanceof FormData ? body : JSON.stringify(body), 
      ...options 
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { method: "DELETE", ...options }),
};
export default api;
