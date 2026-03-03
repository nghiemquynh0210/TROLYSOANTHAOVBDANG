
import { MemberProfile } from '../types';

const BASE_KEY = 'member_profiles';

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

/** Helper: get storage key scoped to user */
function getKey(userId?: string | null): string {
    return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

export const profileService = {
    _userId: null as string | null,

    setUserId(id: string | null) {
        this._userId = id;
    },

    getAll(): MemberProfile[] {
        try {
            const data = localStorage.getItem(getKey(this._userId));
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    getById(id: string): MemberProfile | undefined {
        return this.getAll().find(p => p.id === id);
    },

    create(profile: Omit<MemberProfile, 'id' | 'createdAt' | 'updatedAt'>): MemberProfile {
        const profiles = this.getAll();
        const now = new Date().toISOString();
        const newProfile: MemberProfile = {
            ...profile,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        profiles.push(newProfile);
        localStorage.setItem(getKey(this._userId), JSON.stringify(profiles));
        return newProfile;
    },

    update(id: string, data: Partial<MemberProfile>): MemberProfile | null {
        const profiles = this.getAll();
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return null;
        profiles[idx] = { ...profiles[idx], ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(getKey(this._userId), JSON.stringify(profiles));
        return profiles[idx];
    },

    remove(id: string): boolean {
        const profiles = this.getAll();
        const filtered = profiles.filter(p => p.id !== id);
        if (filtered.length === profiles.length) return false;
        localStorage.setItem(getKey(this._userId), JSON.stringify(filtered));
        return true;
    },

    search(query: string): MemberProfile[] {
        const q = query.toLowerCase().trim();
        if (!q) return this.getAll();
        return this.getAll().filter(p =>
            p.fullName.toLowerCase().includes(q) ||
            p.workplace.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q)
        );
    }
};
