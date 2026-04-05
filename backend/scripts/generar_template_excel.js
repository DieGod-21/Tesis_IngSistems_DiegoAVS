/**
 * generar_template_excel.js
 *
 * Script para generar el archivo guía de carga masiva de estudiantes.
 * Produce: template_estudiantes.xlsx en la raíz del proyecto.
 *
 * Uso:
 *   node scripts/generar_template_excel.js
 *
 * El archivo generado incluye:
 *   - Hoja 1 "Estudiantes"  → plantilla con columnas, ejemplos y validaciones
 *   - Hoja 2 "Instrucciones" → guía de uso con reglas por campo
 *   - Hoja 3 "Fases_Validas" → tabla de referencia de fases académicas
 */

const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'template_estudiantes.xlsx');

// ─── Paleta de colores (UMG rojo + grises) ───────────────────────────────────

const ROJO_UMG    = 'FFC8102E';
const ROJO_CLARO  = 'FFFDE8EC';
const GRIS_CABEZA = 'FF334155';
const GRIS_FILA1  = 'FFF8FAFC';
const GRIS_FILA2  = 'FFFFFFFF';
const VERDE_OK    = 'FF16A34A';
const VERDE_CLARO = 'FFDCFCE7';
const AMARILLO    = 'FFD97706';
const AMARILLO_CL = 'FFFEF3C7';
const BLANCO      = 'FFFFFFFF';

