export type OptionConfigItem = { title: string; value: string };

export type SubTblAttrConfig = {
	inputType: 'INPUT' | 'CHECKBOX' | 'SELECT' | 'INPUT_NUMBER';
	headerTitle: string;
	editProps?: {
		required?: boolean;
		placeholder?: string;
	};
	optionConfig?: string | string[] | OptionConfigItem[];
	headerTooltip?: string;
};

export type SubTblCfg = Record<string, SubTblAttrConfig>;

export type MasterCodeFilterForm = {
	coId?: string;
	mstCd?: string;
	mstNm?: string;
	mstMdlNm?: string;
	useFlg?: string;
};

export type DetailCodeFilterForm = {
	subCd?: string;
	subNm?: string;
	useFlg?: string;
};