/*
================================================================================
🔹 TENANT Database DDL Script
================================================================================

Purpose:
This script defines the core database structures used for multi-tenant 
data source routing. It supports dynamic tenant resolution and database 
configuration in a multi-tenant architecture.

Scope:
- Create tenant-related schema
- Define master tenant registry
- Store tenant-specific database connection configurations
- Map tenant services and implementation details

Objects Created:
1. Tenant Schema
   - Logical separation for tenant management objects

2. Tenant Master Table
   - Stores core tenant metadata (e.g., tenant ID, name, status)

3. Tenant Database Configuration Table
   - Maintains connection details for each tenant's database
   - Used for dynamic datasource routing

4. Tenant Service Implementation Table
   - Maps tenants to specific service implementations or strategies (overrides bean names)

Usage:
This schema is typically used by the application layer to:
- Resolve tenant context
- Dynamically switch database connections
- Support scalable multi-tenant deployments
================================================================================
*/



CREATE SCHEMA IF NOT EXISTS tenant_1;


-- tenant.tent_mst definition

-- Drop table

-- DROP TABLE tenant.tent_mst;

CREATE TABLE tenant.tent_mst (
	tent_id varchar(50) NOT NULL,
	tent_nm varchar(200) NOT NULL,
	use_flg varchar(1) DEFAULT 'Y'::character varying NOT NULL,
	cre_dt timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	cre_usr_id varchar(20) NULL,
	upd_dt timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	upd_usr_id varchar(20) NULL,
	tent_crnt_ver varchar(4) NOT NULL,
	CONSTRAINT tenant_pkey PRIMARY KEY (tent_id)
);


-- tenant.tent_db_cfg definition

-- Drop table

-- DROP TABLE tenant.tent_db_cfg;

CREATE TABLE tenant.tent_db_cfg (
	tent_id varchar(50) NOT NULL,
	db_tp_cd varchar(20) NOT NULL,
	db_host varchar(255) NOT NULL,
	db_port int4 NOT NULL,
	db_nm varchar(255) NOT NULL,
	db_usr_nm varchar(255) NOT NULL,
	db_pwd varchar(500) NOT NULL,
	use_flg varchar(1) DEFAULT 'Y'::character varying NULL,
	cre_usr_id varchar(50) NULL,
	cre_dt timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	upd_usr_id varchar(50) NULL,
	upd_dt timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	db_cfg_id varchar(36) NOT NULL,
	cfg_nm varchar(200) NOT NULL,
	priority int4 NOT NULL,
	status varchar(20) NOT NULL,
	db_schema varchar NULL,
	CONSTRAINT tent_db_cfg_pk PRIMARY KEY (db_cfg_id),
	CONSTRAINT uq_tent_db_cfg_tenant_priority UNIQUE (tent_id, priority)
);
CREATE INDEX idx_tenant_db_config_use_flg ON tenant.tent_db_cfg USING btree (use_flg);
CREATE INDEX idx_tent_db_cfg_tenant_id ON tenant.tent_db_cfg USING btree (tent_id);


-- tenant.tent_svc definition

-- Drop table

-- DROP TABLE tenant.tent_svc;

CREATE TABLE tenant.tent_svc (
	tent_id varchar(100) NOT NULL,
	svc_cd varchar(100) NOT NULL,
	bean_name varchar(200) DEFAULT 'core'::character varying NULL,
	use_flg varchar(1) DEFAULT 'Y'::character varying NULL,
	cre_usr_id varchar(20) NULL,
	cre_dt timestamptz NULL,
	upd_usr_id varchar(20) NULL,
	upd_dt timestamptz NULL,
	CONSTRAINT pk_tent_svc_impl PRIMARY KEY (tent_id, svc_cd)
);