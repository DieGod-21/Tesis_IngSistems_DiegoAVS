/**
 * StudentManualForm.tsx
 *
 * Formulario de registro manual de estudiantes.
 * Usa el hook genérico useForm para manejo de estado + validación.
 * Validación onBlur + onSubmit (no onChange).
 * Reserva espacio fijo para mensajes de error (sin layout shift).
 * IonToast para feedback de éxito/error.
 */

import React, { useState } from 'react';
import { IonToast } from '@ionic/react';
import { User, CreditCard, Mail, BookOpen, GraduationCap, Save, Trash2 } from 'lucide-react';
import {
    createStudent,
} from '../../services/studentsService';
import type { StudentPayload } from '../../services/studentsService';
import { useForm } from '../../hooks/useForm';
import { runValidators, validators } from '../../utils/validators';

// ─── Constantes ──────────────────────────────────────────────────────

const EMPTY_FORM: Record<keyof StudentPayload, string> = {
    nombreCompleto: '',
    carnetId: '',
    correoInstitucional: '',
    semestreLectivo: '',
    faseAcademica: '',
};

const SEMESTRES = [
    'Primer Semestre 2024',
    'Segundo Semestre 2024',
    'Primer Semestre 2025',
    'Segundo Semestre 2025',
];

const FASES = [
    { value: 'PG1', label: 'Proyecto de Graduación 1 (PG1)' },
    { value: 'PG2', label: 'Proyecto de Graduación 2 (PG2)' },
];

// ─── Validación centralizada ─────────────────────────────────────────

function validate(values: Record<keyof StudentPayload, string>) {
    const errors: Partial<Record<keyof StudentPayload, string>> = {};

    const nombre = runValidators(values.nombreCompleto, validators.required('El nombre completo'));
    if (nombre) errors.nombreCompleto = nombre;

    const carnet = runValidators(values.carnetId, validators.required('El carnet ID'));
    if (carnet) errors.carnetId = carnet;

    const correo = runValidators(
        values.correoInstitucional,
        validators.required('El correo institucional'),
        validators.email.format,
        validators.email.institutional,
    );
    if (correo) errors.correoInstitucional = correo;

    const semestre = validators.select('un semestre')(values.semestreLectivo);
    if (semestre) errors.semestreLectivo = semestre;

    const fase = validators.select('una fase académica')(values.faseAcademica);
    if (fase) errors.faseAcademica = fase;

    return errors;
}

// ─── Componente ─────────────────────────────────────────────────────

