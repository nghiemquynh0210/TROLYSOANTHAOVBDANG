
import { WORKFLOWS } from '../data/workflows';

const STORAGE_KEY = 'compliance_tracking';

export interface ComplianceRecord {
    processType: string; // e.g. 'KIỂM TRA', 'GIÁM SÁT'
    caseId: string;      // unique case identifier
    caseName: string;    // e.g. 'Kiểm tra đ/c Nguyễn Văn A'
    completedDocs: string[]; // e.g. ['KT1', 'KT2']
    createdAt: string;
    updatedAt: string;
}

export interface ComplianceCheck {
    docType: string;
    title: string;
    status: 'completed' | 'missing_required' | 'pending';
    number: number;
    message?: string;
}

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

export const complianceService = {
    getAll(): ComplianceRecord[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    },

    getById(caseId: string): ComplianceRecord | undefined {
        return this.getAll().find(r => r.caseId === caseId);
    },

    create(processType: string, caseName: string): ComplianceRecord {
        const records = this.getAll();
        const now = new Date().toISOString();
        const rec: ComplianceRecord = {
            processType, caseName,
            caseId: generateId(),
            completedDocs: [],
            createdAt: now, updatedAt: now
        };
        records.push(rec);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return rec;
    },

    markCompleted(caseId: string, docType: string): ComplianceRecord | null {
        const records = this.getAll();
        const idx = records.findIndex(r => r.caseId === caseId);
        if (idx === -1) return null;
        if (!records[idx].completedDocs.includes(docType)) {
            records[idx].completedDocs.push(docType);
            records[idx].updatedAt = new Date().toISOString();
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return records[idx];
    },

    unmarkCompleted(caseId: string, docType: string): ComplianceRecord | null {
        const records = this.getAll();
        const idx = records.findIndex(r => r.caseId === caseId);
        if (idx === -1) return null;
        records[idx].completedDocs = records[idx].completedDocs.filter(d => d !== docType);
        records[idx].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return records[idx];
    },

    remove(caseId: string): boolean {
        const records = this.getAll();
        const filtered = records.filter(r => r.caseId !== caseId);
        if (filtered.length === records.length) return false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    },

    checkCompliance(processType: string, caseId: string, currentDocType?: string): ComplianceCheck[] {
        const workflow = WORKFLOWS[processType];
        if (!workflow) return [];

        const record = this.getById(caseId);
        const completed = record?.completedDocs || [];
        let currentIdx = -1;

        if (currentDocType) {
            currentIdx = workflow.steps.findIndex(s => s.docType === currentDocType);
        }

        return workflow.steps.map((step, idx) => {
            const isCompleted = completed.includes(step.docType);
            let status: ComplianceCheck['status'] = 'pending';
            let message: string | undefined;

            if (isCompleted) {
                status = 'completed';
            } else if (currentIdx >= 0 && idx < currentIdx) {
                status = 'missing_required';
                message = `⚠️ Bắt buộc hoàn thành trước khi soạn ${currentDocType}`;
            }

            return {
                docType: step.docType,
                title: step.title,
                status,
                number: step.number,
                message
            };
        });
    },

    getWarnings(processType: string, caseId: string, currentDocType: string): string[] {
        const checks = this.checkCompliance(processType, caseId, currentDocType);
        return checks
            .filter(c => c.status === 'missing_required')
            .map(c => `Chưa có "${c.title}" (${c.docType}) — bắt buộc trước bước hiện tại`);
    }
};
