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
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopHeaderProps {
    onMenuToggle?: () => void;
    onSearch?: (query: string) => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuToggle, onSearch }) => {
    const { user } = useAuth();
    const [inputValue, setInputValue] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!onSearch) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onSearch(inputValue);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [inputValue, onSearch]);

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
