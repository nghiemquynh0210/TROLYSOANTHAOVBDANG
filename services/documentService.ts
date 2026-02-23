import { supabase } from './supabaseClient';

// ─── Types ─────────────────────────────────────────
export interface SavedDocument {
    id: string;
    title: string;
    docType: string;
    docLevel: string;
    content: string;
    rawInput: string;
    metadata: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

// ─── localStorage ──────────────────────────────────
const DOC_STORAGE_KEY = 'saved_documents';

function loadLocal(): SavedDocument[] {
    try {
        const raw = localStorage.getItem(DOC_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveLocal(docs: SavedDocument[]) {
    localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(docs));
}

// ─── Public API ────────────────────────────────────

/** Get all saved documents */
export function getDocuments(): SavedDocument[] {
    return loadLocal().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Save a new document */
export function saveDocument(doc: Omit<SavedDocument, 'id' | 'createdAt' | 'updatedAt'>): SavedDocument {
    const now = new Date().toISOString();
    const newDoc: SavedDocument = {
        ...doc,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
    };
    const docs = loadLocal();
    docs.unshift(newDoc);
    saveLocal(docs);

    // Async sync to Supabase
    syncDocToSupabase(newDoc);
    return newDoc;
}

/** Update an existing document */
export function updateDocument(id: string, updates: Partial<SavedDocument>): SavedDocument | null {
    const docs = loadLocal();
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLocal(docs);
    syncDocToSupabase(docs[idx]);
    return docs[idx];
}

/** Delete a document */
export function deleteDocument(id: string): boolean {
    const docs = loadLocal();
    const filtered = docs.filter(d => d.id !== id);
    if (filtered.length === docs.length) return false;
    saveLocal(filtered);
    // Async delete from Supabase
    supabase.from('saved_documents').delete().eq('id', id).then(() => { });
    return true;
}

/** Generate title from docType and content */
export function generateTitle(docType: string, content: string): string {
    // Extract first meaningful line from content
    const lines = content.split('\n').filter(l => l.trim());
    const firstLine = lines[0]?.replace(/<[^>]*>/g, '').trim() || '';
    const preview = firstLine.slice(0, 80);
    return `${docType}${preview ? ' – ' + preview : ''}`;
}

// ─── Supabase sync ─────────────────────────────────

async function syncDocToSupabase(doc: SavedDocument) {
    try {
        await supabase.from('saved_documents').upsert({
            id: doc.id,
            title: doc.title,
            doc_type: doc.docType,
            doc_level: doc.docLevel,
            content: doc.content,
            raw_input: doc.rawInput,
            metadata: doc.metadata,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt
        }, { onConflict: 'id' });
    } catch (err) {
        console.warn('Supabase doc sync failed:', err);
    }
}

/** Load documents from Supabase (for initial sync) */
export async function loadFromSupabase(): Promise<SavedDocument[]> {
    try {
        const { data, error } = await supabase
            .from('saved_documents')
            .select('*')
            .order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map((d: any) => ({
            id: d.id,
            title: d.title,
            docType: d.doc_type,
            docLevel: d.doc_level,
            content: d.content,
            rawInput: d.raw_input,
            metadata: d.metadata || {},
            createdAt: d.created_at,
            updatedAt: d.updated_at
        }));
    } catch {
        return [];
    }
}

/** Sync: merge Supabase → localStorage */
export async function syncFromSupabase() {
    const remote = await loadFromSupabase();
    if (remote.length === 0) return;
    const local = loadLocal();
    const localIds = new Set(local.map(d => d.id));
    const merged = [...local];
    for (const r of remote) {
        if (!localIds.has(r.id)) {
            merged.push(r);
        }
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveLocal(merged);
}
