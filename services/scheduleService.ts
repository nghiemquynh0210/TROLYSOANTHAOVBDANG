
export interface ScheduleEvent {
    id: string;
    title: string;
    date: string;       // ISO date string
    type: 'sinh_hoat' | 'bao_cao' | 'ho_so' | 'khac';
    recurring: boolean;
    recurDay?: number;   // day of month for recurring
    note: string;
    completed: boolean;
    createdAt: string;
}

const STORAGE_KEY = 'schedule_events';
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const TYPE_LABELS: Record<string, string> = {
    sinh_hoat: 'Sinh hoạt định kỳ',
    bao_cao: 'Nộp báo cáo',
    ho_so: 'Hạn chót hồ sơ',
    khac: 'Khác'
};

export { TYPE_LABELS };

export const scheduleService = {
    getAll(): ScheduleEvent[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            let events: ScheduleEvent[] = data ? JSON.parse(data) : [];
            if (events.length === 0) {
                events = this._createDefaults();
            }
            return events;
        } catch { return []; }
    },

    create(event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'completed'>): ScheduleEvent {
        const events = this.getAll();
        const newEvent: ScheduleEvent = {
            ...event,
            id: generateId(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        events.push(newEvent);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        return newEvent;
    },

    toggleComplete(id: string): boolean {
        const events = this.getAll();
        const idx = events.findIndex(e => e.id === id);
        if (idx === -1) return false;
        events[idx].completed = !events[idx].completed;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        return true;
    },

    remove(id: string): boolean {
        const events = this.getAll();
        const filtered = events.filter(e => e.id !== id);
        if (filtered.length === events.length) return false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    },

    getUpcoming(days: number = 7): ScheduleEvent[] {
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return this.getAll()
            .filter(e => {
                if (e.completed) return false;
                const d = new Date(e.date);
                return d >= now && d <= future;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    getOverdue(): ScheduleEvent[] {
        const now = new Date();
        return this.getAll()
            .filter(e => !e.completed && new Date(e.date) < now)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    getBadgeCount(): number {
        return this.getOverdue().length + this.getUpcoming(3).length;
    },

    _createDefaults(): ScheduleEvent[] {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const defaults: ScheduleEvent[] = [
            {
                id: generateId(), title: 'Họp Chi bộ định kỳ tháng ' + (month + 1),
                date: new Date(year, month, 3, 19, 0).toISOString(),
                type: 'sinh_hoat', recurring: true, recurDay: 3,
                note: 'Sinh hoạt Chi bộ hàng tháng tại Văn phòng Khu phố',
                completed: false, createdAt: now.toISOString()
            },
            {
                id: generateId(), title: 'Nộp báo cáo tháng ' + (month + 1) + ' cho Đảng ủy',
                date: new Date(year, month, 25, 17, 0).toISOString(),
                type: 'bao_cao', recurring: true, recurDay: 25,
                note: 'Báo cáo kết quả sinh hoạt, số lượng đảng viên, danh sách vắng mặt',
                completed: false, createdAt: now.toISOString()
            },
            {
                id: generateId(), title: 'Họp Chi ủy tháng ' + (month + 1),
                date: new Date(year, month, 1, 14, 0).toISOString(),
                type: 'sinh_hoat', recurring: true, recurDay: 1,
                note: 'Chuẩn bị nội dung cho buổi sinh hoạt Chi bộ',
                completed: false, createdAt: now.toISOString()
            },
            {
                id: generateId(), title: 'Báo cáo quý ' + (Math.floor(month / 3) + 1) + '/' + year,
                date: new Date(year, Math.floor(month / 3) * 3 + 2, 20, 17, 0).toISOString(),
                type: 'bao_cao', recurring: false,
                note: 'Báo cáo sơ kết quý trình Đảng ủy phường',
                completed: false, createdAt: now.toISOString()
            }
        ];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }
};
