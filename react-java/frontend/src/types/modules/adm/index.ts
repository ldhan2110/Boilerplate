import type { DynamicFilterDto } from '@/types/api';
import type { ProgramDto } from '@/types/api';
import type { ReactNode } from 'react';

export type UserListFilterForm = {
	coId: string;
	usrId: string;
	usrNm: string;
	useFlg: string;
	filters: DynamicFilterDto[];
};

export type RoleListFilterForm = {
	coId: string;
	roleCd: string;
	roleId: string;
	roleNm: string;
	useFlg: string;
};

export type ProgramListFilterForm = {
	coId: string;
	pgmId: string;
	pgmCd: string;
	pgmNm: string;
	pgmTpCd: string;
	useFlg: string;
};

export type ProgramTree = ProgramDto & {
	key: React.Key | string;
	title?: string;
	children?: ProgramTree[];
	icon?: ReactNode;
};

export type ProgramTreeOption = ProgramDto & {
	value: string;
	title: string;
	children?: ProgramTreeOption[];
};