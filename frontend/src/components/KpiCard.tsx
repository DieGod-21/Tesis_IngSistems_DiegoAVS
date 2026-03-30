/**
 * KpiCard.tsx
 *
 * Tarjeta KPI reutilizable del dashboard.
 * Renderiza valor, tendencia, descripción e icono.
 * Si `progressValue` existe, muestra una barra de progreso usando
 * una variable CSS `--kpi-progress` en lugar de inline style.
 */

import React from 'react';
import { resolveIcon } from '../utils/iconRegistry';
import type { KpiData } from '../services/dashboardService';

interface KpiCardProps {
    data: KpiData;
}

const KpiCard: React.FC<KpiCardProps> = ({ data }) => {
    const IconComponent = resolveIcon(data.iconName);


    return (
        <article className={`kpi-card kpi-card--${data.iconVariant}`}>
            <div className="kpi-card__top">
                <div className="kpi-card__meta">
                    <p className="kpi-card__label">{data.label}</p>
                    <h3 className="kpi-card__value">
                        {data.value}{' '}
                        <span
                            className={`kpi-card__trend${data.trendPositive ? ' kpi-card__trend--up' : ' kpi-card__trend--down'}`}
                        >
                            {data.trend}
                        </span>
                    </h3>
                </div>
                {IconComponent && (
                    <div className={`kpi-card__icon-box kpi-card__icon-box--${data.iconVariant}`}>
                        <IconComponent size={24} />
                    </div>
                )}
            </div>

            {data.progressValue !== undefined ? (
                /*
                 * La barra de progreso usa la variable CSS --kpi-progress
                 * para definir el ancho dinámicamente sin necesidad de una
                 * clase CSS por cada posible valor (0-100).
                 */
                <div
                    className="kpi-card__progress-track"
                    role="progressbar"
                    aria-valuenow={data.progressValue}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${data.label}: ${data.progressValue}%`}
                >
                    <div
                        className="kpi-card__progress-bar"
                        style={{ '--kpi-progress': `${data.progressValue}%` } as React.CSSProperties}
                    />
                </div>
            ) : (
                <p className="kpi-card__description">{data.description}</p>
            )}
        </article>
    );
};

export default KpiCard;
