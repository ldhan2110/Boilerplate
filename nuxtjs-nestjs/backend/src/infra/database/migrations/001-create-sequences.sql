-- Sequences for ID generation (used by id-generator.util.ts)
-- Run this once against your PostgreSQL database before using the application.

CREATE SEQUENCE IF NOT EXISTS seq_co     START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_usr    START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_pgm    START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_perm   START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_role   START 1 INCREMENT 1;
