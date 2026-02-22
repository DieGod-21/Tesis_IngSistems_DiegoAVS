/**
 * authService.ts
 *
 * Capa de servicio para autenticación.
 * Persiste la sesión en localStorage para que sobreviva recargas.
 *
 * Claves de localStorage:
 *   auth_token → token de sesión (opaco / JWT en producción)
 *   auth_user  → JSON del objeto User
 *
 * Para conectar al API real: reemplazar las funciones mock con fetch/axios,
 * manteniendo la misma firma. El AuthContext NO cambia.
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ─── Mock ────────────────────────────────────────────────────────────

const MOCK_CREDENTIALS = { email: 'admin@demo.com', password: '123456' };
const MOCK_USER: User = { id: '1', email: 'admin@demo.com', name: 'Administrador Demo', role: 'admin' };
const MOCK_TOKEN = 'mock-jwt-token-abc123';

// ─── Persistencia ───────────────────────────────────────────────────

/** Lee la sesión guardada en localStorage. Retorna null si no existe o está corrupta. */
export function readPersistedSession(): { user: User; token: string } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (!token || !raw) return null;
    const user = JSON.parse(raw) as User;
    return { user, token };
  } catch {
    // JSON corrupto → limpiar
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function persistSession(user: User, token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── API pública ────────────────────────────────────────────────────

/**
 * Autentica al usuario y persiste la sesión.
 * TODO: reemplazar con → fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
 */
export const login = async (email: string, password: string): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
    persistSession(MOCK_USER, MOCK_TOKEN);
    return MOCK_USER;
  }

  throw new Error('Credenciales incorrectas. Verifique su correo y contraseña.');
};

/**
 * Cierra sesión y limpia el localStorage.
 * TODO: reemplazar con → fetch('/api/auth/logout', { method: 'POST' })
 */
export const logout = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  clearSession();
};

/**
 * Verifica si un token sigue siendo válido en el servidor.
 * TODO: reemplazar con → fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
 * Por ahora devuelve siempre true si existe el token (mock).
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  // En producción: llamar al endpoint de verificación
  return token === MOCK_TOKEN;
};
