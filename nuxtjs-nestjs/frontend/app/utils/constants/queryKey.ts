export const QUERY_KEY = {
    AUTHENTICATION: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh-token',
        PROFILE: '/api/auth/me',
    },
    ADMINISTRATION: {
        USERS: {
            LIST: '/api/adm/user/getListUserInfo',
            SAVE: '/api/adm/user/saveUsers',
        },
    }
}