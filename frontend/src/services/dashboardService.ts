/**
 * dashboardService.ts
 *
 * Fuente única de datos para el Dashboard PG1-PG2.
 * Las funciones son async con un delay simulado de 500ms.
 * Para conectar al API real: reemplazar el cuerpo de cada función
 * con fetch/axios manteniendo las mismas interfaces y firmas.
 */

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
    phase: 'PG1' | 'PG2';
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

/** Resumen completo del dashboard (KPIs + deadlines + resources) */
export interface DashboardSummary {
    kpis: KpiData[];
    deadlines: Deadline[];
    resources: FacultyResource[];
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Simula latencia de red. Reemplazar por fetch real en producción. */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Datos estáticos (mock) ─────────────────────────────────────────

const MOCK_KPIS: KpiData[] = [
    {
        id: 'kpi-pg1',
        label: 'Total PG1',
        value: '142',
        trend: '+4%',
        trendPositive: true,
        description: 'Propedéutico de Tesis',
        iconName: 'FileText',
        iconVariant: 'blue',
    },
    {
        id: 'kpi-pg2',
        label: 'Total PG2',
        value: '89',
        trend: '+12%',
        trendPositive: true,
        description: 'Desarrollo de Tesis',
        iconName: 'GraduationCap',
        iconVariant: 'blue',
    },
    {
        id: 'kpi-risk',
        label: 'En Riesgo',
        value: '14',
        trend: '+2',
        trendPositive: false,
        description: 'Requieren atención inmediata',
        iconName: 'AlertTriangle',
        iconVariant: 'red',
    },
    {
        id: 'kpi-completion',
        label: 'Completación',
        value: '76%',
        trend: '↑ 3%',
        trendPositive: true,
        description: '',
        iconName: 'CheckCircle',
        iconVariant: 'blue',
        progressValue: 76,
    },
];

const MOCK_ACTIONS: PendingAction[] = [
    {
        id: 'pa-1',
        studentName: 'Ana Martínez',
        studentId: '0901-19-1234',
        avatarInitials: 'AM',
        avatarVariant: 'blue',
        projectTitle: 'Gestión de Inventarios…',
        phase: 'PG1',
        actionLabel: 'Revisión Requerida',
        actionVariant: 'danger',
        deadline: 'Oct 24, 2023',
    },
    {
        id: 'pa-2',
        studentName: 'Juan González',
        studentId: '0901-18-5678',
        avatarInitials: 'JG',
        avatarVariant: 'green',
        projectTitle: 'IA en Ciberseguridad…',
        phase: 'PG2',
        actionLabel: 'Aprobación Pendiente',
        actionVariant: 'warning',
        deadline: 'Oct 26, 2023',
    },
    {
        id: 'pa-3',
        studentName: 'Sofía Ramírez',
        studentId: '0901-19-9988',
        avatarInitials: 'SR',
        avatarVariant: 'slate',
        projectTitle: 'Optimización de Redes…',
        phase: 'PG1',
        actionLabel: 'Urgente',
        actionVariant: 'urgent',
        deadline: 'Hoy',
        deadlineUrgent: true,
    },
];

const MOCK_DEADLINES: Deadline[] = [
    {
        id: 'dl-1',
        month: 'Oct',
        day: '28',
        title: 'Cierre de Anteproyectos',
        subtitle: 'Cohorte PG1 - Segundo Semestre',
    },
    {
        id: 'dl-2',
        month: 'Nov',
        day: '02',
        title: 'Revisión de Capítulos I-II',
        subtitle: 'Tesis PG2 - Estudiantes Activos',
    },
    {
        id: 'dl-3',
        month: 'Nov',
        day: '15',
        title: 'Defensas Privadas',
        subtitle: 'Salón B-102 - Fase Final',
    },
];

const MOCK_RESOURCES: FacultyResource[] = [
    { id: 'res-1', label: 'Guía Normativa 2023', iconName: 'Download', href: '#' },
    { id: 'res-2', label: 'Plantillas LaTeX / Word', iconName: 'File', href: '#' },
    { id: 'res-3', label: 'Repositorio de Tesis', iconName: 'Link', href: '#' },
];

// ─── API pública ────────────────────────────────────────────────────

/**
 * Devuelve KPIs, deadlines y recursos en una sola llamada.
 * Equivalente a GET /api/dashboard/summary en producción.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
    await delay(500);
    // TODO: return await fetch('/api/dashboard/summary').then(r => r.json());
    return {
        kpis: MOCK_KPIS,
        deadlines: MOCK_DEADLINES,
        resources: MOCK_RESOURCES,
    };
}

/**
 * Devuelve acciones pendientes, opcionalmente filtradas por query.
 * Equivalente a GET /api/pending-actions?q=... en producción.
 */
export async function getPendingActions(query?: string): Promise<PendingAction[]> {
    await delay(500);
    // TODO: return await fetch(`/api/pending-actions?q=${query ?? ''}`).then(r => r.json());
    if (!query || query.trim() === '') {
        return MOCK_ACTIONS;
    }
    const q = query.trim().toLowerCase();
    return MOCK_ACTIONS.filter(
        (a) =>
            a.studentName.toLowerCase().includes(q) ||
            a.studentId.toLowerCase().includes(q) ||
            a.projectTitle.toLowerCase().includes(q),
    );
}
