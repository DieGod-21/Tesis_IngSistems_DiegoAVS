/**
 * authService.ts
 *
 * Capa de servicio para autenticación.
 * Centraliza toda la lógica de comunicación con la API.
 * En esta etapa simula una llamada real con un delay de 800ms.
 *
 * DECISIÓN: Separar el servicio del contexto permite cambiar
 * la implementación (mock → API real) sin tocar los componentes.
 */

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

// Credenciales de prueba para el mock
const MOCK_CREDENTIALS = {
  email: 'admin@demo.com',
  password: '123456',
};

// Usuario de respuesta simulada
const MOCK_USER: User = {
  id: '1',
  email: 'admin@demo.com',
  name: 'Administrador Demo',
  role: 'admin',
};

/**
 * Simula una llamada a la API de autenticación.
 * @param email - Correo institucional
 * @param password - Contraseña
 * @returns Promise<User> con los datos del usuario autenticado
 * @throws Error si las credenciales no son válidas
 */
export const login = async (email: string, password: string): Promise<User> => {
  // Simulamos latencia de red (800ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
    return MOCK_USER;
  }

  throw new Error('Credenciales incorrectas. Verifique su correo y contraseña.');
};

/**
 * Simula el cierre de sesión.
 * Con una API real, aquí se invalidaría el token en el servidor.
 */
export const logout = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  // Limpieza futura: remover token de localStorage, etc.
};
