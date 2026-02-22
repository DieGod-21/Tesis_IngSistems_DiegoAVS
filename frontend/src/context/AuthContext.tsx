import React, { createContext, useContext, useState, useCallback } from 'react';
import * as authService from '../services/authService';
import type { User } from '../services/authService';

/**
 * AuthContext.tsx
 *
 * Contexto global de autenticación.
 *
 * DECISIÓN: Usar React Context en lugar de Redux o Zustand
 * porque el estado de autenticación es simple (user, isAuthenticated)
 * y no requiere normalización ni selectores complejos.
 *
 * El contexto expone:
 *  - user: datos del usuario autenticado (o null)
 *  - isAuthenticated: booleano derivado de user
 *  - loading: indica si hay una operación asíncrona en curso
 *  - error: mensaje de error del último intento de login
 *  - login(): llama a authService y actualiza el estado
 *  - logout(): limpia el estado
 */

interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// Valor por defecto seguro (nunca undefined en componentes hijos)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * AuthProvider
 * Envuelve la aplicación y provee el estado de autenticación a todos los hijos.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * login: Delega en authService y actualiza el estado.
     * useCallback evita recrear la función en cada render.
     */
    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const loggedUser = await authService.login(email, password);
            setUser(loggedUser);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * logout: Limpia el estado local y llama al servicio.
     */
    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const value: AuthContextValue = {
        user,
        isAuthenticated: user !== null,
        loading,
        error,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth
 * Hook personalizado que encapsula el acceso al contexto.
 * Lanza un error si se usa fuera de AuthProvider (falla rápido → más fácil de depurar).
 */
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
    }
    return context;
};

export default AuthContext;
