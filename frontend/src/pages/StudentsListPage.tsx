/**
 * StudentsListPage.tsx
 *
 * Página /students — Listado de Estudiantes con:
 * - KPI strip (Total / Aprobados / Pendientes / PG1 vs PG2)
 * - Filtros: búsqueda por nombre o carnet + tabs de estado
 * - Tabla con Badge de estado + ApprovalToggle por fila (Optimistic UI)
 * - Persistencia en localStorage vía helpers de student.ts
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Search, Plus, ChevronRight } from 'lucide-react';
import AppShell from '../layout/AppShell';
import ApprovalToggle from '../components/students/ApprovalToggle';
import StatusBadge from '../components/students/StatusBadge';
import {
    computeStudentKpis,
    getStudents,
    updateStudentStatus,
} from '../types/student';
import type { Student } from '../types/student';

import '../styles/students-list.css';
import '../styles/student-new.css';   // reutiliza clases sn-breadcrumb

// ─── Tipos de filtro ─────────────────────────────────────────────────

type StatusFilter = 'all' | 'approved' | 'pending';

const TABS: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Aprobados', value: 'approved' },
    { label: 'Pendientes', value: 'pending' },
];

// ─── Avatar helpers ──────────────────────────────────────────────────

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// ─── Skeleton row ────────────────────────────────────────────────────

const TableSkeleton: React.FC = () => (
    <>
        {[0, 1, 2, 3].map((i) => (
            <tr key={i} className="sl-table__tr">
                <td className="sl-table__td">
                    <div className="sl-student-cell">
                        <div className="skeleton skeleton--circle" />
                        <div>
                            <div className="skeleton skeleton--line skeleton--medium" />
                            <div className="skeleton skeleton--line skeleton--short" style={{ marginTop: 4 }} />
                        </div>
                    </div>
                </td>
                {[1, 2, 3, 4].map((j) => (
                    <td key={j} className="sl-table__td">
                        <div className="skeleton skeleton--line skeleton--medium" />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

// ─── Componente ──────────────────────────────────────────────────────

const StudentsListPage: React.FC = () => {
    const history = useHistory();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    // Track de toggles en curso para deshabilitar durante el delay simulado
    const [toggling, setToggling] = useState<Record<string, boolean>>({});

    // Cargar desde localStorage
    useEffect(() => {
        const data = getStudents();
        setStudents(data);
        setLoading(false);
    }, []);

    // Actualización optimista del estado de aprobación
    const handleToggle = useCallback((id: string, next: boolean) => {
        // 1. Optimistic: actualizar UI al instante
        setStudents((prev) =>
            prev.map((s) =>
                s.id === id ? { ...s, approved: next, updatedAt: new Date().toISOString() } : s,
            ),
        );
        // 2. Marcar como en progreso
        setToggling((t) => ({ ...t, [id]: true }));

        // 3. Persistir (mock: delay 300ms — reemplazar con fetch PATCH)
        setTimeout(() => {
            // TODO API real:
            // fetch(`/api/students/${id}/status`, {
            //   method: 'PATCH',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ approved: next }),
            // }).catch(() => {
            //   // Rollback en caso de error
            //   setStudents((prev) => prev.map((s) => s.id === id ? { ...s, approved: !next } : s));
            // });
            updateStudentStatus(id, next);
            setToggling((t) => ({ ...t, [id]: false }));
        }, 300);
    }, []);

    // KPIs
    const kpis = useMemo(() => computeStudentKpis(students), [students]);

    // Filtrado
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return students.filter((s) => {
            const matchText =
                !q ||
                s.nombreCompleto.toLowerCase().includes(q) ||
                s.carnetId.toLowerCase().includes(q) ||
                s.correoInstitucional.toLowerCase().includes(q);
            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'approved' && s.approved) ||
                (statusFilter === 'pending' && !s.approved);
            return matchText && matchStatus;
        });
    }, [students, query, statusFilter]);

    return (
        <AppShell>
            <div className="sl-body">
                {/* Breadcrumb */}
                <nav className="sn-breadcrumb" aria-label="Navegación secundaria">
                    <span className="sn-breadcrumb__item">Inicio</span>
                    <ChevronRight size={14} className="sn-breadcrumb__sep" />
                    <span className="sn-breadcrumb__item sn-breadcrumb__item--active">
                        Estudiantes
                    </span>
                </nav>

                {/* Encabezado */}
                <div className="sl-page-header">
                    <div className="sl-page-title-group">
                        <h1 className="sl-page-title">Estudiantes</h1>
                        <p className="sl-page-subtitle">
                            Gestión de inscripciones en Proyecto de Graduación
                        </p>
                    </div>
                    <button
                        className="sn-btn-primary"
                        onClick={() => history.push('/students/new')}
                    >
                        <Plus size={16} />
                        Nuevo Registro
                    </button>
                </div>

                {/* KPI strip */}
                <div className="sl-kpi-strip">
                    <div className="sl-kpi-item">
                        <span className="sl-kpi-item__label">Total</span>
                        <span className="sl-kpi-item__value">{kpis.total}</span>
                        <span className="sl-kpi-item__sub">Estudiantes registrados</span>
                    </div>
                    <div className="sl-kpi-item sl-kpi-item--approved">
                        <span className="sl-kpi-item__label">Aprobados</span>
                        <span className="sl-kpi-item__value">{kpis.approved}</span>
                        <span className="sl-kpi-item__sub">
                            {kpis.total > 0
                                ? `${Math.round((kpis.approved / kpis.total) * 100)}% del total`
                                : '—'}
                        </span>
                    </div>
                    <div className="sl-kpi-item sl-kpi-item--pending">
                        <span className="sl-kpi-item__label">Pendientes</span>
                        <span className="sl-kpi-item__value">{kpis.pending}</span>
                        <span className="sl-kpi-item__sub">Por aprobar</span>
                    </div>
                    <div className="sl-kpi-item">
                        <span className="sl-kpi-item__label">Fases</span>
                        <span className="sl-kpi-item__value">{kpis.pg1}/{kpis.pg2}</span>
                        <span className="sl-kpi-item__sub">PG1 / PG2</span>
                    </div>
                </div>

                {/* Filtros */}
                <div className="sl-filters">
                    <div className="sl-filter-search">
                        <Search size={14} className="sl-filter-search__icon" />
                        <input
                            type="text"
                            className="sl-filter-search__input"
                            placeholder="Buscar por nombre o carnet…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Buscar estudiante"
                        />
                    </div>
                    <div className="sl-status-tabs" role="group" aria-label="Filtrar por estado">
                        {TABS.map((tab) => (
                            <button
                                key={tab.value}
                                className={`sl-status-tab${statusFilter === tab.value ? ' sl-status-tab--active' : ''}`}
                                onClick={() => setStatusFilter(tab.value)}
                                aria-pressed={statusFilter === tab.value}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <span className="sl-filter-count">
                        {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Tabla */}
                <div className="sl-table-wrap">
                    <table className="sl-table" aria-label="Listado de estudiantes">
                        <thead>
                            <tr>
                                <th className="sl-table__th">Estudiante</th>
                                <th className="sl-table__th">Semestre</th>
                                <th className="sl-table__th">Fase</th>
                                <th className="sl-table__th">Estado</th>
                                <th className="sl-table__th">Aprobación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <TableSkeleton />}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="sl-table__td">
                                        <div className="sl-empty">
                                            <p className="sl-empty__title">Sin resultados</p>
                                            <p className="sl-empty__sub">
                                                {query
                                                    ? `No se encontró "${query}" en ${statusFilter === 'all' ? 'ningún estado' : statusFilter === 'approved' ? 'Aprobados' : 'Pendientes'}`
                                                    : 'Aún no hay estudiantes registrados'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filtered.map((student) => (
                                    <tr key={student.id} className="sl-table__tr">
                                        {/* Nombre + Carnet */}
                                        <td className="sl-table__td">
                                            <div className="sl-student-cell">
                                                <div className="sl-avatar" aria-hidden="true">
                                                    {initials(student.nombreCompleto)}
                                                </div>
                                                <div>
                                                    <p className="sl-student-name">
                                                        {student.nombreCompleto}
                                                    </p>
                                                    <p className="sl-student-carnet">
                                                        {student.carnetId}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Semestre */}
                                        <td className="sl-table__td">
                                            {student.semestreLectivo}
                                        </td>
                                        {/* Fase */}
                                        <td className="sl-table__td">
                                            <span
                                                className={`sl-phase-badge sl-phase-badge--${student.faseAcademica.toLowerCase()}`}
                                            >
                                                {student.faseAcademica}
                                            </span>
                                        </td>
                                        {/* Badge estado */}
                                        <td className="sl-table__td">
                                            <StatusBadge approved={student.approved} />
                                        </td>
                                        {/* Toggle de aprobación */}
                                        <td className="sl-table__td sl-table__td--center">
                                            <div className="sl-toggle-cell">
                                                <ApprovalToggle
                                                    checked={student.approved}
                                                    onChange={(next) =>
                                                        handleToggle(student.id, next)
                                                    }
                                                    disabled={toggling[student.id]}
                                                    label={
                                                        student.approved
                                                            ? 'Aprobado'
                                                            : 'Pendiente'
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppShell>
    );
};

export default StudentsListPage;