const StudentManualForm: React.FC = () => {
    const [toast, setToast] = useState<{ open: boolean; message: string; color: string }>({
        open: false,
        message: '',
        color: 'success',
    });

    const { values, submitting, handleChange, handleBlur, handleSubmit, reset, showError } =
        useForm({
            initialValues: EMPTY_FORM,
            validate,
            onSubmit: async (vals) => {
                try {
                    await createStudent(vals);
                    setToast({ open: true, message: 'Estudiante registrado exitosamente.', color: 'success' });
                } catch {
                    setToast({ open: true, message: 'Error al registrar. Intenta de nuevo.', color: 'danger' });
                    throw new Error('submit failed'); // re-throw para que useForm no haga reset
                }
            },
        });

    return (
        <>
            <div className="sn-card">
                <div className="sn-card__header">
                    <GraduationCap size={20} className="sn-card__header-icon" />
                    <h3 className="sn-card__title">Registro Manual</h3>
                </div>

                <form className="sn-form" onSubmit={handleSubmit} noValidate>
                    {/* Nombre Completo */}
                    <div className="sn-form__group sn-form__group--full">
                        <label className="sn-form__label" htmlFor="sn-nombre">
                            Nombre Completo <span className="sn-form__required">*</span>
                        </label>
                        <div className={`sn-field${showError('nombreCompleto') ? ' sn-field--error' : ''}`}>
                            <User size={16} className="sn-field__icon" aria-hidden="true" />
                            <input
                                id="sn-nombre"
                                type="text"
                                className="sn-field__input"
                                placeholder="Ej. Juan Pérez López"
                                value={values.nombreCompleto}
                                onChange={(e) => handleChange('nombreCompleto', e.target.value)}
                                onBlur={() => handleBlur('nombreCompleto')}
                                aria-describedby="sn-nombre-error"
                                aria-invalid={!!showError('nombreCompleto')}
                            />
                        </div>
                        <p id="sn-nombre-error" className="sn-field__error" role="alert">
                            {showError('nombreCompleto') ?? ''}
                        </p>
                    </div>

                    {/* Carnet ID + Correo */}
                    <div className="sn-form__row">
                        <div className="sn-form__group">
                            <label className="sn-form__label" htmlFor="sn-carnet">
                                Carnet ID <span className="sn-form__required">*</span>
                            </label>
                            <div className={`sn-field${showError('carnetId') ? ' sn-field--error' : ''}`}>
                                <CreditCard size={16} className="sn-field__icon" aria-hidden="true" />
                                <input
                                    id="sn-carnet"
                                    type="text"
                                    className="sn-field__input"
                                    placeholder="1234-20-XXXX"
                                    value={values.carnetId}
                                    onChange={(e) => handleChange('carnetId', e.target.value)}
                                    onBlur={() => handleBlur('carnetId')}
                                    aria-describedby="sn-carnet-error"
                                    aria-invalid={!!showError('carnetId')}
                                />
                            </div>
                            <p id="sn-carnet-error" className="sn-field__error" role="alert">
                                {showError('carnetId') ?? ''}
                            </p>
                        </div>

                        <div className="sn-form__group">
                            <label className="sn-form__label" htmlFor="sn-correo">
                                Correo Institucional <span className="sn-form__required">*</span>
                            </label>
                            <div className={`sn-field${showError('correoInstitucional') ? ' sn-field--error' : ''}`}>
                                <Mail size={16} className="sn-field__icon" aria-hidden="true" />
                                <input
                                    id="sn-correo"
                                    type="email"
                                    className="sn-field__input"
                                    placeholder="usuario@miumg.edu.gt"
                                    value={values.correoInstitucional}
                                    onChange={(e) => handleChange('correoInstitucional', e.target.value)}
                                    onBlur={() => handleBlur('correoInstitucional')}
                                    aria-describedby="sn-correo-error"
                                    aria-invalid={!!showError('correoInstitucional')}
                                />
                            </div>
                            <p id="sn-correo-error" className="sn-field__error" role="alert">
                                {showError('correoInstitucional') ?? ''}
                            </p>
                        </div>
                    </div>

                    {/* Semestre + Fase */}
                    <div className="sn-form__row">
                        <div className="sn-form__group">
                            <label className="sn-form__label" htmlFor="sn-semestre">
                                Semestre Lectivo <span className="sn-form__required">*</span>
                            </label>
                            <div className={`sn-field${showError('semestreLectivo') ? ' sn-field--error' : ''}`}>
                                <BookOpen size={16} className="sn-field__icon" aria-hidden="true" />
                                <select
                                    id="sn-semestre"
                                    className="sn-field__input sn-field__select"
                                    value={values.semestreLectivo}
                                    onChange={(e) => handleChange('semestreLectivo', e.target.value)}
                                    onBlur={() => handleBlur('semestreLectivo')}
                                    aria-describedby="sn-semestre-error"
                                    aria-invalid={!!showError('semestreLectivo')}
                                >
                                    <option value="">Seleccionar semestre</option>
                                    {SEMESTRES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <p id="sn-semestre-error" className="sn-field__error" role="alert">
                                {showError('semestreLectivo') ?? ''}
                            </p>
                        </div>

                        <div className="sn-form__group">
                            <label className="sn-form__label" htmlFor="sn-fase">
                                Fase Académica <span className="sn-form__required">*</span>
                            </label>
                            <div className={`sn-field${showError('faseAcademica') ? ' sn-field--error' : ''}`}>
                                <GraduationCap size={16} className="sn-field__icon" aria-hidden="true" />
                                <select
                                    id="sn-fase"
                                    className="sn-field__input sn-field__select"
                                    value={values.faseAcademica}
                                    onChange={(e) => handleChange('faseAcademica', e.target.value)}
                                    onBlur={() => handleBlur('faseAcademica')}
                                    aria-describedby="sn-fase-error"
                                    aria-invalid={!!showError('faseAcademica')}
                                >
                                    <option value="">Seleccionar fase</option>
                                    {FASES.map((f) => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>
                            <p id="sn-fase-error" className="sn-field__error" role="alert">
                                {showError('faseAcademica') ?? ''}
                            </p>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="sn-form__actions">
                        <button
                            type="submit"
                            className="sn-btn-primary"
                            disabled={submitting}
                            aria-busy={submitting}
                        >
                            <Save size={16} />
                            {submitting ? 'Registrando…' : 'Registrar Estudiante'}
                        </button>
                        <button
                            type="button"
                            className="sn-btn-secondary"
                            onClick={reset}
                            disabled={submitting}
                        >
                            <Trash2 size={16} />
                            Limpiar Formulario
                        </button>
                    </div>
                </form>
            </div>

            {/* Toast feedback */}
            <IonToast
                isOpen={toast.open}
                message={toast.message}
                color={toast.color}
                duration={3000}
                position="bottom"
                onDidDismiss={() => setToast((t) => ({ ...t, open: false }))}
            />
        </>
    );
};

export default StudentManualForm;
