
import { AdmissionTracking, AdmissionStep } from '../types';

const BASE_KEY = 'admission_tracking';

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

/** Helper: get storage key scoped to user */
function getKey(userId?: string | null): string {
    return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

export const admissionService = {
    _userId: null as string | null,

    setUserId(id: string | null) {
        this._userId = id;
    },

    getAll(): AdmissionTracking[] {
        try {
            const data = localStorage.getItem(getKey(this._userId));
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    getByProfileId(profileId: string): AdmissionTracking | undefined {
        return this.getAll().find(t => t.profileId === profileId);
    },

    create(profileId: string, note: string = ''): AdmissionTracking {
        const items = this.getAll();
        // Check if already exists
        const existing = items.find(t => t.profileId === profileId);
        if (existing) return existing;

        const now = new Date().toISOString();
        const newTracking: AdmissionTracking = {
            id: generateId(),
            profileId,
            currentStep: AdmissionStep.QUAN_CHUNG,
            stepStartDate: now,
            note,
            history: [{ step: AdmissionStep.QUAN_CHUNG, date: now, note: note || 'Bắt đầu theo dõi' }],
            createdAt: now,
            updatedAt: now,
        };
        items.push(newTracking);
        localStorage.setItem(getKey(this._userId), JSON.stringify(items));
        return newTracking;
    },

    updateStep(profileId: string, newStep: AdmissionStep, note: string = ''): AdmissionTracking | null {
        const items = this.getAll();
        const idx = items.findIndex(t => t.profileId === profileId);
        if (idx === -1) return null;

        const now = new Date().toISOString();
        items[idx].currentStep = newStep;
        items[idx].stepStartDate = now;
        items[idx].note = note;
        items[idx].updatedAt = now;
        items[idx].history.push({ step: newStep, date: now, note: note || `Chuyển sang: ${newStep}` });

        localStorage.setItem(getKey(this._userId), JSON.stringify(items));
        return items[idx];
    },

    remove(profileId: string): boolean {
        const items = this.getAll();
        const filtered = items.filter(t => t.profileId !== profileId);
        if (filtered.length === items.length) return false;
        localStorage.setItem(getKey(this._userId), JSON.stringify(filtered));
        return true;
    }
};
