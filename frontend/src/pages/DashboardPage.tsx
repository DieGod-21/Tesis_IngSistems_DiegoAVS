/**
 * DashboardPage.tsx
 *
 * Panel de Control PG1-PG2.
 * Usa AppShell para el layout (Sidebar + TopHeader) sin duplicar código.
 * Gestiona los estados async del dashboard: loading/error/success.
 * El botón "Nuevo Registro" navega a /students/new.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';

import AppShell from '../layout/AppShell';
import KpiCard from '../components/KpiCard';
import PendingActionsTable from '../components/PendingActionsTable';
import UpcomingDeadlines from '../components/UpcomingDeadlines';
import FacultyResources from '../components/FacultyResources';

import {
    getDashboardSummary,
    getPendingActions,
} from '../services/dashboardService';
import type {
    DashboardSummary,
    PendingAction,
} from '../services/dashboardService';

import '../styles/dashboard.css';

// ─── Skeleton Components ────────────────────────────────────────────

const KpiSkeleton: React.FC = () => (
    <div className="dash-kpi-grid" aria-busy="true" aria-label="Cargando KPIs">
        {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kpi-card kpi-skeleton">
                <div className="skeleton skeleton--line skeleton--short" />
                <div className="skeleton skeleton--line skeleton--large" />
                <div className="skeleton skeleton--line skeleton--medium" />
            </div>
        ))}
    </div>
);

const TableSkeleton: React.FC = () => (
    <div className="dash-table-card" aria-busy="true" aria-label="Cargando acciones">
        <div className="dash-table-card__header">
            <div className="skeleton skeleton--line skeleton--medium" />
        </div>
        <div className="dash-skeleton-rows">
            {[0, 1, 2].map((i) => (
                <div key={i} className="dash-skeleton-row">
                    <div className="skeleton skeleton--circle" />
                    <div className="dash-skeleton-row__lines">
                        <div className="skeleton skeleton--line skeleton--medium" />
                        <div className="skeleton skeleton--line skeleton--short" />
                    </div>
                    <div className="skeleton skeleton--line skeleton--medium" />
                    <div className="skeleton skeleton--line skeleton--short" />
                </div>
            ))}
        </div>
    </div>
);

// ─── Estado ─────────────────────────────────────────────────────────

type SummaryState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; data: DashboardSummary };

type TableState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; data: PendingAction[] };

// ─── Componente ─────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
    const history = useHistory();
    const [summary, setSummary] = useState<SummaryState>({ status: 'idle' });
    const [tableState, setTableState] = useState<TableState>({ status: 'loading' });
    const [searchQuery, setSearchQuery] = useState('');

    // ── Cargar resumen ───────────────────────────────────────────────
    const loadSummary = useCallback(async () => {
        setSummary({ status: 'loading' });
        try {
            const data = await getDashboardSummary();
            setSummary({ status: 'success', data });
        } catch (err) {
            setSummary({ status: 'error', message: err instanceof Error ? err.message : 'Error desconocido' });
        }
    }, []);

    // ── Cargar tabla ─────────────────────────────────────────────────
    const loadActions = useCallback(async (query: string) => {
        setTableState({ status: 'loading' });
        try {
            const data = await getPendingActions(query);
            setTableState({ status: 'success', data });
        } catch (err) {
            setTableState({ status: 'error', message: err instanceof Error ? err.message : 'Error al cargar acciones' });
        }
    }, []);

    useEffect(() => { loadSummary(); }, [loadSummary]);
    useEffect(() => { loadActions(searchQuery); }, [searchQuery, loadActions]);

    const handleSearch = useCallback((query: string) => setSearchQuery(query), []);

    // ─── Render ──────────────────────────────────────────────────────

    return (
        <AppShell onSearch={handleSearch}>
            <div className="dash-body">
                {/* Título */}
                <div className="dash-page-header">
                    <div>
                        <h2 className="dash-page-title">Panel de Control PG1-PG2</h2>
                        <p className="dash-page-subtitle">
                            Seguimiento de trabajos de graduación de la Facultad de Ingeniería
                        </p>
                    </div>
                    <button
                        className="dash-btn-primary"
                        onClick={() => history.push('/students/new')}
                    >
                        <Plus size={18} />
                        Nuevo Registro
                    </button>
                </div>

                {/* KPIs */}
                {summary.status === 'loading' || summary.status === 'idle' ? (
                    <KpiSkeleton />
                ) : summary.status === 'error' ? (
                    <div className="dash-error-block">
                        <AlertCircle size={20} className="dash-error-block__icon" />
                        <p className="dash-error-block__msg">{summary.message}</p>
                        <button className="dash-error-block__btn" onClick={loadSummary}>
                            <RefreshCw size={14} />
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <div className="dash-kpi-grid">
                        {summary.data.kpis.map((kpi) => (
                            <KpiCard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                )}

                {/* Contenido principal */}
                <div className="dash-content-grid">
                    {/* Tabla */}
                    {tableState.status === 'loading' ? (
                        <TableSkeleton />
                    ) : tableState.status === 'error' ? (
                        <div className="dash-error-block">
                            <AlertCircle size={20} className="dash-error-block__icon" />
                            <p className="dash-error-block__msg">{tableState.message}</p>
                            <button
                                className="dash-error-block__btn"
                                onClick={() => loadActions(searchQuery)}
                            >
                                <RefreshCw size={14} />
                                Reintentar
                            </button>
                        </div>
                    ) : tableState.data.length === 0 ? (
                        <div className="dash-empty-block">
                            <p className="dash-empty-block__msg">
                                No se encontraron resultados para <strong>"{searchQuery}"</strong>.
                            </p>
                        </div>
                    ) : (
                        <PendingActionsTable actions={tableState.data} />
                    )}

                    {/* Panel lateral */}
                    {summary.status === 'success' && (
                        <aside className="dash-sidebar-right">
                            <UpcomingDeadlines deadlines={summary.data.deadlines} />
                            <FacultyResources resources={summary.data.resources} />
                        </aside>
                    )}

                    {(summary.status === 'loading' || summary.status === 'idle') && (
                        <aside className="dash-sidebar-right">
                            <div className="dash-deadlines">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="dash-skeleton-row">
                                        <div className="skeleton skeleton--box" />
                                        <div className="dash-skeleton-row__lines">
                                            <div className="skeleton skeleton--line skeleton--medium" />
                                            <div className="skeleton skeleton--line skeleton--short" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </AppShell>
    );
};

export default DashboardPage;
