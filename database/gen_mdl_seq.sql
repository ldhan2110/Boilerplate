/*
================================================================================
🔹 Sequence Generator (com_mdl_seq + fn_gen_seq)
================================================================================

Purpose:
Provides a tenant-aware, date-based sequence generator used to create 
unique, formatted identifiers (e.g., document numbers, transaction IDs).

Design Highlights:
- Sequence is scoped by:
  + Company (co_id)
  + Sequence Type (seq_type / prefix)
- Sequence resets daily (based on CURRENT_DATE)
- Concurrency-safe using PostgreSQL advisory locks
- Atomic increment via UPSERT (ON CONFLICT)

Table: public.com_mdl_seq
----------------------------------------------------------------------
Stores the current sequence state per company and sequence type.

Columns:
- co_id        : Company identifier (tenant scope)
- seq_type     : Sequence type / prefix
- seq_date     : Current sequence date (used for daily reset)
- seq_num      : Current sequence number
- update_date  : Last update timestamp

Constraints:
- PK  (co_id, seq_type, seq_date)
- UK  (co_id, seq_type) → ensures one active row per type
- Index for fast lookup by (co_id, seq_type, seq_date)

Function: public.fn_gen_seq
----------------------------------------------------------------------
Generates the next sequence value in a safe, concurrent environment.

Parameters:
- p_co_id       : Company ID
- p_seq_prefix  : Sequence prefix (e.g., INV, PO)
- p_padding     : Zero-padding length (default = 4)

Logic:
1. Acquire transaction-level advisory lock per (co_id + seq_type)
2. INSERT new row if not exists
3. If exists:
   - Same day  → increment seq_num
   - New day   → reset seq_num to 1
4. Return formatted sequence

Format:
    <PREFIX><YYYYMMDD><SEQUENCE>

Example:
    INV202604280001
    INV202604280002

Usage:
- Generate business document numbers
- Ensure uniqueness across concurrent transactions
- Support multi-tenant environments with isolated sequences

================================================================================
*/

-- public.com_mdl_seq definition

-- Drop table

-- DROP TABLE public.com_mdl_seq;

CREATE TABLE public.com_mdl_seq (
	co_id text NOT NULL,
	seq_type text NOT NULL,
	seq_date date NOT NULL,
	seq_num int4 NOT NULL,
	update_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT com_mdl_seq_pkey PRIMARY KEY (co_id, seq_type, seq_date),
	CONSTRAINT com_mdl_seq_unique_co_seq_type UNIQUE (co_id, seq_type)
);
CREATE INDEX idx_com_mdl_seq_lookup ON public.com_mdl_seq USING btree (co_id, seq_type, seq_date);


-- DROP FUNCTION public.get_mdl_seq2(text, text, int4);

CREATE OR REPLACE FUNCTION public.fn_gen_seq(p_co_id text, p_seq_prefix text, p_padding integer DEFAULT 4)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_date date := CURRENT_DATE;
    next_val integer;
BEGIN
	-- Use advisory lock for transaction-level locking
    PERFORM pg_advisory_xact_lock(
        hashtext(p_co_id || '_' || p_seq_prefix)
    );

    -- Upsert: Insert if not exists, otherwise update seq_num
    INSERT INTO COM_MDL_SEQ(co_id, seq_type, seq_date, seq_num, update_date)
    VALUES (p_co_id, p_seq_prefix, current_date, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (co_id, seq_type)
    DO UPDATE
    SET seq_num = CASE 
                    WHEN COM_MDL_SEQ.seq_date = current_date THEN COM_MDL_SEQ.seq_num + 1
                    ELSE 1
                  END,
        seq_date = current_date,
        update_date = CURRENT_TIMESTAMP
    RETURNING seq_num INTO next_val;

    -- Return formatted sequence
    RETURN FORMAT('%s%s%s',
        p_seq_prefix,
		TO_CHAR(current_date, 'YYYYMMDD'),
        LPAD(next_val::text, p_padding, '0'));
END;
$function$
;
