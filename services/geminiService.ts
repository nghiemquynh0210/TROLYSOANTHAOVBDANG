
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { DocLevel, DocType } from "../types";
import { getKtgsTemplate } from "../data/ktgsTemplates";

export interface DocMetadata {
  superiorParty: string;
  branchName: string;
  locationDate: string;
  level: DocLevel;
  memberName?: string;
  gender?: string;
  birthName?: string;
  alias?: string;
  birthDate?: string;
  birthPlace?: string;
  homeTown?: string;
  address?: string;
  ethnicity?: string;
  religion?: string;
  familyBackground?: string;
  profession?: string;
  educationGeneral?: string;
  educationProfessional?: string;
  academicDegree?: string;
  politicalTheory?: string;
  foreignLanguage?: string;
  unionAdmissionDate?: string;
  unionAdmissionPlace?: string;
  prevPartyAdmission?: string;

  meetingTime?: string;
  meetingLocation?: string;
  totalMembers?: string;
  presentMembers?: string;
  absentMembers?: string;
  absentReasons?: string;
  chairpersonName?: string;
  chairpersonRole?: string;
  secretaryName?: string;
}

export const generateDraftContent = async (
  type: string,
  rawContent: string,
  metadata: DocMetadata,
  templateContent?: string
): Promise<string> => {
  // Get API key: try user-scoped keys first, then global fallback
  const { supabase } = await import('./supabaseClient');
  let apiKey: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      apiKey = localStorage.getItem(`gemini_api_key_${user.id}`);
    }
  } catch { }
  if (!apiKey) {
    apiKey = localStorage.getItem('gemini_api_key');
  }

  if (!apiKey) {
    throw new Error('API Key chưa được cấu hình. Vui lòng vào Cài đặt để nhập API Key.');
  }

  const ai = new GoogleGenAI({ apiKey });

  let formattingGuideline = "";
  let meetingInfoBlock = "";

  if (metadata.meetingTime || metadata.chairpersonName) {
    meetingInfoBlock = `
DỮ LIỆU ĐIỀU HÀNH KỲ HỌP (PHẢI SỬ DỤNG CHÍNH XÁC):
- Thời gian: ${metadata.meetingTime}
- Địa điểm: ${metadata.meetingLocation}
- Thành phần: Tổng số ${metadata.totalMembers} đ/c; Có mặt ${metadata.presentMembers} đ/c; Vắng mặt ${metadata.absentMembers} đ/c (Lý do: ${metadata.absentReasons}).
- Chủ trì: Đồng chí ${metadata.chairpersonName} - ${metadata.chairpersonRole}.
- Thư ký: Đồng chí ${metadata.secretaryName}.
`;
  }

  if (type.includes('KIỂM TRA') || type.includes('GIÁM SÁT')) {
    formattingGuideline = "ĐẶC THÙ KTGS: Đảm bảo văn phong hành chính - tư pháp Đảng. Các kết luận phải rõ ràng, phân định đúng sai dựa trên Quy định số 22-QĐ/TW và các hướng dẫn hiện hành. Không dùng từ ngữ cảm tính.";
  }

  // ── KTGS Template injection: map the `type` string back to DocType enum ──
  let ktgsTemplateBlock = "";
  const matchedDocType = Object.values(DocType).find(dt => dt === type) as DocType | undefined;
  if (matchedDocType) {
    const tpl = getKtgsTemplate(matchedDocType);
    if (tpl) {
      ktgsTemplateBlock = `
⚠️⚠️⚠️ CẤU TRÚC MẪU CHUẨN — BẮT BUỘC GIỮ NGUYÊN 100% ⚠️⚠️⚠️
Dưới đây là CẤU TRÚC MẪU CHÍNH THỨC được trích xuất từ biểu mẫu gốc.
Bạn PHẢI sử dụng ĐÚNG khung sườn này. CHỈ ĐƯỢC điền nội dung vào chỗ trống (dấu chấm, gạch dưới).
TUYỆT ĐỐI KHÔNG ĐƯỢC thay đổi thứ tự các phần, thêm/bớt mục, thay đổi tiêu đề mục, thay đổi cấu trúc phần đầu/cuối.

--- BẮT ĐẦU MẪU CHUẨN ---
${tpl}
--- KẾT THÚC MẪU CHUẨN ---

QUY TẮC ÁP DỤNG:
1. GIỮ NGUYÊN tất cả tiêu đề mục (I, II, III..., 1, 2, 3..., 2.1, 2.2...)
2. GIỮ NGUYÊN phần đầu (Đảng bộ, Chi bộ, Số văn bản, ngày tháng) và phần cuối (Nơi nhận, Chữ ký)
3. GIỮ NGUYÊN câu mở đầu, câu kết chuẩn mực
4. CHỈ ĐIỀN thông tin cụ thể vào vị trí có dấu chấm (…), gạch dưới (___), hoặc ghi chú (ghi nội dung)
5. Nếu mẫu ghi "(ghi đầy đủ…)" → Viết chi tiết nội dung tại vị trí đó
6. KHÔNG gộp các mục con, KHÔNG tách mục lớn, KHÔNG thay đổi cách đánh số
`;
    }
  }

  // ── Admission / Development form-specific rules ──
  let admissionGuideline = "";
  let memberInfoBlock = "";

  if (type.includes('KNĐ') || type.includes('MẪU')) {
    admissionGuideline = `
ĐẶC THÙ BIỂU MẪU KNĐ (HƯỚNG DẪN 38-HD/BTCTW):
⚠️ NGUYÊN TẮC BẢO TỒN BIỂU MẪU — BẮT BUỘC TUYỆT ĐỐI:
1. GIỮ NGUYÊN 100% cấu trúc, tiêu đề, phần "Kính gửi", mục số La Mã, ghi chú chân trang.
2. CHỈ điền thông tin vào chỗ dấu chấm (…) hoặc ô trống. KHÔNG xóa/sửa/gộp/tách bất kỳ thành phần nào.
3. Sử dụng CHÍNH XÁC thuật ngữ Đảng vụ theo HD 38.
4. Phần đầu: ĐẢNG CỘNG SẢN VIỆT NAM → dấu sao (*) → Đảng bộ/Chi bộ → Số văn bản → Ngày tháng → Tiêu đề.
5. Phần cuối: Giữ đúng chức danh ký (T/M CHI BỘ - BÍ THƯ, Người giới thiệu, T/M ĐẢNG ỦY, v.v.).
6. Câu kết chuẩn: Mỗi mẫu có câu kết riêng (VD: "Tôi giới thiệu và đề nghị…", "Chi bộ đề nghị…"). GIỮ NGUYÊN.
7. KHÔNG thêm hoặc bớt nội dung so với mẫu gốc.
`;

    if (metadata.memberName) {
      memberInfoBlock = `
THÔNG TIN ĐẢNG VIÊN / QUẦN CHÚNG (ĐIỀN VÀO MẪU):
- Họ và tên: ${metadata.memberName}
- Giới tính: ${metadata.gender || ''}
- Ngày sinh: ${metadata.birthDate || ''}
- Nơi sinh: ${metadata.birthPlace || ''}
- Quê quán: ${metadata.homeTown || ''}
- Nơi ở hiện nay: ${metadata.address || ''}
- Dân tộc: ${metadata.ethnicity || ''}
- Tôn giáo: ${metadata.religion || ''}
- Thành phần gia đình: ${metadata.familyBackground || ''}
- Nghề nghiệp: ${metadata.profession || ''}
- Trình độ văn hóa: ${metadata.educationGeneral || ''}
- Trình độ chuyên môn: ${metadata.educationProfessional || ''}
- Lý luận chính trị: ${metadata.politicalTheory || ''}
- Ngoại ngữ: ${metadata.foreignLanguage || ''}
- Ngày vào Đoàn: ${metadata.unionAdmissionDate || ''}
- Nơi vào Đoàn: ${metadata.unionAdmissionPlace || ''}
`;
    }
  }

  const prompt = `
⚠️ NHIỆM VỤ MỚI — ĐỘC LẬP HOÀN TOÀN ⚠️
Đây là một nhiệm vụ soạn thảo MỚI, KHÔNG liên quan đến bất kỳ văn bản nào trước đó.
Bạn PHẢI tập trung 100% vào loại văn bản được chỉ định dưới đây.
TUYỆT ĐỐI KHÔNG mang nội dung, cấu trúc, hoặc ngữ cảnh từ nhiệm vụ khác sang.

LOẠI VĂN BẢN CẦN SOẠN: ${type}

CƠ QUAN BAN HÀNH:
Đảng bộ: ${metadata.superiorParty}
Chi bộ: ${metadata.branchName}
Ngày tháng lập: ${metadata.locationDate}

${meetingInfoBlock}
${memberInfoBlock}
${admissionGuideline}
${ktgsTemplateBlock}
${templateContent ? `
⚠️ MẪU KHUNG SƯỜN DO NGƯỜI DÙNG CUNG CẤP ⚠️
Người dùng đã upload file mẫu. Hãy soạn văn bản THEO ĐÚNG cấu trúc, bố cục, tiêu đề mục, cách đánh số của mẫu này.
GIỮ NGUYÊN 100% khung sườn — CHỈ THAY ĐỔI/BỔ SUNG nội dung chi tiết.
Nếu mẫu có chỗ trống (dấu ..., gạch dưới, [nội dung]) thì điền nội dung phù hợp.
Nếu có mẫu người dùng thì ƯU TIÊN mẫu này hơn mẫu mặc định của hệ thống.

