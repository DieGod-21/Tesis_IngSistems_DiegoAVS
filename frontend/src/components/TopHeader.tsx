/**
 * TopHeader.tsx
 *
 * Cabecera superior del Dashboard.
 * Contiene: buscador con debounce (300ms), campana con badge y perfil del usuario.
 * onSearch notifica al padre evitando llamadas excesivas al servicio/API.
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
                aria-label="Abrir menú"
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
                    aria-label="Buscar estudiante"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </div>

            {/* Acciones derechas */}
            <div className="dash-header__actions">
                {/* Campana */}
                <button className="dash-header__bell" aria-label="Notificaciones">
                    <Bell size={22} />
                    <span className="dash-header__bell-badge" aria-hidden="true" />
                </button>

                {/* Perfil */}
                <div className="dash-header__profile">
                    <div className="dash-header__profile-info">
                        <p className="dash-header__profile-name">
                            {user?.name ?? 'Dr. Ricardo Méndez'}
                        </p>
                        <p className="dash-header__profile-role">Coordinador de Tesis</p>
                    </div>
                    <div className="dash-header__avatar" aria-hidden="true">
                        {(user?.name ?? 'RM')
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
