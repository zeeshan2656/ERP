export declare class AuthService {
    login(emailOrUsername: string, plainTextPassword: string, ipAddress?: string, userAgent?: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            roleId: string;
            roleName: string;
            roleSlug: string;
            avatarPath: string | null;
            themePreference: string;
            customThemeTokens: Record<string, string> | null;
        };
        permissions: Record<string, {
            view: boolean;
            add: boolean;
            edit: boolean;
            delete: boolean;
        }>;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getCurrentUserProfile(userId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            roleId: string;
            roleName: string;
            roleSlug: string;
            avatarPath: string | null;
            themePreference: string;
            customThemeTokens: Record<string, string> | null;
            createdAt: any;
        };
        permissions: Record<string, {
            view: boolean;
            add: boolean;
            edit: boolean;
            delete: boolean;
        }>;
    }>;
    changePassword(userId: string, currentPlain: string, newPlain: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateProfile(userId: string, fullName: string, email: string, avatarMediaId?: string | null): Promise<{
        success: boolean;
        message: string;
    }>;
    updateThemePreference(userId: string, themePreference: string, customTokens?: Record<string, string> | null): Promise<{
        success: boolean;
        message: string;
    }>;
    private getUserPermissions;
}
export declare const authService: AuthService;
