import { apiFetch } from './apiClient';

export interface AcademicPhase {
    id: number;
    name: string;
    description: string | null;
}

export async function getAcademicPhases(): Promise<AcademicPhase[]> {
    return apiFetch<AcademicPhase[]>('/academic-phases');
}