--- BẮT ĐẦU MẪU NGƯỜI DÙNG ---
${templateContent}
--- KẾT THÚC MẪU NGƯỜI DÙNG ---
` : ''}

NỘI DUNG NGƯỜI DÙNG CUNG CẤP (DỮ LIỆU THÔ):
${rawContent}

CHỈ DẪN QUAN TRỌNG:
1. Bạn phải HOÀN THIỆN TOÀN BỘ văn bản. Không được để lại bất kỳ dấu ba chấm (...) nào.
2. Với những ý tưởng người dùng nhập dở dang (ví dụ: "Chỉ đạo làm sạch đường phố để..."), bạn phải tự triển khai thành giải pháp đầy đủ (ví dụ: "Chỉ đạo Ban điều hành phối hợp với thanh niên ra quân xóa bỏ biển quảng cáo rao vặt, đảm bảo mỹ quan đô thị sạch đẹp.").
3. Trình bày theo đúng thể thức văn bản Đảng (Quốc hiệu, Tiêu đề, Nội dung I, II, III..., Ký tên).
4. Văn phong: Nghiêm túc, súc tích, chuyên nghiệp.
${type.includes('KNĐ') ? '5. TUYỆT ĐỐI TUÂN THỦ cấu trúc biểu mẫu theo Hướng dẫn 38-HD/BTCTW. CHỈ ĐIỀN NỘI DUNG, KHÔNG THAY ĐỔI KHUNG SƯỜN.' : ''}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    let cleanText = response.text || "";
    cleanText = cleanText.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '').replace(/#/g, '').replace(/\*/g, '-');
    return cleanText.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
