/**
 * dashboardService.ts
 *
 * Fuente de datos para el Panel de Control.
 * - KPIs: calculados dinámicamente desde GET /api/students
 * - Acciones pendientes: estudiantes sin aprobar (approved = false)
 * - Deadlines: estáticos (el backend tiene /api/deadlines pero sin datos semilla definidos)
 * - Recursos: estáticos
 *
 * Universidad Mariano Gálvez — Coordinación de Proyecto de Graduación
 */

import { apiFetch } from './apiClient';
import type { BackendStudent } from '../types/student';

// ─── Interfaces ────────────────────────────────────────────────────

export interface KpiData {
    id: string;
    label: string;
    value: string;
    trend: string;
    trendPositive: boolean;
    description: string;
    iconName: string;
    iconVariant: 'blue' | 'red';
    progressValue?: number;
}

export interface PendingAction {
    id: string;
    studentName: string;
    studentId: string;
    avatarInitials: string;
    avatarVariant: 'blue' | 'green' | 'slate';
    projectTitle: string;
    phase: string;
    actionLabel: string;
    actionVariant: 'danger' | 'warning' | 'urgent';
    deadline: string;
    deadlineUrgent?: boolean;
}

export interface Deadline {
    id: string;
    month: string;
    day: string;
    title: string;
    subtitle: string;
}

export interface FacultyResource {
    id: string;
    label: string;
    iconName: string;
    href: string;
}

export interface DashboardSummary {
    kpis: KpiData[];
    deadlines: Deadline[];
    resources: FacultyResource[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

const AVATAR_VARIANTS: Array<'blue' | 'green' | 'slate'> = ['blue', 'green', 'slate'];

// ─── Datos estáticos ────────────────────────────────────────────────

const STATIC_DEADLINES: Deadline[] = [
    {
        id: 'dl-1',
        month: 'Abr',
        day: '15',
        title: 'Revisión de Anteproyectos',
        subtitle: 'Fase Anteproyecto — Primer Semestre 2026',
    },
    {
        id: 'dl-2',
        month: 'May',
        day: '09',
        title: 'Entrega de Capítulos I-III',
        subtitle: 'Tesis — Estudiantes con Asesor Asignado',
    },
    {
        id: 'dl-3',
        month: 'Jun',
        day: '20',
        title: 'Defensas Privadas',
        subtitle: 'Salón B-102 — Fase Final de Graduación',
    },
];

const currentYear = new Date().getFullYear();
const STATIC_RESOURCES: FacultyResource[] = [
    { id: 'res-1', label: `Guía Normativa ${currentYear}`, iconName: 'Download', href: '#' },
    { id: 'res-2', label: 'Plantillas LaTeX / Word',        iconName: 'File',     href: '#' },
    { id: 'res-3', label: 'Repositorio Institucional',      iconName: 'Link',     href: '#' },
];

// ─── API pública ────────────────────────────────────────────────────

/**
 * Obtiene el resumen del dashboard.
 * Los KPIs por fase se generan dinámicamente desde los datos de estudiantes —
 * no hay nombres de fase hardcodeados.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
    const students = await apiFetch<BackendStudent[]>('/students');

    const total    = students.length;
    const approved = students.filter((s) => s.approved).length;
    const pending  = total - approved;
    const completionPct = total > 0 ? Math.round((approved / total) * 100) : 0;

    // Agrupar por academic_phase_id (clave estable) — el nombre es solo para display.
    // Esto evita duplicados si se renombra una fase en la BD.
    const countByPhase = new Map<string, { count: number; description: string }>();
    for (const s of students) {
        const key   = s.academic_phase_id != null ? String(s.academic_phase_id) : (s.fase_academica ?? '—');
        const label = s.phase_description ?? s.phase_name ?? s.fase_academica ?? '—';
        const cur   = countByPhase.get(key) ?? { count: 0, description: label };
        countByPhase.set(key, { count: cur.count + 1, description: label });
    }

    const phaseKpis: KpiData[] = Array.from(countByPhase.entries()).map(([key, { count, description }]) => ({
        id:            `kpi-phase-${key}`,
        label:         description,
        value:         String(count),
        trend:         '',
        trendPositive: true,
        description:   `Estudiantes en ${description}`,
        iconName:      'GraduationCap',
        iconVariant:   'blue' as const,
    }));

    const kpis: KpiData[] = [
        ...phaseKpis,
        {
            id:            'kpi-pending',
            label:         'Sin Aprobar',
            value:         String(pending),
            trend:         '',
            trendPositive: pending === 0,
            description:   'Expedientes pendientes de revisión',
            iconName:      'AlertTriangle',
            iconVariant:   pending > 0 ? 'red' : 'blue',
        },
        {
            id:            'kpi-completion',
            label:         'Completación',
            value:         `${completionPct}%`,
            trend:         '',
            trendPositive: true,
            description:   `${approved} de ${total} aprobados`,
            iconName:      'CheckCircle',
            iconVariant:   'blue',
            progressValue: completionPct,
        },
    ];

    return {
        kpis,
        deadlines: STATIC_DEADLINES,
        resources: STATIC_RESOURCES,
    };
}

/**
 * Devuelve estudiantes sin aprobar como acciones pendientes.
 * Filtra opcionalmente por query.
 */
export async function getPendingActions(query?: string): Promise<PendingAction[]> {
    const students = await apiFetch<BackendStudent[]>('/students?approved=false');

    const q = query?.trim().toLowerCase() ?? '';

    return students
        .filter((s) => {
            if (!q) return true;
            return (
                s.nombre_completo.toLowerCase().includes(q) ||
                s.carnet_id.toLowerCase().includes(q)
            );
        })
        .map((s, i): PendingAction => ({
            id:            s.id,
            studentName:   s.nombre_completo,
            studentId:     s.carnet_id,
            avatarInitials: initials(s.nombre_completo),
            avatarVariant: AVATAR_VARIANTS[i % AVATAR_VARIANTS.length],
            projectTitle:  s.correo_institucional,
            phase:         s.phase_description ?? s.phase_name ?? s.fase_academica ?? '—',
            actionLabel:   'Pendiente de aprobación',
            actionVariant: 'warning',
            deadline:      'Sin fecha límite',
            deadlineUrgent: false,
        }));
}
