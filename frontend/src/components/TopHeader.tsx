/**
 * TopHeader.tsx
 *
 * Cabecera superior de las páginas autenticadas.
 * Contiene: buscador con debounce (300ms), campana-placeholder y perfil del usuario.
 *
 * CAMPANA: Marcada como placeholder elegante hasta que exista backend de notificaciones.
 *   - Muestra tooltip "Próximamente: Notificaciones académicas"
 *   - No tiene badge (no hay datos reales)
 *   - Estructura preparada para futuro módulo:
 *       · Agendar revisión de tesis
 *       · Generar recordatorio por correo institucional
 *
 * TODO: Integrar servicio de notificaciones por correo institucional
 * TODO: Conectar con agenda académica (revisiones, defensas, plazos)
 */

import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface TopHeaderProps {
    onMenuToggle?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuToggle }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const history = useHistory();
    const location = useLocation();
    const [inputValue, setInputValue] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef    = useRef<HTMLInputElement>(null);

    // Pre-populate from URL when landing on /students and restore focus
    useEffect(() => {
        if (location.pathname === '/students') {
            const params = new URLSearchParams(location.search);
            const q = params.get('q') ?? '';
            setInputValue(q);
            if (q) setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setInputValue('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const q = inputValue.trim();
            if (location.pathname === '/students') {
                const current = new URLSearchParams(window.location.search).get('q') ?? '';
                if (q === current) return;
                const params = new URLSearchParams(window.location.search);
                if (q) { params.set('q', q); } else { params.delete('q'); }
                history.replace(`/students?${params.toString()}`);
            } else if (q.length >= 2) {
                history.push(`/students?q=${encodeURIComponent(q)}`);
            }
        }, 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue]);

    return (
        <header className="dash-header">
            {/* Botón hamburguesa (solo móvil) */}
            <button
                className="dash-header__menu-btn"
                onClick={onMenuToggle}
                aria-label="Abrir menú de navegación"
            >
                <Menu size={24} />
            </button>

            {/* Buscador */}
            <div className="dash-header__search-wrapper">
                <Search size={16} className="dash-header__search-icon" aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="text"
                    className="dash-header__search"
                    placeholder="Buscar por Carné o Nombre de Estudiante…"
                    aria-label="Buscar estudiante por nombre o carné"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </div>

            {/* Acciones derechas */}
            <div className="dash-header__actions">
                {/*
                 * ── CAMPANA PLACEHOLDER ─────────────────────────────────────────
                 * Sin backend activo, se muestra como placeholder accesible.
                 * El tooltip informa al usuario del estado del módulo.
                 *
                 * Para activar notificaciones reales:
                 *   1. Implementar GET /api/notifications (count, list)
                 *   2. Conectar useNotifications() hook aquí
                 *   3. Mostrar badge con count real
                 *   4. Abrir panel lateral o modal con lista
                 *
                 * TODO: Integrar servicio de notificaciones académicas
                 * TODO: Agregar WebSocket para notificaciones en tiempo real
                 */}
                {/* Toggle de tema claro/oscuro */}
                <button
                    className="dash-header__theme-toggle"
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                    type="button"
                >
                    {theme === 'dark'
                        ? <Sun size={20} aria-hidden="true" />
                        : <Moon size={20} aria-hidden="true" />
                    }
                </button>

                <div className="dash-header__bell-wrapper" title="Próximamente: Notificaciones académicas">
                    <button
                        className="dash-header__bell dash-header__bell--placeholder"
                        aria-label="Notificaciones académicas — Módulo próximamente disponible"
                        aria-disabled="true"
                        tabIndex={-1}
                        type="button"
                    >
                        <Bell size={22} aria-hidden="true" />
                    </button>
                </div>

                {/* Perfil */}
                <div className="dash-header__profile">
                    <div className="dash-header__profile-info">
                        <p className="dash-header__profile-name">
                            {user?.name ?? 'Coordinador'}
                        </p>
                        <p className="dash-header__profile-role">Coordinación de PG</p>
                    </div>
                    <div className="dash-header__avatar" aria-hidden="true">
                        {(user?.name ?? 'CO')
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
