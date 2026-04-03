/**
 * ApprovalToggle.tsx
 *
 * Toggle de aprobación estilo iOS / "Liquid Glass".
 * - Role: switch (aria-checked)
 * - Teclado: Space / Enter para activar
 * - Foco: anillo visible solo con teclado (focus-visible)
 * - Sin librerías de animación — CSS puro (approval-toggle.css)
 */

import React, { useCallback, useId } from 'react';
import '../../styles/approval-toggle.css';

export interface ApprovalToggleProps {
    /** Estado actual del toggle */
    checked: boolean;
    /** Callback al cambiar */
    onChange: (next: boolean) => void;
    /** Deshabilitar interacción completamente */
    disabled?: boolean;
    /**
     * Indica que hay una operación en vuelo (optimistic update confirmándose).
     * Muestra spinner pero NO bloquea la UI — el estado optimista ya se aplicó.
     */
    loading?: boolean;
    /** Texto opcional a la derecha del toggle */
    label?: string;
}

const ApprovalToggle: React.FC<ApprovalToggleProps> = ({
    checked,
    onChange,
    disabled = false,
    loading = false,
    label,
}) => {
    const id = useId();

    const toggle = useCallback(() => {
        if (!disabled) onChange(!checked);
    }, [checked, disabled, onChange]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggle();
            }
        },
        [toggle],
    );

    const rootClass = [
        'at-root',
        loading ? 'at-root--loading' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            id={id}
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            aria-busy={loading}
            aria-label={label ?? (checked ? 'Aprobado' : 'Pendiente')}
            tabIndex={disabled ? -1 : 0}
            data-checked={String(checked)}
            className={rootClass}
            onClick={toggle}
            onKeyDown={handleKeyDown}
        >
            <div className="at-track" aria-hidden="true">
                <div className="at-thumb" />
                {loading && <span className="at-spinner" aria-hidden="true" />}
            </div>
            {label && <span className="at-label">{label}</span>}
        </div>
    );
};

export default ApprovalToggle;
