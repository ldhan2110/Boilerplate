import {
	ADM_ROUTE_KEYS,
	COM_ROUTE_KEYS,
	SYS_ROUTE_KEYS,
} from '@/utils/core';
import { defineAbility } from '@casl/ability';
import React from 'react';

// Define Ability Context
export const ability = defineAbility(() => {});
export const AbilityContext = React.createContext(ability);

/** Default program permission: open screen / list (COM_PERM `perm_cd`; CASL uses {@link ABILITY_ACTION.VIEW}). */
export const VIEW_PERMISSION_CODE = 'VIEW';

// Define App Actions & Subject
export enum ABILITY_ACTION {
	/** Same string as {@link VIEW_PERMISSION_CODE} — use for every page gate unless a feature needs a different action. */
	VIEW = 'VIEW',
	ADD = 'ADD',
	SAVE = 'SAVE',
	VIEW_DETAIL = 'VIEW_DETAIL',
	RESET_PASSWORD = 'RESET_PASSWORD',
	EXPORT = 'EXPORT',
	DELETE = 'DELETE',
	PRINT = 'PRINT',
	IMPORT = 'IMPORT',
	RUN = 'RUN',
	ADD_SUB = 'ADD_SUB',
	ADD_MST = 'ADD_MST',
	SAVE_SUB = 'SAVE_SUB',
	SAVE_MST = 'SAVE_MST',
	DELETE_SUB = 'DELETE_SUB',
	DELETE_MST = 'DELETE_MST',

	// ROLE & PERMISSION
	VIEW_PROGRAM = 'VIEW_PROGRAM',
	ADD_PROGRAM = 'ADD_PROGRAM',
	SAVE_PROGRAM = 'SAVE_PROGRAM',
	DELETE_PROGRAM = 'DELETE_PROGRAM',
	VIEW_PROGRAM_DETAIL = 'VIEW_PROGRAM_DETAIL',

	ADD_PERMISSION = 'ADD_PERMISSION',
	DELETE_PERMISSION = 'DELETE_PERMISSION',
	SAVE_PERMISSION = 'SAVE_PERMISSION',

	//PERIOD CLOSE
	GENERATE = 'GENERATE',
	OPEN = 'OPEN',
	CLOSE = 'CLOSE',

	// BATCH JOB MANAGEMENT
	RESUME = 'RESUME',
	PAUSE = 'PAUSE',
}

export const ABILITY_SUBJECT = {
	...ADM_ROUTE_KEYS,
	...SYS_ROUTE_KEYS,
	...COM_ROUTE_KEYS
};

export type ABILITY_SUBJECT_TYPE = (typeof ABILITY_SUBJECT)[keyof typeof ABILITY_SUBJECT];
