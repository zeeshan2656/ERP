import { CreateUserInput, UpdateUserInput, UserQueryInput } from './users.schema.js';
export declare class UsersService {
    getUsers(queryInput: UserQueryInput): Promise<{
        items: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            avatarPath: string | null;
            roleId: string;
            roleName: string;
            roleSlug: string;
            isActive: boolean;
            lastLoginAt: string | null;
            createdAt: string;
            updatedAt: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserById(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        fullName: string;
        avatarPath: string | null;
        roleId: string;
        roleName: string;
        roleSlug: string;
        isActive: boolean;
        lastLoginAt: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    createUser(input: CreateUserInput, actorUserId?: string): Promise<{
        id: string;
        username: string;
        email: string;
        fullName: string;
        avatarPath: string | null;
        roleId: string;
        roleName: string;
        roleSlug: string;
        isActive: boolean;
        lastLoginAt: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    updateUser(id: string, input: UpdateUserInput, actorUserId?: string): Promise<{
        id: string;
        username: string;
        email: string;
        fullName: string;
        avatarPath: string | null;
        roleId: string;
        roleName: string;
        roleSlug: string;
        isActive: boolean;
        lastLoginAt: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    softDeleteUser(id: string, actorUserId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleUserStatus(id: string, isActive: boolean, actorUserId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    adminResetPassword(id: string, newPlain: string, actorUserId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const usersService: UsersService;
