export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  roleSlug: string;
  themePreference: string;
  customThemeTokens?: Record<string, string> | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
