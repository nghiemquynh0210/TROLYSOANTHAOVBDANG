
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Header,
  Footer,
  PageNumber,
  SectionType
} from "docx";

export const exportToDocx = async (content: string, fileName: string, superiorParty: string, docType: string) => {
  const lines = content.split('\n');
  
  const paragraphs = lines.map((line, index) => {
    const trimmedLine = line.trim();
    let alignment = AlignmentType.JUSTIFIED;
    let bold = false;
    let size = 28; // 14pt (docx uses half-points)
    let spacingAfter = 120; // 6pt

    // Xử lý tiêu đề La Mã (I, II, III...)
    if (/^[IVXLC]+\./.test(trimmedLine)) {
      bold = true;
      spacingAfter = 200;
    }

    // Xử lý các dòng đầu (Quốc hiệu, Tên chi bộ, Tiêu đề văn bản)
    if (index < 10) {
      const upperLine = trimmedLine.toUpperCase();
      if (upperLine.includes('ĐẢNG CỘNG SẢN VIỆT NAM') || 
          upperLine.includes('NGHỊ QUYẾT') || 
          upperLine.includes('BÁO CÁO') ||
          upperLine.includes('ĐƠN XIN VÀO ĐẢNG') ||
          upperLine.includes('KẾ HOẠCH') ||
          upperLine.includes('QUYẾT ĐỊNH') ||
          upperLine.includes('TỜ TRÌNH')) {
        alignment = AlignmentType.CENTER;
        bold = true;
        size = 30; // 15pt
      }
    }

    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: "Times New Roman",
          size: size,
          bold: bold,
        }),
      ],
      alignment: alignment,
      spacing: {
        line: 360, // 1.5 line spacing
        after: spacingAfter,
      },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top: 1440,    // 2.54cm
              bottom: 1134, // 2.0cm
              left: 1700,   // ~3.0cm
              right: 850,   // ~1.5cm
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${superiorParty.toUpperCase()} - ${docType.toUpperCase()}`,
                    font: "Times New Roman",
                    size: 20, // 10pt
                    color: "666666",
                  }),
                ],
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Trang ",
                    font: "Times New Roman",
                    size: 20, // 10pt
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Times New Roman",
                    size: 20,
                  }),
                  new TextRun({
                    text: " / ",
                    font: "Times New Roman",
                    size: 20,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Times New Roman",
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const formatFileName = (type: string, contentName: string) => {
  const now = new Date();
  const dateStr = `${now.getDate()}_${now.getMonth() + 1}_${now.getFullYear()}`;
  const cleanType = type.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanContent = contentName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `${cleanType}_${cleanContent}_${dateStr}.docx`;
};
