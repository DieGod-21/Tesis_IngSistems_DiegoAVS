/**
 * student.ts
 *
 * Interfaz canónica del estudiante + helpers de persistencia en localStorage.
 * Fuente de verdad para la demo de tesis sin backend.
 *
 * Clave de almacenamiento: "umg_students"
 * Formato: Student[]  (arreglo JSON)
 *
 * Para conectar a API real: reemplaza cada función con fetch/axios
 * manteniendo las mismas firmas. Los componentes NO cambian.
 */

const STORAGE_KEY = 'umg_students';

// ─── Interfaz ────────────────────────────────────────────────────────

export interface Student {
    id: string;
    nombreCompleto: string;
    carnetId: string;
    correoInstitucional: string;
    semestreLectivo: string;
    faseAcademica: 'PG1' | 'PG2';
    approved: boolean;          // false = Pendiente, true = Aprobado
    createdAt: string;          // ISO 8601
    updatedAt: string;          // ISO 8601
}

// ─── Datos semilla (mock) ────────────────────────────────────────────

const SEED_STUDENTS: Student[] = [
    {
        id: 'stu-1',
        nombreCompleto: 'Ana Martínez García',
        carnetId: '0901-19-1234',
        correoInstitucional: 'ana.martinez@miumg.edu.gt',
        semestreLectivo: 'Primer Semestre 2025',
        faseAcademica: 'PG1',
        approved: false,
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
        id: 'stu-2',
        nombreCompleto: 'Juan González López',
        carnetId: '0901-18-5678',
        correoInstitucional: 'juan.gonzalez@miumg.edu.gt',
        semestreLectivo: 'Primer Semestre 2025',
        faseAcademica: 'PG2',
        approved: true,
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        id: 'stu-3',
        nombreCompleto: 'Sofía Ramírez Pérez',
        carnetId: '0901-19-9988',
        correoInstitucional: 'sofia.ramirez@miumg.edu.gt',
        semestreLectivo: 'Segundo Semestre 2024',
        faseAcademica: 'PG1',
        approved: false,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
        id: 'stu-4',
        nombreCompleto: 'Carlos Herrera Vásquez',
        carnetId: '0901-20-4455',
        correoInstitucional: 'carlos.herrera@miumg.edu.gt',
        semestreLectivo: 'Primer Semestre 2025',
        faseAcademica: 'PG2',
        approved: true,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
        id: 'stu-5',
        nombreCompleto: 'María Elena Cifuentes',
        carnetId: '0901-21-7701',
        correoInstitucional: 'maria.cifuentes@umg.edu.gt',
        semestreLectivo: 'Primer Semestre 2025',
        faseAcademica: 'PG1',
        approved: false,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
        id: 'stu-6',
        nombreCompleto: 'Diego Morales Soto',
        carnetId: '0901-20-3322',
        correoInstitucional: 'diego.morales@miumg.edu.gt',
        semestreLectivo: 'Segundo Semestre 2024',
        faseAcademica: 'PG2',
        approved: true,
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
];

// ─── Helpers de persistencia ─────────────────────────────────────────

/**
 * Obtiene todos los estudiantes desde localStorage.
 * Si no existe la clave, carga los datos semilla y los guarda.
 */
export function getStudents(): Student[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Student[];
    } catch {
        // JSON corrupto → reinicializar
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STUDENTS));
    return SEED_STUDENTS;
}

/** Guarda el arreglo completo de estudiantes. */
export function saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

/**
 * Actualiza el estado de aprobación de un estudiante.
 * Retorna la lista actualizada.
 *
 * Para API real:
 * // await fetch(`/api/students/${id}/status`, {
 * //   method: 'PATCH',
 * //   headers: { 'Content-Type': 'application/json' },
 * //   body: JSON.stringify({ approved }),
 * // });
 */
export function updateStudentStatus(id: string, approved: boolean): Student[] {
    const students = getStudents().map((s) =>
        s.id === id ? { ...s, approved, updatedAt: new Date().toISOString() } : s,
    );
    saveStudents(students);
    return students;
}

/**
 * Añade un nuevo estudiante al almacenamiento.
 * Retorna la lista actualizada.
 */
export function addStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'approved'>): Student[] {
    const now = new Date().toISOString();
    const newStudent: Student = {
        ...data,
        id: `stu-${Date.now()}`,
        approved: false,
        createdAt: now,
        updatedAt: now,
    };
    const students = [...getStudents(), newStudent];
    saveStudents(students);
    return students;
}

/** Computa KPIs a partir de la lista actual. */
export function computeStudentKpis(students: Student[]) {
    const total = students.length;
    const approved = students.filter((s) => s.approved).length;
    const pending = total - approved;
    const pg1 = students.filter((s) => s.faseAcademica === 'PG1').length;
    const pg2 = students.filter((s) => s.faseAcademica === 'PG2').length;
    return { total, approved, pending, pg1, pg2 };
}

/** Retorna los últimos N estudiantes por fecha de actualización. */
export function getRecentStudents(n = 5): Student[] {
    return [...getStudents()]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, n);
}
