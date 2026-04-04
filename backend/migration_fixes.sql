-- ============================================================
-- MIGRATION: Corrección de schema + tabla upload_history
-- Ejecutar una sola vez en la base de datos PostgreSQL
-- ============================================================

-- TASK 1: Ampliar/corregir columnas en students
ALTER TABLE students ALTER COLUMN fase_academica       TYPE varchar(50);
ALTER TABLE students ALTER COLUMN carnet_id            TYPE varchar(50);
ALTER TABLE students ALTER COLUMN nombre_completo      TYPE varchar(150);
ALTER TABLE students ALTER COLUMN correo_institucional TYPE varchar(100);

-- TASK 4: Historial de cargas masivas
CREATE TABLE IF NOT EXISTS upload_history (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    filename    VARCHAR(255) NOT NULL,
    type        VARCHAR(10)  NOT NULL DEFAULT 'excel',   -- 'excel' | 'pdf'
    status      VARCHAR(10)  NOT NULL DEFAULT 'success', -- 'success' | 'error'
    imported    INT          NOT NULL DEFAULT 0,
    rejected    INT          NOT NULL DEFAULT 0,
    created_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON upload_history (created_at DESC);
