/**
 * BulkUploadCard.tsx
 *
 * Dropzone con drag & drop para carga masiva de estudiantes.
 * - Excel/CSV: parsea con `xlsx`, muestra preview (máx 20 filas) + validaciones por fila.
 * - PDF: muestra nombre y tamaño (sin parsear contenido — parseo real será backend).
 * Llama importStudents() o uploadPdf() del servicio.
 * onUploaded() notifica al padre para refrescar RecentUploads.
 */

import React, { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CloudUpload, FileSpreadsheet, FileText, AlertCircle, CheckCircle2, X, Download } from 'lucide-react';
import { importStudents, uploadPdf, downloadTemplate } from '../../services/studentsService';
import type { ImportResult, ParsedRow } from '../../services/studentsService';
import { isInstitutionalEmail } from '../../utils/validators';

const ACCEPTED_TYPES = '.xlsx,.xls,.csv,.pdf';
const MAX_PREVIEW_ROWS = 20;
const PDF_TYPES = ['application/pdf'];
const EXCEL_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
];

interface BulkUploadCardProps {
    onUploaded?: () => void;
}

type UploadState =
    | { status: 'idle' }
    | { status: 'dragging' }
    | { status: 'parsing' }
    | { status: 'preview'; rows: ParsedRow[]; filename: string }
    | { status: 'pdf'; filename: string; sizeKb: string }
    | { status: 'uploading' }
    | { status: 'success'; result: ImportResult }
    | { status: 'pdf-success'; filename: string }
    | { status: 'error'; message: string };

// ─── Helpers ────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isPdf(file: File): boolean {
    return PDF_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
}

function isExcel(file: File): boolean {
    return EXCEL_TYPES.includes(file.type) ||
        /\.(xlsx?|csv)$/i.test(file.name);
}

async function parseExcel(file: File): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
                    defval: '',
                });
                const rows: ParsedRow[] = json.slice(0, MAX_PREVIEW_ROWS).map((row, i) => ({
                    rowIndex: i + 2, // fila 1 = header
                    nombreCompleto: String(row['nombreCompleto'] ?? row['Nombre'] ?? row['nombre_completo'] ?? ''),
                    carnetId: String(row['carnetId'] ?? row['Carnet'] ?? row['carnet_id'] ?? ''),
                    correoInstitucional: String(row['correoInstitucional'] ?? row['Correo'] ?? row['correo'] ?? ''),
                    semestreLectivo: String(row['semestreLectivo'] ?? row['Semestre'] ?? ''),
                    faseAcademica: String(row['faseAcademica'] ?? row['Fase'] ?? ''),
                    ...row,
                }));
                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Error leyendo el archivo.'));
        reader.readAsArrayBuffer(file);
    });
}

// ─── Componente ─────────────────────────────────────────────────────

