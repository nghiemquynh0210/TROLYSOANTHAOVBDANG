/**
 * File Parser Service
 * Trích xuất text từ PDF, DOCX, TXT phía client-side
 */

export interface ParsedFile {
    text: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

/**
 * Entry point: parse any supported file
 */
export async function parseFile(file: File): Promise<ParsedFile> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const base: Omit<ParsedFile, 'text'> = {
        fileName: file.name,
        fileType: ext,
        fileSize: file.size,
    };

    if (ext === 'pdf') {
        return { ...base, text: await parsePdf(file) };
    }
    if (ext === 'docx') {
        return { ...base, text: await parseDocx(file) };
    }
    if (ext === 'doc') {
        throw new Error('Định dạng .doc cũ không được hỗ trợ. Vui lòng chuyển sang .docx');
    }
    if (['txt', 'md', 'csv'].includes(ext)) {
        return { ...base, text: await parseTxt(file) };
    }
    throw new Error(`Định dạng file ".${ext}" không được hỗ trợ. Hỗ trợ: PDF, DOCX, TXT`);
}

/**
 * Parse PDF using pdfjs-dist
 */
async function parsePdf(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');
        pages.push(pageText);
    }

    return pages.join('\n\n--- Trang mới ---\n\n').trim();
}

/**
 * Parse DOCX using mammoth
 */
async function parseDocx(file: File): Promise<string> {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
}

/**
 * Parse plain text files
 */
function parseTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).trim());
        reader.onerror = () => reject(new Error('Không đọc được file'));
        reader.readAsText(file, 'utf-8');
    });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