async function generarTemplate() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema PG1-PG2 UMG';
    wb.created = new Date();
    wb.modified = new Date();

    // ═══════════════════════════════════════════════════════════════════
    //  HOJA 1: PLANTILLA DE ESTUDIANTES
    // ═══════════════════════════════════════════════════════════════════

    const wsEstudiantes = wb.addWorksheet('Estudiantes', {
        pageSetup: { paperSize: 9, orientation: 'landscape' },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    // ── Fila 1: título institucional ──────────────────────────────────
    wsEstudiantes.mergeCells('A1:D1');
    const celdaTitulo = wsEstudiantes.getCell('A1');
    celdaTitulo.value = 'Universidad Mariano Gálvez — Sistema de Gestión de Proyectos de Graduación';
    celdaTitulo.font = { name: 'Calibri', size: 14, bold: true, color: { argb: BLANCO } };
    celdaTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
    celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROJO_UMG } };
    wsEstudiantes.getRow(1).height = 32;

    // ── Fila 2: encabezados de columna ────────────────────────────────
    const columnas = [
        { header: 'Full Name *',      key: 'fullName',      width: 35 },
        { header: 'Carnet ID *',      key: 'carnetId',      width: 18 },
        { header: 'Academic Phase *', key: 'academicPhase', width: 22 },
        { header: 'Approved',         key: 'approved',      width: 14 },
    ];

    wsEstudiantes.columns = columnas;

    const filaEncabezado = wsEstudiantes.getRow(2);
    filaEncabezado.height = 26;
    columnas.forEach((col, i) => {
        const celda = filaEncabezado.getCell(i + 1);
        celda.value = col.header;
        celda.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BLANCO } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CABEZA } };
        celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        celda.border = {
            bottom: { style: 'medium', color: { argb: ROJO_UMG } },
            right:  { style: 'thin',   color: { argb: 'FF94A3B8' } },
        };
    });

    // ── Filas de ejemplo ──────────────────────────────────────────────
    const ejemplos = [
        {
            fullName:      'María Alejandra López Sánchez',
            carnetId:      '2021-00123',
            academicPhase: 'anteproyecto',
            approved:      'desaprobado',
        },
        {
            fullName:      'Juan Carlos Pérez García',
            carnetId:      '2019-00456',
            academicPhase: 'tesis',
            approved:      'desaprobado',
        },
        {
            fullName:      'Ana Beatriz Morales Cifuentes',
            carnetId:      '2020-00789',
            academicPhase: 'eps',
            approved:      'aprobado',
        },
        // Fila con error intencional — para ilustrar validación
        {
            fullName:      '',
            carnetId:      '2022-01010',
            academicPhase: 'fase_invalida',
            approved:      '',
        },
    ];

    ejemplos.forEach((ej, idx) => {
        const numFila = idx + 3;
        const fila = wsEstudiantes.getRow(numFila);
        fila.height = 22;

        const valores = [
            ej.fullName,
            ej.carnetId,
            ej.academicPhase,
            ej.approved,
        ];

        const esFilaError = idx === 3; // última fila tiene errores intencionales
        const bgColor = esFilaError ? ROJO_CLARO : (idx % 2 === 0 ? GRIS_FILA1 : GRIS_FILA2);

        valores.forEach((val, colIdx) => {
            const celda = fila.getCell(colIdx + 1);
            celda.value = val;
            celda.font = { name: 'Calibri', size: 10 };
            celda.alignment = { vertical: 'middle' };
            celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            celda.border = {
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
        });
    });

    // Nota sobre la fila de error
    wsEstudiantes.mergeCells('A7:D7');
    const celdaNota = wsEstudiantes.getCell('A7');
    celdaNota.value = '⚠ Fila 6 contiene errores intencionales para ilustrar la validación. El backend rechazará filas inválidas e informará el motivo.';
    celdaNota.font = { name: 'Calibri', size: 10, italic: true, color: { argb: AMARILLO } };
    celdaNota.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMARILLO_CL } };
    celdaNota.alignment = { horizontal: 'left', vertical: 'middle' };
    wsEstudiantes.getRow(7).height = 20;

    // Separador visual
    wsEstudiantes.mergeCells('A8:D8');
    const celdaSep = wsEstudiantes.getCell('A8');
    celdaSep.value = '↓  Agrega tus datos a partir de aquí (fila 9)  ↓';
    celdaSep.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BLANCO } };
    celdaSep.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CABEZA } };
    celdaSep.alignment = { horizontal: 'center', vertical: 'middle' };
    wsEstudiantes.getRow(8).height = 20;

    // ── Validación de Academic Phase (C) ─────────────────────────────
    wsEstudiantes.dataValidations.add('C9:C1048576', {
        type: 'list',
        allowBlank: false,
        formulae: ['"anteproyecto,tesis,eps"'],
        showErrorMessage: true,
        errorTitle: 'Fase inválida',
        error: 'El valor debe ser: anteproyecto, tesis o eps',
        showDropDown: false,
    });

    // ── Validación de Approved (D) ────────────────────────────────────
    wsEstudiantes.dataValidations.add('D9:D1048576', {
        type: 'list',
        allowBlank: true,
        formulae: ['"aprobado,desaprobado"'],
        showErrorMessage: true,
        errorTitle: 'Valor inválido',
        error: 'Solo se acepta "aprobado" o "desaprobado"',
    });

    // ═══════════════════════════════════════════════════════════════════
    //  HOJA 2: INSTRUCCIONES
    // ═══════════════════════════════════════════════════════════════════

    const wsInstrucciones = wb.addWorksheet('Instrucciones');

    const instrucciones = [
        ['GUÍA DE USO — CARGA MASIVA DE ESTUDIANTES', '', '', ''],
        ['', '', '', ''],
        ['COLUMNAS OBLIGATORIAS (marcadas con *)', '', '', ''],
        ['Columna', 'Nombre en Excel',  'Descripción',                                      'Ejemplo'],
        ['A',       'Full Name',        'Nombre completo del estudiante',                   'María Alejandra López Sánchez'],
        ['B',       'Carnet ID',        'Número de carnet UMG (único)',                     '2021-00123'],
        ['C',       'Academic Phase',   'Fase académica (ver Hoja Fases_Validas)',           'tesis'],
        ['', '', '', ''],
        ['COLUMNAS OPCIONALES', '', '', ''],
        ['Columna', 'Nombre en Excel', 'Descripción',                                       'Valor por defecto'],
        ['D',       'Approved',        '"aprobado" si el expediente está aprobado, "desaprobado" si no', 'desaprobado'],
        ['', '', '', ''],
        ['REGLAS DE VALIDACIÓN', '', '', ''],
        ['Regla',          'Descripción', '', ''],
        ['Carnet único',   'No se puede repetir Carnet ID en la misma carga ni en la BD', '', ''],
        ['Fase requerida', 'Debe coincidir con un valor válido en la columna C (menú desplegable)', '', ''],
        ['Nombre requerido', 'Full Name no puede estar vacío', '', ''],
        ['Aprobado',       'Solo acepta "aprobado" o "desaprobado". Vacío equivale a "desaprobado"', '', ''],
        ['', '', '', ''],
        ['PROCESO DE CARGA', '', '', ''],
        ['Paso', 'Acción', '', ''],
        ['1', 'Completa este archivo a partir de la fila 9 de la hoja "Students"', '', ''],
        ['2', 'Guarda el archivo como .xlsx (Excel 2007+)', '', ''],
        ['3', 'Ve a la sección "Registrar Estudiante" → "Carga Masiva" en el sistema', '', ''],
        ['4', 'Arrastra o selecciona el archivo', '', ''],
        ['5', 'Revisa la vista previa y haz clic en "Importar X Registros"', '', ''],
        ['6', 'El sistema mostrará cuántos se importaron y cuáles fueron rechazados', '', ''],
        ['', '', '', ''],
        ['RESULTADO DE LA CARGA', '', '', ''],
        ['Campo',       'Descripción', '', ''],
        ['importados',  'Cantidad de filas insertadas exitosamente', '', ''],
        ['rechazados',  'Cantidad de filas que fallaron la validación', '', ''],
        ['errores[]',   'Lista con fila, carnet y motivo del rechazo por cada fila fallida', '', ''],
        ['', '', '', ''],
        ['SOPORTE', '', '', ''],
        ['Para dudas, comunícate con el administrador del sistema PG1-PG2.', '', '', ''],
    ];

    instrucciones.forEach((row, rowIdx) => {
        const wsRow = wsInstrucciones.getRow(rowIdx + 1);
        row.forEach((val, colIdx) => {
            const celda = wsRow.getCell(colIdx + 1);
            celda.value = val;
            celda.font = { name: 'Calibri', size: 10 };
            celda.alignment = { vertical: 'middle', wrapText: true };
        });

        // Estilo especial para filas de título de sección
        const primerVal = String(row[0] ?? '');
        if (primerVal.match(/^(GUÍA|COLUMNAS|REGLAS|PROCESO|RESULTADO|SOPORTE)/)) {
            wsRow.eachCell((c) => {
                c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BLANCO } };
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowIdx === 0 ? ROJO_UMG : GRIS_CABEZA } };
            });
            wsRow.height = 24;
        }

        // Encabezados de tabla internos
        if (primerVal === 'Columna' || primerVal === 'Regla' || primerVal === 'Paso' || primerVal === 'Campo') {
            wsRow.eachCell((c) => {
                c.font = { name: 'Calibri', size: 10, bold: true };
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
            });
        }
    });

    wsInstrucciones.getColumn(1).width = 18;
    wsInstrucciones.getColumn(2).width = 30;
    wsInstrucciones.getColumn(3).width = 55;
    wsInstrucciones.getColumn(4).width = 35;

    // ═══════════════════════════════════════════════════════════════════
    //  HOJA 3: REFERENCIA DE FASES
    // ═══════════════════════════════════════════════════════════════════

    const wsFases = wb.addWorksheet('Fases_Validas');

    const fasesData = [
        ['FASES ACADÉMICAS VÁLIDAS — Referencia del Sistema', '', ''],
        ['Valor en Excel (Academic Phase)', 'Nombre completo', 'Descripción'],
        ['anteproyecto', 'Anteproyecto de Tesis', 'Estudiante en etapa de propuesta y aprobación del anteproyecto'],
        ['tesis', 'Tesis de Grado', 'Estudiante desarrollando su proyecto de tesis (PG1/PG2)'],
        ['eps', 'Ejercicio Profesional Supervisado', 'Estudiante en fase de práctica supervisada (EPS)'],
        ['', '', ''],
        ['IMPORTANTE: El valor debe escribirse exactamente como aparece en la columna "Valor en Excel".', '', ''],
        ['La columna C (Academic Phase) de la hoja Students tiene un menú desplegable con las opciones válidas.', '', ''],
    ];

    fasesData.forEach((row, rowIdx) => {
        const wsRow = wsFases.getRow(rowIdx + 1);
        row.forEach((val, colIdx) => {
            const celda = wsRow.getCell(colIdx + 1);
            celda.value = val;
            celda.font = { name: 'Calibri', size: 10 };
            celda.alignment = { vertical: 'middle', wrapText: true };
        });

        if (rowIdx === 0) {
            wsFases.mergeCells('A1:C1');
            wsRow.eachCell((c) => {
                c.font = { name: 'Calibri', size: 13, bold: true, color: { argb: BLANCO } };
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROJO_UMG } };
                c.alignment = { horizontal: 'center', vertical: 'middle' };
            });
            wsRow.height = 30;
        }
        if (rowIdx === 1) {
            wsRow.eachCell((c) => {
                c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BLANCO } };
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CABEZA } };
            });
            wsRow.height = 22;
        }
        if ([2, 3, 4].includes(rowIdx)) {
            wsRow.getCell(1).font = { name: 'Calibri Mono', size: 10, bold: true, color: { argb: ROJO_UMG } };
            wsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROJO_CLARO } };
            wsRow.height = 36;
        }
        if (rowIdx >= 6) {
            wsFases.mergeCells(`A${rowIdx + 1}:C${rowIdx + 1}`);
            wsRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: AMARILLO } };
            wsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMARILLO_CL } };
        }
    });

    wsFases.getColumn(1).width = 20;
    wsFases.getColumn(2).width = 35;
    wsFases.getColumn(3).width = 55;

    // ── Guardar archivo ──────────────────────────────────────────────
    await wb.xlsx.writeFile(OUTPUT_PATH);
    console.log(`\n✓ Template generado: ${OUTPUT_PATH}`);
    console.log('  Hojas: Estudiantes | Instrucciones | Fases_Validas');
    console.log('  Comparte este archivo con los usuarios para la carga masiva.\n');
}

generarTemplate().catch((err) => {
    console.error('Error al generar el template:', err.message);
    process.exit(1);
});
