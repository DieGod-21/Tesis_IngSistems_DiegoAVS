/**
 * StudentManualForm.tsx
 *
 * Formulario de registro manual de estudiantes.
 * Validación onBlur + onSubmit (no onChange).
 * Reserva espacio fijo para mensajes de error (sin layout shift).
 * IonToast para feedback de éxito/error.
 */

import React, { useState } from 'react';
import { IonToast } from '@ionic/react';
import { User, CreditCard, Mail, BookOpen, GraduationCap, Save, Trash2 } from 'lucide-react';
import {
    createStudent,
    ALLOWED_EMAIL_DOMAINS,
} from '../../services/studentsService';
import type { StudentPayload } from '../../services/studentsService';

// ─── Tipos de estado ────────────────────────────────────────────────

type FormValues = Record<keyof StudentPayload, string>;
type FormErrors = Partial<Record<keyof StudentPayload, string>>;
type FormTouched = Partial<Record<keyof StudentPayload, boolean>>;

const EMPTY_FORM: FormValues = {
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

// ─── Validación ─────────────────────────────────────────────────────

function validate(values: FormValues): FormErrors {
    const errors: FormErrors = {};

    if (!values.nombreCompleto.trim()) {
        errors.nombreCompleto = 'El nombre completo es requerido.';
    }

    if (!values.carnetId.trim()) {
        errors.carnetId = 'El carnet ID es requerido.';
    }

    if (!values.correoInstitucional.trim()) {
        errors.correoInstitucional = 'El correo institucional es requerido.';
    } else {
        const lower = values.correoInstitucional.toLowerCase();
        if (!ALLOWED_EMAIL_DOMAINS.some((d) => lower.endsWith(d))) {
            errors.correoInstitucional = `Debe usar dominio ${ALLOWED_EMAIL_DOMAINS.join(' o ')}.`;
        }
    }

    if (!values.semestreLectivo) {
        errors.semestreLectivo = 'Selecciona un semestre.';
    }

    if (!values.faseAcademica) {
        errors.faseAcademica = 'Selecciona una fase académica.';
    }

    return errors;
}

// ─── Componente ─────────────────────────────────────────────────────

const StudentManualForm: React.FC = () => {
    const [values, setValues] = useState<FormValues>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<FormTouched>({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string; color: string }>({
        open: false,
        message: '',
        color: 'success',
    });

    const handleChange = (field: keyof FormValues, value: string) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        // Si el campo ya fue tocado y tiene error, recalcular solo ese campo
        if (touched[field]) {
            const partial = validate({ ...values, [field]: value });
            setErrors((prev) => ({ ...prev, [field]: partial[field] }));
        }
    };

    const handleBlur = (field: keyof FormValues) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const partial = validate(values);
        setErrors((prev) => ({ ...prev, [field]: partial[field] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allTouched = (Object.keys(EMPTY_FORM) as (keyof FormValues)[]).reduce(
            (acc, k) => ({ ...acc, [k]: true }),
            {} as FormTouched,
        );
        setTouched(allTouched);
        const newErrors = validate(values);
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        try {
            await createStudent(values);
            setToast({ open: true, message: 'Estudiante registrado exitosamente.', color: 'success' });
            setValues(EMPTY_FORM);
            setTouched({});
            setErrors({});
        } catch {
            setToast({ open: true, message: 'Error al registrar. Intenta de nuevo.', color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setValues(EMPTY_FORM);
        setErrors({});
        setTouched({});
    };

    const showError = (field: keyof FormValues) =>
        touched[field] && errors[field] ? errors[field] : undefined;

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
                            disabled={loading}
                            aria-busy={loading}
                        >
                            <Save size={16} />
                            {loading ? 'Registrando…' : 'Registrar Estudiante'}
                        </button>
                        <button
                            type="button"
                            className="sn-btn-secondary"
                            onClick={handleReset}
                            disabled={loading}
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
