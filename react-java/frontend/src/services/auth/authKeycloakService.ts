import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken, LoginRequest, TokenResponse } from "../../types";

/**
 * Get runtime Keycloak configuration
 */
const getKeycloakConfig = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtimeConfig = (window as any).__RUNTIME_CONFIG__ || {};

  return {
    baseUrl: runtimeConfig.keycloakUrl || "https://login.knbs.cloud/auth",
    realm: runtimeConfig.keycloakRealm || "knbs-dev",
    clientId: runtimeConfig.keycloakClientId || "pwa.knbs.io",
  };
};

// Storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

class AuthKeyCloakService {
  /**
   * Đăng nhập với username và password
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    try {
      const keycloakConfig = getKeycloakConfig();
      const tokenEndpoint = `${keycloakConfig.baseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

      const formData = new URLSearchParams();
      formData.append("grant_type", "password");
      formData.append("client_id", keycloakConfig.clientId);
      formData.append("username", credentials.username);
      formData.append("password", credentials.password);

      const response = await axios.post<TokenResponse>(
        tokenEndpoint,
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const tokenData = response.data;

      // Lưu tokens
      this.saveTokens(tokenData);

      return tokenData;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error(
        error.response?.data?.error_description || "Login failed."
      );
    }
  }

  /**
   * Refresh access token bằng refresh token
   */
  async refreshToken(): Promise<TokenResponse | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.warn("⚠️ No refresh token available, clearing all tokens");
        this.clearTokens();
        throw new Error("No refresh token available");
      }

      const keycloakConfig = getKeycloakConfig();
      const tokenEndpoint = `${keycloakConfig.baseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

      const formData = new URLSearchParams();
      formData.append("grant_type", "refresh_token");
      formData.append("client_id", keycloakConfig.clientId);
      formData.append("refresh_token", refreshToken);

      const response = await axios.post<TokenResponse>(
        tokenEndpoint,
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const tokenData = response.data;

      // Lưu tokens mới
      this.saveTokens(tokenData);

      return tokenData;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("❌ Token refresh failed:", error);
      // Nếu refresh token hết hạn hoặc có lỗi, xóa tất cả tokens và storage
      this.clearTokens();
      this.clearAllUserData();
      return null;
    }
  }

  /**
   * Lưu tokens vào storage
   */
  saveTokens(tokenData: TokenResponse): void {
    // Lưu access token vào sessionStorage
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);

    // Lưu refresh token vào httpOnly cookie (secure)
    Cookies.set(REFRESH_TOKEN_KEY, tokenData.refresh_token, {
      expires: tokenData.refresh_expires_in / (24 * 60 * 60), // Convert seconds to days
      httpOnly: false, // Note: js-cookie không thể set httpOnly, cần backend support
      secure: true,
      sameSite: "strict",
    });
  }

  /**
   * Lấy access token từ sessionStorage
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Lấy refresh token từ cookie
   */
  getRefreshToken(): string | null {
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  }

  /**
   * Kiểm tra access token có hợp lệ không
   */
  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      // Kiểm tra token có hết hạn không (với buffer 30 giây)
      return decoded.exp > currentTime + 30;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  }

  /**
   * Decode access token để lấy thông tin user
   */
  getDecodedToken(): DecodedToken | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }

  /**
   * Kiểm tra user đã đăng nhập chưa
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Kiểm tra access token trước
      if (this.isAccessTokenValid()) {
        return true;
      }

      // Nếu access token không hợp lệ, thử refresh
      const refreshed = await this.refreshToken();
      return refreshed !== null;
    } catch (error) {
      console.error("❌ Authentication check failed:", error);
      // Clear tất cả tokens và data khi có lỗi
      this.clearTokens();
      this.clearAllUserData();
      return false;
    }
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    this.clearTokens();
  }

  /**
   * Xóa tất cả tokens
   */
  clearTokens(): void {
    console.log("🧹 Clearing all tokens...");

    // Clear từ sessionStorage
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);

    // Không cần clear từ localStorage vì chúng ta chỉ dùng sessionStorage

    // Clear cookies
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });

    // Clear tất cả cookies khác liên quan đến auth
    const allCookies = document.cookie.split(";");
    allCookies.forEach((cookie) => {
      const cookieName = cookie.split("=")[0].trim();
      if (
        cookieName.includes("knbs") ||
        cookieName.includes("auth") ||
        cookieName.includes("token")
      ) {
        Cookies.remove(cookieName);
        Cookies.remove(cookieName, { path: "/" });
      }
    });

    console.log("✅ All tokens cleared");
  }

  /**
   * Xóa tất cả dữ liệu user (bao gồm cả app state)
   */
  private clearAllUserData(): void {
    try {
      console.log("🧹 Clearing all user data...");

      // Không cần clear localStorage vì chúng ta đã chuyển sang IndexedDB
      // IndexedDB sẽ được clear qua indexedDBSystemCache.clearCache()

      // Clear sessionStorage
      sessionStorage.clear();

      console.log("✅ All user data cleared");
    } catch (error) {
      console.error("❌ Failed to clear user data:", error);
    }
  }

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser(): DecodedToken | null {
    if (!this.isAccessTokenValid()) {
      return null;
    }
    return this.getDecodedToken();
  }

  /**
   * Tạo axios interceptor để tự động thêm token vào request
   */
  setupAxiosInterceptors(): void {
    // Request interceptor - thêm token vào header
    axios.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && this.isAccessTokenValid()) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - xử lý token hết hạn
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // Get the Login Enpoints
        const keycloakConfig = getKeycloakConfig();
        const tokenEndpoint = `${keycloakConfig.baseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

        if (error.response?.status === 401 && !originalRequest._retry) {
          // Nếu request endpoint là login enpoints -> trả về response
          if (error.request.responseURL === tokenEndpoint)
            return Promise.reject(error);
          originalRequest._retry = true;

          // Thử refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry request với token mới
            originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;
            return axios(originalRequest);
          } else {
            // Refresh thất bại, redirect to login
            this.clearTokens();
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

export const authService = new AuthKeyCloakService();
