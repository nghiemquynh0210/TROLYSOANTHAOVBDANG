
// @ts-ignore
import html2pdf from 'html2pdf.js';

export const exportToPdf = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: [20, 15, 20, 30], // [top, right, bottom, left] chuẩn quy định văn bản Đảng
    filename: fileName,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { 
      scale: 3, // Tăng tỷ lệ để nét chữ sắc sảo khi in và ký số
      useCORS: true, 
      letterRendering: true,
      logging: false,
      fontBaseline: 'alphabetic'
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    // Chờ một chút để các style CSS được apply hoàn toàn trước khi chụp
    await new Promise(resolve => setTimeout(resolve, 300));
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("Lỗi xuất bản PDF:", error);
    throw error;
  }
};
