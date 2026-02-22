/**
 * Sidebar.tsx
 *
 * Barra lateral de navegación del Dashboard.
 * Detecta la ruta activa con `useLocation` (react-router-dom).
 * Iconos: lucide-react.
 * En móvil se muestra/oculta vía clase CSS según prop `open`.
 */

import React from 'react';
import {
    LayoutDashboard,
    UserPlus,
    Users,
    Briefcase,
    Calendar,
    Settings,
    LogOut,
} from 'lucide-react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import umgLogo from '../assets/umg_logo.png';

interface SidebarProps {
    open?: boolean;
    onClose?: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ open = false, onClose }) => {
    const { logout } = useAuth();
    const history = useHistory();
    const { pathname } = useLocation();

    const handleLogout = async () => {
        await logout();
        history.push('/login');
    };

    const navItems: NavItem[] = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutDashboard size={20} />,
        },
        {
            label: 'Nuevo Registro',
            href: '/students/new',
            icon: <UserPlus size={20} />,
        },
        {
            label: 'Estudiantes',
            href: '/students',
            icon: <Users size={20} />,
        },
        {
            label: 'Proyectos',
            href: '/projects',
            icon: <Briefcase size={20} />,
        },
        {
            label: 'Calendario',
            href: '/calendar',
            icon: <Calendar size={20} />,
        },
    ];

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <>
            {/* Overlay móvil */}
            {open && (
                <div
                    className="dash-sidebar-overlay"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside className={`dash-sidebar${open ? ' dash-sidebar--open' : ''}`}>
                {/* Logo y nombre */}
                <div className="dash-sidebar__brand">
                    <div className="dash-sidebar__logo-box">
                        <img src={umgLogo} alt="Logo UMG" className="dash-sidebar__logo" />
                    </div>
                    <div>
                        <p className="dash-sidebar__brand-name">UMG</p>
                        <p className="dash-sidebar__brand-sub">Facultad de Ingeniería</p>
                    </div>
                </div>

                {/* Navegación principal */}
                <nav className="dash-sidebar__nav" aria-label="Navegación principal">
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`dash-sidebar__nav-item${isActive(item.href) ? ' dash-sidebar__nav-item--active' : ''
                                }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </a>
                    ))}
                </nav>

                {/* Acciones inferiores */}
                <div className="dash-sidebar__footer">
                    <a
                        href="/settings"
                        className={`dash-sidebar__nav-item${isActive('/settings') ? ' dash-sidebar__nav-item--active' : ''
                            }`}
                    >
                        <Settings size={20} />
                        <span>Configuración</span>
                    </a>
                    <button
                        className="dash-sidebar__nav-item dash-sidebar__logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
