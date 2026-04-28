
/*==================================== COMPANY TABLE ============================================*/
-- public.adm_co definition

-- Drop table

-- DROP TABLE public.adm_co;

CREATE TABLE public.adm_co (
	co_id varchar(20) NOT NULL,
	co_nm varchar(200) NOT NULL,
	use_flg varchar(1) DEFAULT 'Y'::character varying NOT NULL,
	cre_usr_id varchar(50) NOT NULL,
	cre_dt timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	upd_usr_id varchar(50) NOT NULL,
	upd_dt timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	tm_zn varchar(20) NOT NULL,
	CONSTRAINT PK_ADM_CO PRIMARY KEY (co_id)
);


/*==================================== PROGRAM TABLE ============================================*/
-- public.com_pgm definition

-- Drop table

-- DROP TABLE public.com_pgm;

CREATE TABLE public.com_pgm (
	co_id varchar(20) NOT NULL,
	pgm_id varchar(20) NOT NULL,
	pgm_cd varchar(20) NOT NULL,
	pgm_nm varchar(100) NOT NULL,
	pgm_tp_cd varchar(20) NOT NULL,
	prnt_pgm_id varchar(20) NULL,
	use_flg varchar(1) DEFAULT 'Y'::character varying NOT NULL,
	cre_usr_id varchar(50) NOT NULL,
	cre_dt timestamptz DEFAULT now() NOT NULL,
	upd_usr_id varchar(50) NOT NULL,
	upd_dt timestamptz DEFAULT now() NOT NULL,
	dsp_order numeric NULL,
	pgm_rmk varchar(500) NULL,
	CONSTRAINT pk_com_pgm PRIMARY KEY (co_id, pgm_id)
);

/*==================================== PERMISSION TABLE ============================================*/

-- public.com_perm definition

-- Drop table

-- DROP TABLE public.com_perm;

CREATE TABLE public.com_perm (
	co_id varchar(20) NOT NULL,
	perm_id varchar(20) NOT NULL,
	pgm_id varchar(20) NOT NULL,
	perm_cd varchar(50) NOT NULL,
	perm_nm varchar(200) NOT NULL,
	use_flg varchar(1) DEFAULT 'Y'::character varying NULL,
	cre_dt timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	cre_usr_id varchar(50) NOT NULL,
	upd_dt timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	upd_usr_id varchar(50) NOT NULL,
	CONSTRAINT pk_adm_perm PRIMARY KEY (co_id, perm_id),
	CONSTRAINT fk_adm_perm_pgm FOREIGN KEY (co_id,pgm_id) REFERENCES public.com_pgm(co_id,pgm_id) ON DELETE CASCADE ON UPDATE CASCADE
);

/*==================================== ROLE TABLE ============================================*/
-- public.adm_role definition

-- Drop table

-- DROP TABLE public.adm_role;

CREATE TABLE public.adm_role (
	co_id varchar(20) NOT NULL,
	role_id varchar(20) NOT NULL,
	role_nm varchar(200) NOT NULL,
	role_desc varchar(500) NULL,
	cre_usr_id varchar(50) NULL,
	cre_dt timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	upd_usr_id varchar(50) NULL,
	upd_dt timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	use_flg varchar DEFAULT 'Y'::character varying NOT NULL,
	role_cd varchar(20) DEFAULT ''::character varying NOT NULL,
	CONSTRAINT pk_adm_role PRIMARY KEY (co_id, role_id)
);


/*==================================== ROLE AUTH TABLE ============================================*/
-- public.adm_role_auth definition

-- Drop table

-- DROP TABLE public.adm_role_auth;

CREATE TABLE public.adm_role_auth (
	co_id varchar(20) NOT NULL,
	role_id varchar(20) NOT NULL,
	pgm_id varchar(20) NOT NULL,
	perm_id varchar(20) NOT NULL,
	use_flg varchar(1) DEFAULT 'Y'::character varying NULL,
	cre_dt timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	cre_usr_id varchar(50) NOT NULL,
	upd_dt timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	upd_usr_id varchar(50) NOT NULL,
	CONSTRAINT pk_adm_role_perm PRIMARY KEY (co_id, role_id, pgm_id, perm_id)
);


/*==================================== USER TABLE ============================================*/
-- public.adm_usr definition

-- Drop table

-- DROP TABLE public.adm_usr;
CREATE TABLE public.adm_usr (
	cre_dt timestamptz DEFAULT now() NOT NULL,
	cre_usr_id varchar(50) NULL,
	upd_dt timestamptz DEFAULT now() NOT NULL,
	upd_usr_id varchar(50) NULL,
	use_flg varchar DEFAULT 'Y'::character varying NOT NULL,
	co_id varchar(20) NOT NULL,
	usr_id varchar(20) NOT NULL,
	usr_pwd text NOT NULL,
	usr_nm varchar(100) NOT NULL,
	usr_eml varchar(100) NULL,
	role_id varchar(20) NULL,
	usr_phn varchar(20) NULL,
	usr_addr varchar(200) NULL,
	usr_desc text NULL,
	lang_val varchar(2) DEFAULT 'en'::character varying NOT NULL,
	dt_fmt_val varchar(20) DEFAULT 'DD/MM/YYYY HH:mm:ss'::character varying NOT NULL,
	sys_mod_val varchar(5) DEFAULT 'light'::character varying NOT NULL,
	sys_colr_val varchar(10) NULL,
	usr_file_id varchar(255) NULL,
	CONSTRAINT pk_adm_usr PRIMARY KEY (co_id, usr_id)
);


-- public.adm_usr foreign keys

ALTER TABLE public.adm_usr ADD CONSTRAINT fk_adm_usr_role FOREIGN KEY (co_id,role_id) REFERENCES public.adm_role(co_id,role_id);