const BulkUploadCard: React.FC<BulkUploadCardProps> = ({ onUploaded }) => {
    const [state, setState] = useState<UploadState>({ status: 'idle' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Almacena el archivo real para usarlo en el upload (evita perder la referencia)
    const selectedFileRef = useRef<File | null>(null);

    const handleFile = useCallback(async (file: File) => {
        selectedFileRef.current = file;
        setState({ status: 'parsing' });
        try {
            if (isPdf(file)) {
                setState({
                    status: 'pdf',
                    filename: file.name,
                    sizeKb: formatSize(file.size),
                });
            } else if (isExcel(file)) {
                const rows = await parseExcel(file);
                setState({ status: 'preview', rows, filename: file.name });
            } else {
                selectedFileRef.current = null;
                setState({ status: 'error', message: 'Formato no soportado. Usa .xlsx, .xls, .csv o .pdf.' });
            }
        } catch {
            selectedFileRef.current = null;
            setState({ status: 'error', message: 'No se pudo leer el archivo.' });
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setState({ status: 'idle' });
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setState((s) => s.status !== 'dragging' ? { status: 'dragging' } : s);
    };

    const handleDragLeave = () => {
        setState((s) => s.status === 'dragging' ? { status: 'idle' } : s);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // reset input para permitir re-selección del mismo archivo
        e.target.value = '';
    };

    const handleImport = async () => {
        if (state.status === 'preview') {
            setState({ status: 'uploading' });
            try {
                const result = await importStudents(state.rows);
                setState({ status: 'success', result });
                onUploaded?.();
            } catch {
                setState({ status: 'error', message: 'Error al importar. Intenta de nuevo.' });
            }
        } else if (state.status === 'pdf') {
            const filename = state.filename;
            const realFile = selectedFileRef.current;
            setState({ status: 'uploading' });
            try {
                await uploadPdf(realFile ?? new File([''], filename, { type: 'application/pdf' }));
                setState({ status: 'pdf-success', filename });
                onUploaded?.();
            } catch {
                setState({ status: 'error', message: 'Error al subir el PDF.' });
            }
        }
    };

    const handleReset = () => {
        selectedFileRef.current = null;
        setState({ status: 'idle' });
    };

    // ── Render por estado ───────────────────────────────────────────

    const isDragging = state.status === 'dragging';

    const handleDownloadTemplate = async () => {
        try {
            await downloadTemplate();
        } catch {
            // silencioso — el navegador muestra el error de red si aplica
        }
    };

    return (
        <div className="sn-card sn-card--bulk">
            <div className="sn-card__header">
                <CloudUpload size={20} className="sn-card__header-icon" />
                <h3 className="sn-card__title">Carga Masiva</h3>
                <button
                    type="button"
                    className="sn-btn-ghost sn-card__header-action"
                    onClick={handleDownloadTemplate}
                    title="Descargar plantilla Excel"
                >
                    <Download size={14} />
                    Plantilla
                </button>
            </div>

            <div className="sn-bulk-body">
                {/* ── Zona de arrastre (idle / dragging / parsing) ─────── */}
                {(state.status === 'idle' || state.status === 'dragging' || state.status === 'parsing') && (
                    <div
                        className={`sn-dropzone${isDragging ? ' sn-dropzone--over' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        role="region"
                        aria-label="Zona de arrastre de archivos"
                    >
                        <div className="sn-dropzone__icon-wrap">
                            <CloudUpload size={36} className="sn-dropzone__icon" />
                        </div>
                        <p className="sn-dropzone__title">
                            {state.status === 'parsing' ? 'Procesando archivo…' : 'Arrastra archivos aquí'}
                        </p>
                        <p className="sn-dropzone__sub">Acepta .pdf, .xlsx, .xls y .csv</p>
                        {state.status !== 'parsing' && (
                            <button
                                type="button"
                                className="sn-btn-primary sn-dropzone__btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Seleccionar Archivo
                            </button>
                        )}
                    </div>
                )}

                {/* ── Preview Excel ───────────────────────────────────── */}
                {state.status === 'preview' && (
                    <div className="sn-preview">
                        <div className="sn-preview__header">
                            <FileSpreadsheet size={16} className="sn-preview__file-icon" />
                            <span className="sn-preview__filename">{state.filename}</span>
                            <button className="sn-preview__close" aria-label="Cancelar" onClick={handleReset}>
                                <X size={14} />
                            </button>
                        </div>
                        <p className="sn-preview__meta">
                            {state.rows.length} fila{state.rows.length !== 1 ? 's' : ''} (máx. {MAX_PREVIEW_ROWS} mostradas)
                        </p>
                        <div className="sn-preview__table-wrap">
                            <table className="sn-preview__table">
                                <thead>
                                    <tr>
                                        <th className="sn-preview__th">Fila</th>
                                        <th className="sn-preview__th">Nombre</th>
                                        <th className="sn-preview__th">Carnet</th>
                                        <th className="sn-preview__th">Correo</th>
                                        <th className="sn-preview__th">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {state.rows.map((row) => {
                                        const hasError =
                                            !row.carnetId?.trim() ||
                                            (!!row.correoInstitucional &&
                                                !isInstitutionalEmail(row.correoInstitucional));
                                        return (
                                            <tr
                                                key={row.rowIndex}
                                                className={`sn-preview__row${hasError ? ' sn-preview__row--error' : ''}`}
                                            >
                                                <td className="sn-preview__td sn-preview__td--num">{row.rowIndex}</td>
                                                <td className="sn-preview__td">{row.nombreCompleto || '—'}</td>
                                                <td className="sn-preview__td">{row.carnetId || <span className="sn-preview__empty">vacío</span>}</td>
                                                <td className="sn-preview__td sn-preview__td--email">{row.correoInstitucional || '—'}</td>
                                                <td className="sn-preview__td">
                                                    {hasError ? (
                                                        <AlertCircle size={14} className="sn-preview__status-error" />
                                                    ) : (
                                                        <CheckCircle2 size={14} className="sn-preview__status-ok" />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="sn-preview__actions">
                            <button type="button" className="sn-btn-primary" onClick={handleImport}>
                                Importar {state.rows.length} Registros
                            </button>
                            <button type="button" className="sn-btn-ghost" onClick={handleReset}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PDF info ─────────────────────────────────────────── */}
                {state.status === 'pdf' && (
                    <div className="sn-pdf-info">
                        <FileText size={32} className="sn-pdf-info__icon" />
                        <p className="sn-pdf-info__name">{state.filename}</p>
                        <p className="sn-pdf-info__size">{state.sizeKb}</p>
                        <p className="sn-pdf-info__note">
                            El contenido del PDF se procesará en el servidor.
                        </p>
                        <div className="sn-preview__actions">
                            <button type="button" className="sn-btn-primary" onClick={handleImport}>
                                Subir PDF
                            </button>
                            <button type="button" className="sn-btn-ghost" onClick={handleReset}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Uploading ─────────────────────────────────────────── */}
                {state.status === 'uploading' && (
                    <div className="sn-uploading">
                        <div className="sn-uploading__spinner" aria-label="Subiendo…" />
                        <p className="sn-uploading__text">Procesando…</p>
                    </div>
                )}

                {/* ── Success Excel ─────────────────────────────────────── */}
                {state.status === 'success' && (
                    <div className="sn-result sn-result--success">
                        <CheckCircle2 size={28} className="sn-result__icon" />
                        <p className="sn-result__title">Importación completada</p>
                        <p className="sn-result__detail">
                            {state.result.imported} importados — {state.result.rejected} rechazados
                        </p>
                        {state.result.errors.length > 0 && (
                            <ul className="sn-result__errors">
                                {state.result.errors.slice(0, 5).map((e) => (
                                    <li key={e.row}>Fila {e.row}: {e.reason}</li>
                                ))}
                                {state.result.errors.length > 5 && (
                                    <li>…y {state.result.errors.length - 5} más</li>
                                )}
                            </ul>
                        )}
                        <button type="button" className="sn-btn-ghost" onClick={handleReset}>
                            Nueva Carga
                        </button>
                    </div>
                )}

                {/* ── Success PDF ───────────────────────────────────────── */}
                {state.status === 'pdf-success' && (
                    <div className="sn-result sn-result--success">
                        <CheckCircle2 size={28} className="sn-result__icon" />
                        <p className="sn-result__title">PDF subido correctamente</p>
                        <p className="sn-result__detail">{state.filename}</p>
                        <button type="button" className="sn-btn-ghost" onClick={handleReset}>
                            Nueva Carga
                        </button>
                    </div>
                )}

                {/* ── Error ─────────────────────────────────────────────── */}
                {state.status === 'error' && (
                    <div className="sn-result sn-result--error">
                        <AlertCircle size={28} className="sn-result__icon" />
                        <p className="sn-result__title">Error</p>
                        <p className="sn-result__detail">{state.message}</p>
                        <button type="button" className="sn-btn-ghost" onClick={handleReset}>
                            Intentar de nuevo
                        </button>
                    </div>
                )}

                {/* Info banner */}
                {(state.status === 'idle' || state.status === 'dragging') && (
                    <div className="sn-info-block">
                        <AlertCircle size={16} className="sn-info-block__icon" />
                        <div>
                            <p className="sn-info-block__title">Mapeo Automático de Datos</p>
                            <p className="sn-info-block__body">
                                El sistema identifica columnas por nombre: <code>nombreCompleto</code>,{' '}
                                <code>carnetId</code>, <code>correoInstitucional</code>, <code>faseAcademica</code>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Input de archivo oculto */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="sn-file-input"
                    onChange={handleInputChange}
                    aria-label="Seleccionar archivo"
                />
            </div>
        </div>
    );
};

export default BulkUploadCard;
