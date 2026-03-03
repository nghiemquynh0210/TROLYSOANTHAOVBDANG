/**
 * Centralized user-scoped localStorage utility.
 * Ensures each user account has completely separate data.
 */

import { supabase } from './supabaseClient';

let _cachedUserId: string | null = null;

/** Get current user ID (cached for performance) */
export async function getCurrentUserId(): Promise<string | null> {
    if (_cachedUserId) return _cachedUserId;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        _cachedUserId = user?.id || null;
        return _cachedUserId;
    } catch {
        return null;
    }
}

/** Set cached user ID (called from auth flow) */
export function setCachedUserId(id: string | null) {
    _cachedUserId = id;
}

/** Get user-scoped localStorage key */
export function getUserScopedKey(baseKey: string, userId: string | null): string {
    return userId ? `${baseKey}_${userId}` : baseKey;
}

/** Get item from user-scoped localStorage */
export function getUserData<T>(baseKey: string, userId: string | null, defaultValue: T): T {
    try {
        const key = getUserScopedKey(baseKey, userId);
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultValue;
    } catch {
        return defaultValue;
    }
}

/** Set item in user-scoped localStorage */
export function setUserData<T>(baseKey: string, userId: string | null, value: T): void {
    const key = getUserScopedKey(baseKey, userId);
    localStorage.setItem(key, JSON.stringify(value));
}

/** Remove item from user-scoped localStorage */
export function removeUserData(baseKey: string, userId: string | null): void {
    const key = getUserScopedKey(baseKey, userId);
    localStorage.removeItem(key);
}
