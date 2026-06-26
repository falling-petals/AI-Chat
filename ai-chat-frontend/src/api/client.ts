const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data;
}

export default request;
