/**
 * swagger.js
 *
 * Configuración de Swagger UI + OpenAPI 3.0
 * Acceso: GET /api-docs
 *
 * Universidad Mariano Gálvez — Sistema de Gestión de Proyectos de Graduación
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API — Sistema de Proyectos de Graduación',
            version: '1.0.0',
            description:
                'API REST para la gestión de proyectos de graduación de la Universidad Mariano Gálvez. ' +
                'Incluye autenticación JWT, gestión de estudiantes, proyectos, semestres, entregables, ' +
                'evaluaciones, eventos y fechas límite.',
            contact: {
                name: 'Diego Vasquez',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor de desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido desde POST /auth/login',
                },
            },
            schemas: {
                // ── Auth ───────────────────────────────────────────────
                LoginRequest: {
                    type: 'object',
                    required: ['correo_electronico', 'contrasena'],
                    properties: {
                        correo_electronico: {
                            type: 'string',
                            format: 'email',
                            example: 'admin@umg.edu.gt',
                        },
                        contrasena: {
                            type: 'string',
                            minLength: 8,
                            example: 'contraseña123',
                        },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            description: 'Token JWT con expiración de 1 hora',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                    },
                },
                // ── Usuarios ───────────────────────────────────────────
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        nombre_completo: { type: 'string', example: 'Juan Pérez García' },
                        correo_electronico: { type: 'string', format: 'email', example: 'jperez@umg.edu.gt' },
                        estado: { type: 'string', enum: ['activo', 'inactivo', 'suspendido'] },
                        roles: { type: 'array', items: { type: 'string' }, example: ['admin'] },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                UserCreate: {
                    type: 'object',
                    required: ['nombre_completo', 'correo_electronico', 'contrasena'],
                    properties: {
                        nombre_completo: { type: 'string', example: 'Juan Pérez García' },
                        correo_electronico: { type: 'string', format: 'email', example: 'jperez@umg.edu.gt' },
                        contrasena: { type: 'string', minLength: 8, example: 'contraseña123' },
                        estado: { type: 'string', enum: ['activo', 'inactivo', 'suspendido'], default: 'activo' },
                        roles: { type: 'array', items: { type: 'string' }, example: ['asesor'] },
                    },
                },
                // ── Estudiantes ────────────────────────────────────────
                Student: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        nombre_completo: { type: 'string', example: 'María López Sánchez' },
                        carnet_id: { type: 'string', example: '2021-00123' },
                        correo_institucional: { type: 'string', format: 'email', example: 'mlopez@miumg.edu.gt' },
                        fase_academica: { type: 'string', enum: ['anteproyecto', 'tesis', 'eps'] },
                        semester_id: { type: 'string', format: 'uuid', nullable: true },
                        approved: { type: 'boolean', default: false },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                StudentCreate: {
                    type: 'object',
                    required: ['nombre_completo', 'carnet_id', 'correo_institucional', 'fase_academica'],
                    properties: {
                        nombre_completo: { type: 'string', example: 'María López Sánchez' },
                        carnet_id: { type: 'string', example: '2021-00123' },
                        correo_institucional: { type: 'string', format: 'email', example: 'mlopez@miumg.edu.gt' },
                        fase_academica: { type: 'string', enum: ['anteproyecto', 'tesis', 'eps'] },
                        semester_id: { type: 'string', format: 'uuid', nullable: true },
                        approved: { type: 'boolean', default: false },
                    },
                },
                // ── Semestres ──────────────────────────────────────────
                Semester: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        nombre: { type: 'string', example: 'Primer Semestre 2026' },
                        anio: { type: 'integer', example: 2026 },
                        numero: { type: 'integer', enum: [1, 2], example: 1 },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                SemesterCreate: {
                    type: 'object',
                    required: ['nombre', 'anio', 'numero'],
                    properties: {
                        nombre: { type: 'string', example: 'Primer Semestre 2026' },
                        anio: { type: 'integer', example: 2026 },
                        numero: { type: 'integer', enum: [1, 2], example: 1 },
                    },
                },
                // ── Proyectos ──────────────────────────────────────────
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        titulo: { type: 'string', example: 'Sistema de Gestión Académica' },
                        descripcion: { type: 'string', nullable: true },
                        fase_academica: { type: 'string', enum: ['anteproyecto', 'tesis', 'eps'] },
                        estado: { type: 'string', enum: ['activo', 'inactivo', 'completado', 'cancelado'] },
                        semester_id: { type: 'string', format: 'uuid', nullable: true },
                        estudiantes: { type: 'array', items: { type: 'object' } },
                        asesores: { type: 'array', items: { type: 'object' } },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                ProjectCreate: {
                    type: 'object',
                    required: ['titulo', 'fase_academica'],
                    properties: {
                        titulo: { type: 'string', example: 'Sistema de Gestión Académica' },
                        descripcion: { type: 'string', nullable: true },
                        fase_academica: { type: 'string', enum: ['anteproyecto', 'tesis', 'eps'] },
                        estado: { type: 'string', enum: ['activo', 'inactivo', 'completado', 'cancelado'], default: 'activo' },
                        semester_id: { type: 'string', format: 'uuid', nullable: true },
                    },
                },
                // ── Entregables ────────────────────────────────────────
                Deliverable: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        project_id: { type: 'string', format: 'uuid' },
                        template_id: { type: 'string', format: 'uuid', nullable: true },
                        titulo: { type: 'string' },
                        descripcion: { type: 'string', nullable: true },
                        fecha_limite: { type: 'string', format: 'date-time', nullable: true },
                        estado: { type: 'string', enum: ['pendiente', 'entregado', 'revisado', 'aprobado', 'rechazado'] },
                    },
                },
                // ── Evaluaciones ───────────────────────────────────────
                Evaluation: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        project_id: { type: 'string', format: 'uuid' },
                        titulo: { type: 'string' },
                        tipo: { type: 'string', enum: ['parcial', 'final', 'seguimiento'] },
                        estado: { type: 'string', enum: ['borrador', 'publicado', 'cerrado'] },
                        fecha: { type: 'string', format: 'date-time', nullable: true },
                        calificacion: { type: 'number', nullable: true },
                    },
                },
                // ── Eventos ────────────────────────────────────────────
                Event: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        titulo: { type: 'string', example: 'Defensa de Anteproyecto' },
                        tipo: { type: 'string', enum: ['defensa', 'reunion', 'revision', 'entrega', 'otro'] },
                        fecha: { type: 'string', format: 'date-time' },
                        descripcion: { type: 'string', nullable: true },
                        project_id: { type: 'string', format: 'uuid', nullable: true },
                    },
                },
                // ── Deadlines ──────────────────────────────────────────
                Deadline: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        titulo: { type: 'string', example: 'Entrega de Capítulos I-III' },
                        descripcion: { type: 'string', nullable: true },
                        fecha_limite: { type: 'string', format: 'date-time' },
                        semester_id: { type: 'string', format: 'uuid', nullable: true },
                        fase_academica: { type: 'string', enum: ['anteproyecto', 'tesis', 'eps'], nullable: true },
                    },
                },
                // ── Error genérico ─────────────────────────────────────
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Descripción del error' },
                    },
                },
            },
        },
    },
    apis: [], // Las rutas se definen directamente en paths
};

// ─── Definición de rutas (paths) ──────────────────────────────────────────────

const swaggerSpec = swaggerJsdoc(options);

// Inyectamos los paths manualmente para tener control total sobre la documentación
swaggerSpec.paths = {

    // ── Auth ───────────────────────────────────────────────────────────────
    '/auth/login': {
        post: {
            tags: ['Autenticación'],
            summary: 'Iniciar sesión',
            description: [
                'Autentica al usuario con correo y contraseña.',
                'Retorna un **token JWT** válido por 1 hora.',
                '',
                '**Cómo usar el token:**',
                '1. Ejecuta este endpoint y copia el valor de `token`',
                '2. Haz clic en el botón **Authorize** (candado) en la parte superior',
                '3. Pega solo el token (sin comillas) en el campo **Value**',
                '4. Todos los endpoints protegidos usarán el token automáticamente',
            ].join('\n'),
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/LoginRequest' },
                        example: {
                            correo_electronico: 'admin@demo.com',
                            contrasena: 'admin123',
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Autenticación exitosa — copia el token para usar en los demás endpoints',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginResponse' },
                            example: {
                                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYjEwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNzc1MDAwMDAwLCJleHAiOjE3NzUwMDM2MDB9.FIRMA_EJEMPLO',
                            },
                        },
                    },
                },
                400: {
                    description: 'Faltan campos obligatorios',
                    content: { 'application/json': { example: { error: 'correo_electronico y contrasena son requeridos' } } },
                },
                401: {
                    description: 'Credenciales inválidas',
                    content: { 'application/json': { example: { error: 'Credenciales inválidas' } } },
                },
                403: {
                    description: 'Cuenta inactiva o suspendida',
                    content: { 'application/json': { example: { error: 'Cuenta no disponible' } } },
                },
            },
        },
    },

    // ── Usuarios ───────────────────────────────────────────────────────────
    '/users': {
        get: {
            tags: ['Usuarios'],
            summary: 'Listar usuarios',
            description: 'Retorna todos los usuarios del sistema con sus roles. Solo accesible por administradores.',
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: 'Lista de usuarios', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos (requiere rol admin)' },
            },
        },
        post: {
            tags: ['Usuarios'],
            summary: 'Crear usuario',
            description: 'Crea un nuevo usuario con contraseña hasheada. Solo admin.',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } },
            },
            responses: {
                201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
                400: { description: 'Datos inválidos o email duplicado' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
            },
        },
    },
    '/users/{id}': {
        get: {
            tags: ['Usuarios'],
            summary: 'Obtener usuario por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: { description: 'Usuario encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
                400: { description: 'UUID inválido' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
                404: { description: 'Usuario no encontrado' },
            },
        },
        put: {
            tags: ['Usuarios'],
            summary: 'Actualizar usuario',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } },
            },
            responses: {
                200: { description: 'Usuario actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
                400: { description: 'Datos inválidos' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
                404: { description: 'Usuario no encontrado' },
            },
        },
        delete: {
            tags: ['Usuarios'],
            summary: 'Eliminar usuario',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                204: { description: 'Usuario eliminado' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
                404: { description: 'Usuario no encontrado' },
            },
        },
    },

    // ── Estudiantes ────────────────────────────────────────────────────────
    '/students': {
        get: {
            tags: ['Estudiantes'],
            summary: 'Listar estudiantes',
            description: 'Retorna la lista de estudiantes. Soporta filtros por fase, semestre y estado de aprobación.',
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'fase_academica', in: 'query', schema: { type: 'string', enum: ['anteproyecto', 'tesis', 'eps'] }, description: 'Filtrar por fase académica' },
                { name: 'semester_id', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por semestre' },
                { name: 'approved', in: 'query', schema: { type: 'boolean' }, description: 'Filtrar por estado de aprobación (true/false)' },
            ],
            responses: {
                200: {
                    description: 'Lista de estudiantes',
                    content: {
                        'application/json': {
                            schema: { type: 'array', items: { $ref: '#/components/schemas/Student' } },
                            example: [
                                {
                                    id: 'a1b2c3d4-0000-0000-0000-000000000001',
                                    nombre_completo: 'María Alejandra López Sánchez',
                                    carnet_id: '2021-00123',
                                    correo_institucional: 'malopez@miumg.edu.gt',
                                    fase_academica: 'tesis',
                                    semester_id: 'sem-uuid-001',
                                    approved: false,
                                    semestre: 'Primer Semestre 2026',
                                    created_at: '2026-01-15T10:00:00.000Z',
                                    updated_at: '2026-01-15T10:00:00.000Z',
                                },
                            ],
                        },
                    },
                },
                401: { description: 'Token no proporcionado o inválido', content: { 'application/json': { example: { error: 'Token de autenticación requerido' } } } },
                403: { description: 'Sin permisos (requiere admin o asesor)', content: { 'application/json': { example: { error: 'No tienes permisos para esta operación' } } } },
            },
        },
        post: {
            tags: ['Estudiantes'],
            summary: 'Registrar estudiante individual',
            description: 'Crea un nuevo estudiante. El campo `carnet_id` debe ser único en toda la base de datos.',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/StudentCreate' },
                        example: {
                            nombre_completo: 'Juan Carlos Pérez García',
                            carnet_id: '2019-00456',
                            correo_institucional: 'jcperez@miumg.edu.gt',
                            fase_academica: 'tesis',
                            semester_id: 'uuid-del-semestre',
                            approved: false,
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Estudiante registrado exitosamente',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Student' },
                            example: {
                                id: 'new-uuid-generado',
                                nombre_completo: 'Juan Carlos Pérez García',
                                carnet_id: '2019-00456',
                                correo_institucional: 'jcperez@miumg.edu.gt',
                                fase_academica: 'tesis',
                                semester_id: 'uuid-del-semestre',
                                approved: false,
                                created_at: '2026-04-03T10:00:00.000Z',
                                updated_at: '2026-04-03T10:00:00.000Z',
                            },
                        },
                    },
                },
                400: { description: 'Datos inválidos o faltantes', content: { 'application/json': { example: { error: 'nombre_completo, carnet_id, correo_institucional, fase_academica y semester_id son requeridos' } } } },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
            },
        },
    },

    '/students/bulk': {
        post: {
            tags: ['Estudiantes'],
            summary: 'Carga masiva de estudiantes',
            description: [
                'Importa múltiples estudiantes en una sola petición.',
                '',
                '**Comportamiento:**',
                '- Valida cada fila antes de insertar',
                '- Las filas válidas se insertan aunque haya filas inválidas',
                '- Retorna un resumen con conteo y errores por fila',
                '',
                '**Casos de rechazo por fila:**',
                '- `nombre_completo` vacío',
                '- `carnet_id` vacío o duplicado (en la carga o en la BD)',
                '- `correo_institucional` con formato inválido',
                '- `fase_academica` fuera de: `anteproyecto`, `tesis`, `eps`',
                '- `semester_id` faltante',
                '',
                '**Plantilla Excel:** Descarga `template_estudiantes.xlsx` de la raíz del proyecto para formato correcto.',
            ].join('\n'),
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['filas'],
                            properties: {
                                filas: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/StudentCreate' },
                                    minItems: 1,
                                },
                            },
                        },
                        example: {
                            filas: [
                                {
                                    nombre_completo: 'María Alejandra López',
                                    carnet_id: '2021-00123',
                                    correo_institucional: 'malopez@miumg.edu.gt',
                                    fase_academica: 'anteproyecto',
                                    semester_id: 'uuid-semestre',
                                    approved: false,
                                },
                                {
                                    nombre_completo: 'Juan Pérez',
                                    carnet_id: '2019-00456',
                                    correo_institucional: 'jperez@miumg.edu.gt',
                                    fase_academica: 'tesis',
                                    semester_id: 'uuid-semestre',
                                    approved: false,
                                },
                            ],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Carga procesada — revisa `rechazados` y `errores` para filas fallidas',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    importados: { type: 'integer', description: 'Filas insertadas correctamente' },
                                    rechazados: { type: 'integer', description: 'Filas que fallaron validación o BD' },
                                    total:      { type: 'integer', description: 'Total de filas recibidas' },
                                    errores: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                fila:      { type: 'integer', description: 'Número de fila (base 2, Excel-compatible)' },
                                                carnet_id: { type: 'string' },
                                                razon:     { type: 'string', description: 'Motivo del rechazo' },
                                            },
                                        },
                                    },
                                },
                            },
                            example: {
                                importados: 1,
                                rechazados: 1,
                                total: 2,
                                errores: [
                                    { fila: 3, carnet_id: '2019-00456', razon: 'El carnet ya existe en la base de datos' },
                                ],
                            },
                        },
                    },
                },
                400: { description: 'Body inválido (no es array o está vacío)', content: { 'application/json': { example: { error: 'Se requiere un array "filas" en el body' } } } },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos (requiere admin o asesor)' },
            },
        },
    },
    '/students/{id}': {
        get: {
            tags: ['Estudiantes'],
            summary: 'Obtener estudiante por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: { description: 'Estudiante encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Student' } } } },
                400: { description: 'UUID inválido' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
                404: { description: 'Estudiante no encontrado' },
            },
        },
        put: {
            tags: ['Estudiantes'],
            summary: 'Actualizar estudiante',
            description: 'Actualiza datos de un estudiante (incluyendo campo `approved` para aprobación).',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/StudentCreate' } } },
            },
            responses: {
                200: { description: 'Estudiante actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Student' } } } },
                400: { description: 'Datos inválidos' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
                404: { description: 'Estudiante no encontrado' },
            },
        },
        delete: {
            tags: ['Estudiantes'],
            summary: 'Eliminar estudiante',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                204: { description: 'Estudiante eliminado' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos' },
                404: { description: 'Estudiante no encontrado' },
            },
        },
    },

    // ── Semestres ──────────────────────────────────────────────────────────
    '/semesters': {
        get: {
            tags: ['Semestres'],
            summary: 'Listar semestres',
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: 'Lista de semestres', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Semester' } } } } },
                401: { description: 'No autenticado' },
            },
        },
        post: {
            tags: ['Semestres'],
            summary: 'Crear semestre',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/SemesterCreate' } } },
            },
            responses: {
                201: { description: 'Semestre creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Semester' } } } },
                400: { description: 'Datos inválidos' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos (requiere admin)' },
            },
        },
    },
    '/semesters/{id}': {
        get: {
            tags: ['Semestres'],
            summary: 'Obtener semestre por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: { description: 'Semestre encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Semester' } } } },
                404: { description: 'Semestre no encontrado' },
            },
        },
        put: {
            tags: ['Semestres'],
            summary: 'Actualizar semestre',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/SemesterCreate' } } },
            },
            responses: {
                200: { description: 'Semestre actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Semester' } } } },
                404: { description: 'Semestre no encontrado' },
            },
        },
    },

    // ── Proyectos ──────────────────────────────────────────────────────────
    '/projects': {
        get: {
            tags: ['Proyectos'],
            summary: 'Listar proyectos',
            description: 'Retorna proyectos con estudiantes y asesores asociados. Soporta filtros.',
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'estado', in: 'query', schema: { type: 'string', enum: ['activo', 'inactivo', 'completado', 'cancelado'] } },
                { name: 'fase_academica', in: 'query', schema: { type: 'string', enum: ['anteproyecto', 'tesis', 'eps'] } },
                { name: 'semester_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            ],
            responses: {
                200: { description: 'Lista de proyectos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } },
                401: { description: 'No autenticado' },
            },
        },
        post: {
            tags: ['Proyectos'],
            summary: 'Crear proyecto',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectCreate' } } },
            },
            responses: {
                201: { description: 'Proyecto creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
                400: { description: 'Datos inválidos' },
                401: { description: 'No autenticado' },
                403: { description: 'Sin permisos (requiere admin o asesor)' },
            },
        },
    },
    '/projects/{id}': {
        get: {
            tags: ['Proyectos'],
            summary: 'Obtener proyecto por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: { description: 'Proyecto encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
                404: { description: 'Proyecto no encontrado' },
            },
        },
        put: {
            tags: ['Proyectos'],
            summary: 'Actualizar proyecto',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectCreate' } } },
            },
            responses: {
                200: { description: 'Proyecto actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
                403: { description: 'Sin permisos' },
                404: { description: 'Proyecto no encontrado' },
            },
        },
    },
    '/projects/by-student/{student_id}': {
        get: {
            tags: ['Proyectos'],
            summary: 'Proyectos de un estudiante',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'student_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: { description: 'Proyectos del estudiante', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } },
                401: { description: 'No autenticado' },
            },
        },
    },

    // ── Entregables ────────────────────────────────────────────────────────
    '/deliverables/templates': {
        get: {
            tags: ['Entregables'],
            summary: 'Listar plantillas de entregables',
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: 'Lista de plantillas' },
                401: { description: 'No autenticado' },
            },
        },
        post: {
            tags: ['Entregables'],
            summary: 'Crear plantilla de entregable',
            security: [{ BearerAuth: [] }],
            requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { titulo: { type: 'string' }, descripcion: { type: 'string' } } } } } },
            responses: {
                201: { description: 'Plantilla creada' },
                403: { description: 'Sin permisos (requiere admin o asesor)' },
            },
        },
    },
    '/deliverables/templates/{id}': {
        get: {
            tags: ['Entregables'],
            summary: 'Obtener plantilla por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Plantilla encontrada' }, 404: { description: 'No encontrada' } },
        },
    },
    '/deliverables/project/{project_id}': {
        get: {
            tags: ['Entregables'],
            summary: 'Entregables de un proyecto',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'project_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Lista de entregables del proyecto', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Deliverable' } } } } } },
        },
    },
    '/deliverables': {
        post: {
            tags: ['Entregables'],
            summary: 'Crear entregable',
            security: [{ BearerAuth: [] }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Deliverable' } } } },
            responses: { 201: { description: 'Entregable creado' }, 403: { description: 'Sin permisos' } },
        },
    },
    '/deliverables/{id}': {
        get: {
            tags: ['Entregables'],
            summary: 'Obtener entregable por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Entregable encontrado' }, 404: { description: 'No encontrado' } },
        },
        put: {
            tags: ['Entregables'],
            summary: 'Actualizar entregable',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Deliverable' } } } },
            responses: { 200: { description: 'Entregable actualizado' }, 403: { description: 'Sin permisos' } },
        },
    },

    // ── Evaluaciones ───────────────────────────────────────────────────────
    '/evaluations': {
        get: {
            tags: ['Evaluaciones'],
            summary: 'Listar evaluaciones',
            security: [{ BearerAuth: [] }],
            responses: { 200: { description: 'Lista de evaluaciones', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Evaluation' } } } } }, 401: { description: 'No autenticado' } },
        },
        post: {
            tags: ['Evaluaciones'],
            summary: 'Crear evaluación',
            security: [{ BearerAuth: [] }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Evaluation' } } } },
            responses: { 201: { description: 'Evaluación creada' }, 403: { description: 'Sin permisos (requiere admin o asesor)' } },
        },
    },
    '/evaluations/{id}': {
        get: {
            tags: ['Evaluaciones'],
            summary: 'Obtener evaluación por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Evaluación encontrada' }, 404: { description: 'No encontrada' } },
        },
        put: {
            tags: ['Evaluaciones'],
            summary: 'Actualizar evaluación',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Evaluation' } } } },
            responses: { 200: { description: 'Evaluación actualizada' } },
        },
        delete: {
            tags: ['Evaluaciones'],
            summary: 'Eliminar evaluación',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 204: { description: 'Evaluación eliminada' } },
        },
    },

    // ── Eventos ────────────────────────────────────────────────────────────
    '/events': {
        get: {
            tags: ['Eventos'],
            summary: 'Listar eventos',
            security: [{ BearerAuth: [] }],
            responses: { 200: { description: 'Lista de eventos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Event' } } } } }, 401: { description: 'No autenticado' } },
        },
        post: {
            tags: ['Eventos'],
            summary: 'Crear evento',
            security: [{ BearerAuth: [] }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } },
            responses: { 201: { description: 'Evento creado' }, 403: { description: 'Sin permisos (requiere admin o asesor)' } },
        },
    },
    '/events/{id}': {
        get: {
            tags: ['Eventos'],
            summary: 'Obtener evento por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Evento encontrado' }, 404: { description: 'No encontrado' } },
        },
        put: {
            tags: ['Eventos'],
            summary: 'Actualizar evento',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } },
            responses: { 200: { description: 'Evento actualizado' } },
        },
        delete: {
            tags: ['Eventos'],
            summary: 'Eliminar evento',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 204: { description: 'Evento eliminado' } },
        },
    },

    // ── Fechas Límite ──────────────────────────────────────────────────────
    '/deadlines': {
        get: {
            tags: ['Fechas Límite'],
            summary: 'Listar fechas límite',
            security: [{ BearerAuth: [] }],
            responses: { 200: { description: 'Lista de fechas límite', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Deadline' } } } } }, 401: { description: 'No autenticado' } },
        },
        post: {
            tags: ['Fechas Límite'],
            summary: 'Crear fecha límite',
            security: [{ BearerAuth: [] }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Deadline' } } } },
            responses: { 201: { description: 'Fecha límite creada' }, 403: { description: 'Sin permisos' } },
        },
    },
    '/deadlines/{id}': {
        get: {
            tags: ['Fechas Límite'],
            summary: 'Obtener fecha límite por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Fecha límite encontrada' }, 404: { description: 'No encontrada' } },
        },
        put: {
            tags: ['Fechas Límite'],
            summary: 'Actualizar fecha límite',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Deadline' } } } },
            responses: { 200: { description: 'Fecha límite actualizada' } },
        },
        delete: {
            tags: ['Fechas Límite'],
            summary: 'Eliminar fecha límite',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 204: { description: 'Fecha límite eliminada' } },
        },
    },

    // ── Entregas (Submissions) ─────────────────────────────────────────────
    '/submissions': {
        post: {
            tags: ['Entregas'],
            summary: 'Registrar entrega',
            description: 'Crea una nueva entrega. El campo submitted_by se toma del token JWT.',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['deliverable_id'],
                            properties: {
                                deliverable_id: { type: 'string', format: 'uuid' },
                                url_archivo: { type: 'string', format: 'uri', nullable: true },
                                comentarios: { type: 'string', nullable: true },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Entrega registrada exitosamente' },
                400: { description: 'Datos inválidos' },
                401: { description: 'No autenticado' },
            },
        },
    },
    '/submissions/by-deliverable/{deliverable_id}': {
        get: {
            tags: ['Entregas'],
            summary: 'Entregas de un entregable',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'deliverable_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Lista de entregas del entregable' }, 401: { description: 'No autenticado' } },
        },
    },
    '/submissions/{id}': {
        get: {
            tags: ['Entregas'],
            summary: 'Obtener entrega por ID',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Entrega encontrada' }, 404: { description: 'No encontrada' } },
        },
    },
    '/submissions/{id}/observations': {
        get: {
            tags: ['Entregas'],
            summary: 'Observaciones de una entrega',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Lista de observaciones' }, 401: { description: 'No autenticado' } },
        },
        post: {
            tags: ['Entregas'],
            summary: 'Agregar observación a una entrega',
            description: 'Solo admin y asesor pueden agregar observaciones.',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['texto'],
                            properties: {
                                texto: { type: 'string', example: 'Revisar la bibliografía del capítulo II.' },
                            },
                        },
                    },
                },
            },
            responses: { 201: { description: 'Observación registrada' }, 403: { description: 'Sin permisos (requiere admin o asesor)' } },
        },
    },

    // ── Evaluaciones — rutas reales corregidas ─────────────────────────────
    '/evaluations/by-project/{project_id}': {
        get: {
            tags: ['Evaluaciones'],
            summary: 'Evaluaciones de un proyecto',
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'project_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Lista de evaluaciones del proyecto', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Evaluation' } } } } }, 403: { description: 'Sin permisos (requiere admin o asesor)' } },
        },
    },
};

module.exports = swaggerSpec;
