import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';

/**
 * AppRouter.tsx
 *
 * Sistema central de rutas de la aplicación.
 *
 * DECISIÓN: Centralizar las rutas en un solo archivo facilita:
 *  1. Agregar nuevas rutas sin tocar App.tsx
 *  2. Aplicar guards de autenticación en un solo lugar
 *  3. Mantener la lógica de redirección separada de los componentes
 *
 * Rutas registradas:
 *  /login      → LoginPage (pública)
 *  /dashboard  → DashboardPage (protegida)
 *  /           → Redirige según estado de autenticación
 *
 * ProtectedRoute: Si el usuario no está autenticado, redirige a /login.
 * PublicRoute: Si el usuario YA está autenticado, redirige a /dashboard
 *              (evita que un usuario logueado vuelva al login).
 */

interface RouteGuardProps {
    children: React.ReactElement;
}

/**
 * ProtectedRoute
 * Bloquea el acceso a rutas privadas para usuarios no autenticados.
 */
const ProtectedRoute: React.FC<RouteGuardProps & { path: string; exact?: boolean }> = ({
    children,
    path,
    exact,
}) => {
    const { isAuthenticated } = useAuth();

    return (
        <Route
            path={path}
            exact={exact}
            render={() =>
                isAuthenticated ? children : <Redirect to="/login" />
            }
        />
    );
};

/**
 * PublicRoute
 * Redirige al dashboard si el usuario ya está autenticado.
 */
const PublicRoute: React.FC<RouteGuardProps & { path: string; exact?: boolean }> = ({
    children,
    path,
    exact,
}) => {
    const { isAuthenticated } = useAuth();

    return (
        <Route
            path={path}
            exact={exact}
            render={() =>
                isAuthenticated ? <Redirect to="/dashboard" /> : children
            }
        />
    );
};

/**
 * AppRouter
 * Componente raíz de rutas. Se coloca dentro de IonReactRouter en App.tsx.
 */
const AppRouter: React.FC = () => {
    return (
        <IonRouterOutlet>
            <Switch>
                {/* Ruta pública: Login */}
                <PublicRoute path="/login" exact>
                    <LoginPage />
                </PublicRoute>

                {/* Ruta protegida: Dashboard */}
                <ProtectedRoute path="/dashboard" exact>
                    <DashboardPage />
                </ProtectedRoute>

                {/* Ruta raíz: redirigir según autenticación */}
                <Route exact path="/">
                    <RootRedirect />
                </Route>

                {/* Cualquier otra ruta: redirigir a raíz */}
                <Route>
                    <Redirect to="/" />
                </Route>
            </Switch>
        </IonRouterOutlet>
    );
};

/**
 * RootRedirect
 * Componente auxiliar que decide la redirección desde "/" según auth.
 */
const RootRedirect: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return <Redirect to={isAuthenticated ? '/dashboard' : '/login'} />;
};

export default AppRouter;
