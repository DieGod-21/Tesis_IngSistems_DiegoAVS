/**
 * DashboardPage.tsx
 *
 * Inicio — Panel de Control PG1-PG2
 * Sistema de Gestión de Proyectos de Graduación
 * Facultad de Ingeniería en Sistemas de Información
 * Universidad Mariano Gálvez de Guatemala
 *
 * Datos en tiempo real desde localStorage (sin backend).
 * Conectar al API institucional: ver TODO comments en dashboardService.ts.
 *
 * TODO: Integrar API de eventos académicos del calendario semestral
 * TODO: Integrar servicio de notificaciones por correo institucional
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    Plus, Users, CheckCircle2, Clock, Upload,
    AlertCircle, RefreshCw, ArrowRight, GraduationCap,
} from 'lucide-react';

import AppShell from '../layout/AppShell';
import AppFooter from '../components/AppFooter';
import KpiCard from '../components/KpiCard';
import PendingActionsTable from '../components/PendingActionsTable';
import UpcomingDeadlines from '../components/UpcomingDeadlines';
import FacultyResources from '../components/FacultyResources';
import StatusBadge from '../components/students/StatusBadge';

import { getDashboardSummary, getPendingActions } from '../services/dashboardService';
import type { DashboardSummary, PendingAction } from '../services/dashboardService';
import { getRecentStudents, computeStudentKpis, getStudents } from '../types/student';
import type { Student } from '../types/student';

import '../styles/dashboard.css';
import '../styles/students-list.css';   // sl-badge, sl-avatar reutilizados

// ─── Año actual dinámico ─────────────────────────────────────────────
const currentYear = new Date().getFullYear();

// ─── Estados ─────────────────────────────────────────────────────────

type SummaryState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; data: DashboardSummary };

type TableState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; data: PendingAction[] };

// ─── Skeletons ───────────────────────────────────────────────────────

const KpiSkeleton: React.FC = () => (
    <div className="dash-kpi-grid" aria-busy="true" aria-label="Cargando indicadores…">
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
    <div className="dash-table-card" aria-busy="true" aria-label="Cargando expedientes…">
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

// ─── Helpers ─────────────────────────────────────────────────────────

function initials(name: string): string {
    return name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
}

// ─── Componente Principal ─────────────────────────────────────────────

const DashboardPage: React.FC = () => {
    const history = useHistory();

    // Datos dashboard service (mock / futuro API)
    const [summary, setSummary] = useState<SummaryState>({ status: 'idle' });
    const [tableState, setTableState] = useState<TableState>({ status: 'loading' });
    const [searchQuery, setSearchQuery] = useState('');

    // Datos de estudiantes desde localStorage
    const [students, setStudents] = useState<Student[]>([]);
    const [recentStudents, setRecentStudents] = useState<Student[]>([]);

    // Filtro rápido del panel de inicio
    const [dashStudentQuery, setDashStudentQuery] = useState('');
    const [dashStatusFilter, setDashStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

    // ── Carga inicial ───────────────────────────────────────────────

    const loadSummary = useCallback(async () => {
        setSummary({ status: 'loading' });
        try {
            const data = await getDashboardSummary();
            setSummary({ status: 'success', data });
        } catch (err) {
            setSummary({ status: 'error', message: err instanceof Error ? err.message : 'Error al cargar datos' });
        }
    }, []);

    const loadActions = useCallback(async (query: string) => {
        setTableState({ status: 'loading' });
        try {
            const data = await getPendingActions(query);
            setTableState({ status: 'success', data });
        } catch (err) {
            setTableState({ status: 'error', message: err instanceof Error ? err.message : 'Error al cargar expedientes' });
        }
    }, []);

    useEffect(() => { loadSummary(); }, [loadSummary]);
    useEffect(() => { loadActions(searchQuery); }, [searchQuery, loadActions]);

    useEffect(() => {
        const all = getStudents();
        setStudents(all);
        setRecentStudents(getRecentStudents(5));
    }, []);

    const handleSearch = useCallback((q: string) => setSearchQuery(q), []);

    // ── KPIs de estudiantes ─────────────────────────────────────────

    const studentKpis = useMemo(() => computeStudentKpis(students), [students]);

    // ── Filtro rápido de actividad reciente ─────────────────────────

    const filteredRecent = useMemo(() => {
        const q = dashStudentQuery.trim().toLowerCase();
        return recentStudents.filter((s) => {
            const matchText = !q ||
                s.nombreCompleto.toLowerCase().includes(q) ||
                s.carnetId.toLowerCase().includes(q);
            const matchStatus =
                dashStatusFilter === 'all' ||
                (dashStatusFilter === 'approved' && s.approved) ||
                (dashStatusFilter === 'pending' && !s.approved);
            return matchText && matchStatus;
        });
    }, [recentStudents, dashStudentQuery, dashStatusFilter]);

    // ── Render ──────────────────────────────────────────────────────

    return (
        <AppShell onSearch={handleSearch}>
            <div className="dash-body">

                {/* ── Encabezado institucional ─────────────────── */}
                <div className="dash-page-header">
                    <div>
                        <h1 className="dash-page-title">Inicio — Panel de Control PG1-PG2</h1>
                        <p className="dash-page-subtitle">
                            Seguimiento de Proyectos de Graduación · Facultad de Ingeniería · Ciclo {currentYear}
                        </p>
                    </div>
                    <button
                        className="dash-btn-primary"
                        onClick={() => history.push('/students/new')}
                        aria-label="Registrar nuevo estudiante de proyecto de graduación"
                    >
                        <Plus size={18} aria-hidden="true" />
                        Registrar Estudiante
                    </button>
                </div>

                {/* ── Indicadores de Gestión (KPI Cards del servicio) ── */}
                {(summary.status === 'loading' || summary.status === 'idle') && <KpiSkeleton />}
                {summary.status === 'error' && (
                    <div className="dash-error-block" role="alert">
                        <AlertCircle size={20} className="dash-error-block__icon" aria-hidden="true" />
                        <p className="dash-error-block__msg">{summary.message}</p>
                        <button className="dash-error-block__btn" onClick={loadSummary}>
                            <RefreshCw size={14} aria-hidden="true" /> Reintentar
                        </button>
                    </div>
                )}
                {summary.status === 'success' && (
                    <section aria-label="Indicadores de gestión académica">
                        <div className="dash-kpi-grid">
                            {summary.data.kpis.map((kpi) => (
                                <KpiCard key={kpi.id} data={kpi} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Resumen de Estudiantes + Gestión Académica ── */}
                <div className="dash-quick-row">

                    {/* Resumen de estudiantes registrados (localStorage) */}
                    <section className="dash-student-kpis" aria-label="Resumen de estudiantes registrados">
                        <h2 className="dash-section-title">Estudiantes Registrados en el Sistema</h2>
                        <div className="dash-student-kpi-grid">
                            <div className="dash-skpi dash-skpi--total">
                                <GraduationCap size={18} className="dash-skpi__icon" aria-hidden="true" />
                                <div>
                                    <p className="dash-skpi__value">{studentKpis.total}</p>
                                    <p className="dash-skpi__label">Total de Expedientes</p>
                                </div>
                            </div>
                            <div className="dash-skpi dash-skpi--approved">
                                <CheckCircle2 size={18} className="dash-skpi__icon" aria-hidden="true" />
                                <div>
                                    <p className="dash-skpi__value">{studentKpis.approved}</p>
                                    <p className="dash-skpi__label">Con Aprobación</p>
                                </div>
                            </div>
                            <div className="dash-skpi dash-skpi--pending">
                                <Clock size={18} className="dash-skpi__icon" aria-hidden="true" />
                                <div>
                                    <p className="dash-skpi__value">{studentKpis.pending}</p>
                                    <p className="dash-skpi__label">Pendientes de Revisión</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Gestión Académica — acciones de acceso rápido */}
                    <section className="dash-quick-actions" aria-label="Gestión académica — accesos directos">
                        <h2 className="dash-section-title">Gestión Académica</h2>
                        <div className="dash-qa-grid">
                            <button
                                className="dash-qa-card"
                                onClick={() => history.push('/students/new')}
                                aria-label="Registrar nuevo estudiante de proyecto de graduación"
                            >
                                <Plus size={22} className="dash-qa-card__icon" aria-hidden="true" />
                                <span className="dash-qa-card__label">Registrar Estudiante</span>
                                <ArrowRight size={14} className="dash-qa-card__arrow" aria-hidden="true" />
                            </button>
                            <button
                                className="dash-qa-card"
                                onClick={() => history.push('/students')}
                                aria-label="Ver listado completo de estudiantes"
                            >
                                <Users size={22} className="dash-qa-card__icon" aria-hidden="true" />
                                <span className="dash-qa-card__label">Listado de Estudiantes</span>
                                <ArrowRight size={14} className="dash-qa-card__arrow" aria-hidden="true" />
                            </button>
                            <button
                                className="dash-qa-card"
                                onClick={() => history.push('/students/new')}
                                aria-label="Importar listado de estudiantes desde archivo"
                            >
                                <Upload size={22} className="dash-qa-card__icon" aria-hidden="true" />
                                <span className="dash-qa-card__label">Importar Listado Académico</span>
                                <ArrowRight size={14} className="dash-qa-card__arrow" aria-hidden="true" />
                            </button>
                        </div>
                    </section>
                </div>

                {/* ── Expedientes con Acciones Pendientes + Panel lateral ── */}
                <div className="dash-content-grid">
                    {tableState.status === 'loading' ? (
                        <TableSkeleton />
                    ) : tableState.status === 'error' ? (
                        <div className="dash-error-block" role="alert">
                            <AlertCircle size={20} className="dash-error-block__icon" aria-hidden="true" />
                            <p className="dash-error-block__msg">{tableState.message}</p>
                            <button className="dash-error-block__btn"
                                onClick={() => loadActions(searchQuery)}>
                                <RefreshCw size={14} aria-hidden="true" /> Reintentar
                            </button>
                        </div>
                    ) : tableState.data.length === 0 ? (
                        <div className="dash-empty-block" role="status">
                            <p className="dash-empty-block__msg">
                                {searchQuery
                                    ? <>Sin expedientes para <strong>"{searchQuery}"</strong></>
                                    : 'No hay expedientes con acciones pendientes en este momento.'}
                            </p>
                        </div>
                    ) : (
                        <PendingActionsTable actions={tableState.data} />
                    )}

                    {/* Panel derecho */}
                    <aside className="dash-sidebar-right" aria-label="Panel de actividad académica">

                        {/* ── Actividad Reciente con filtro rápido ─── */}
                        <div className="dash-recent-card">
                            <div className="dash-recent-card__header">
                                <p className="dash-section-title">Actividad Reciente</p>
                                <button
                                    className="dash-recent-card__link"
                                    onClick={() => history.push('/students')}
                                    aria-label="Ver listado completo de estudiantes"
                                >
                                    Ver todos
                                </button>
                            </div>
                            {/* Filtro rápido */}
                            <div className="dash-recent-filter">
                                <input
                                    type="text"
                                    className="dash-recent-filter__input"
                                    placeholder="Buscar estudiante…"
                                    value={dashStudentQuery}
                                    onChange={(e) => setDashStudentQuery(e.target.value)}
                                    aria-label="Filtrar actividad reciente por nombre o carné"
                                />
                                <div className="dash-recent-filter__tabs" role="group" aria-label="Filtrar por estado">
                                    {(['all', 'approved', 'pending'] as const).map((v) => (
                                        <button
                                            key={v}
                                            className={`dash-recent-filter__tab${dashStatusFilter === v ? ' dash-recent-filter__tab--active' : ''}`}
                                            onClick={() => setDashStatusFilter(v)}
                                            aria-pressed={dashStatusFilter === v}
                                            title={v === 'all' ? 'Todos' : v === 'approved' ? 'Aprobados' : 'Pendientes'}
                                        >
                                            {v === 'all' ? 'Todos' : v === 'approved' ? '✓' : '○'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Lista */}
                            <ul className="dash-recent-list" aria-label="Estudiantes con actividad reciente">
                                {filteredRecent.length === 0 && (
                                    <li className="dash-recent-list__empty" role="status">
                                        Sin registros que coincidan con el filtro
                                    </li>
                                )}
                                {filteredRecent.map((s) => (
                                    <li key={s.id} className="dash-recent-item">
                                        <div className="sl-avatar sl-avatar--sm" aria-hidden="true">
                                            {initials(s.nombreCompleto)}
                                        </div>
                                        <div className="dash-recent-item__info">
                                            <p className="dash-recent-item__name">{s.nombreCompleto}</p>
                                            <p className="dash-recent-item__carnet">{s.carnetId} · {s.faseAcademica}</p>
                                        </div>
                                        <StatusBadge approved={s.approved} />
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Próximas Entregas y Recursos de Facultad */}
                        {summary.status === 'success' && (
                            <>
                                <UpcomingDeadlines deadlines={summary.data.deadlines} />
                                <FacultyResources resources={summary.data.resources} />
                            </>
                        )}
                        {(summary.status === 'loading' || summary.status === 'idle') && (
                            <div className="dash-deadlines" aria-busy="true" aria-label="Cargando próximas entregas…">
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
                        )}
                    </aside>
                </div>
            </div>

            {/* Footer institucional */}
            <AppFooter />
        </AppShell>
    );
};

export default DashboardPage;
