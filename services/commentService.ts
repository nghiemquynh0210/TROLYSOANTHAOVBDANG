
import { GoogleGenAI } from "@google/genai";

export type CommentType = 'uu_diem' | 'khuyet_diem' | 'nhan_xet_chung' | 'phe_binh' | 'de_xuat';

const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
    uu_diem: 'Ưu điểm',
    khuyet_diem: 'Khuyết điểm',
    nhan_xet_chung: 'Nhận xét chung',
    phe_binh: 'Phê bình',
    de_xuat: 'Đề xuất kiến nghị',
};

const COMMENT_PROMPTS: Record<CommentType, string> = {
    uu_diem: `Chuyển nhận xét thô thành VĂN PHONG ĐẢNG chuẩn mực về ƯU ĐIỂM.
Yêu cầu:
- Dùng các cụm từ chuẩn: "có tinh thần trách nhiệm cao", "gương mẫu chấp hành", "tích cực tham gia", "hoàn thành tốt nhiệm vụ được giao"
- Không dùng ngôn ngữ đời thường, phải trang trọng, khách quan
- Giữ nguyên ý chính, bổ sung văn phong Đảng`,

    khuyet_diem: `Chuyển nhận xét thô thành VĂN PHONG ĐẢNG chuẩn mực về KHUYẾT ĐIỂM.
Yêu cầu:
- Dùng các cụm từ mềm mại nhưng rõ ràng: "cần khắc phục", "chưa thật sự chủ động", "cần nêu cao hơn nữa", "đôi lúc chưa sâu sát"  
- Tránh dùng từ nặng nề, phải xây dựng và thiện chí
- Nhận xét phải cụ thể, không chung chung`,

    nhan_xet_chung: `Chuyển nhận xét thô thành NHẬN XÉT TỔNG HỢP chuẩn văn phong Đảng.
Yêu cầu:
- Cấu trúc: Ưu điểm trước, sau đó là hạn chế/khuyết điểm
- Dùng giọng văn khách quan, công tâm, có tính xây dựng
- Kết thúc bằng đánh giá xếp loại nếu phù hợp`,

    phe_binh: `Chuyển nhận xét phê bình thô thành VĂN PHONG ĐẢNG chuẩn mực.
Yêu cầu:
- Phê bình nghiêm khắc nhưng có tính xây dựng
- Chỉ rõ vi phạm/thiếu sót, viện dẫn quy định nếu có
- Kết thúc bằng yêu cầu khắc phục cụ thể`,

    de_xuat: `Chuyển ý tưởng đề xuất thô thành VĂN PHONG HÀNH CHÍNH ĐẢNG.
Yêu cầu:
- Dùng cấu trúc: "Đề nghị...", "Kiến nghị...", "Đề xuất..."
- Ngắn gọn, rõ ràng, có tính khả thi
- Nêu rõ đối tượng thực hiện và thời hạn nếu có`,
};

export const transformComment = async (
    rawText: string,
    type: CommentType
): Promise<string> => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error('API Key chưa được cấu hình. Vui lòng vào Cài đặt để nhập API Key.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
BẠN LÀ CHUYÊN GIA VĂN PHONG ĐẢNG CỘNG SẢN VIỆT NAM.

NHIỆM VỤ: ${COMMENT_PROMPTS[type]}

NHẬN XÉT THÔ CỦA NGƯỜI DÙNG:
"${rawText}"

YÊU CẦU ĐẦU RA:
- CHỈ trả về đoạn văn đã chuyển đổi, KHÔNG thêm giải thích hay ghi chú
- Giữ đúng ý nghĩa gốc, chỉ thay đổi văn phong
- Độ dài tương đương hoặc hơn một chút so với bản gốc
- KHÔNG dùng dấu markdown (**, ##, v.v.)
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.2,
            },
        });

        let cleanText = response.text || "";
        cleanText = cleanText.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '').replace(/#/g, '').replace(/\*/g, '');
        return cleanText.trim();
    } catch (error) {
        console.error("Comment transform error:", error);
        throw error;
    }
};

export { COMMENT_TYPE_LABELS };
