export interface LoginRequest {
	companyCode: string;
	username: string;
	password: string;
}

// Token response structure for Keycloak
export interface TokenResponse {
	access_token: string;
	expires_in: number;
	refresh_expires_in: number;
	refresh_token: string;
	token_type: string;
	'not-before-policy': number;
	session_state: string;
	scope: string;
}

// Token response structure for JWT
export interface TokenJwtResponse {
	accessToken: string;
	refreshToken: string;
	refreshExpireIn: number;
	accessExpireIn: number;
}

export interface DecodedToken {
	exp: number;
	iat: number;
	jti: string;
	iss: string;
	aud: string | string[];
	sub: string;
	typ: string;
	azp: string;
	session_state: string;
	acr: string;
	realm_access: {
		roles: string[];
	};
	resource_access: {
		[key: string]: {
			roles: string[];
		};
	};
	scope: string;
	sid: string;
	email_verified: boolean;
	name: string;
	preferred_username: string;
	given_name: string;
	family_name: string;
	email: string;
	userInfo: {
		coId?: string;
		useFlg?: string;
		usrId?: string;
		usrNm?: string;
		usrEml?: string;
		roleId?: string;
		coTmz?: string;
		langVal?: string;
		sysModVal?: string;
		dtFmtVal?: string;
		sysColrVal?: string;
	};
}

export interface AuthState {
	isAuthenticated: boolean;
	user: DecodedToken | null;
	loading: boolean;
	error: string | null;
}

export interface Program {
	useFlg?: string;
	pgmId?: string;
	pgmCd?: string;
	pgmNm?: string;
	pgmTp?: string;
	prntPgmId?: string;
}

export interface AuthStore {
	isAuthenticated: boolean;
	user: DecodedToken | null;
	loading: boolean;
	error: string | null;
	programs: Program[];

	login: (request: LoginRequest) => Promise<boolean>;
	logout: () => void;
}
