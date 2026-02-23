
export enum DocLevel {
  LEVEL_1 = 'CHI ỦY',
  LEVEL_2 = 'CHI BỘ',
  LEVEL_3 = 'CHUYÊN ĐỀ',
  LEVEL_DEV = 'CHUYỂN ĐẢNG CHÍNH THỨC',
  LEVEL_ADMISSION = 'KẾT NẠP ĐẢNG VIÊN',
  LEVEL_AUDIT = 'KIỂM TRA - GIÁM SÁT'
}

export enum AuditTab {
  GIAM_SAT = 'GIÁM SÁT',
  KIEM_TRA = 'KIỂM TRA',
  TO_CAO = 'GIẢI QUYẾT TỐ CÁO',
  DAU_HIEU_VP = 'DẤU HIỆU VI PHẠM',
  KY_LUAT = 'THI HÀNH KỶ LUẬT'
}

export enum DocType {
  // Cấp 1 - Chi ủy
  COMMITTEE_PROGRAM = 'CHƯƠNG TRÌNH SINH HOẠT CHI ỦY',
  COMMITTEE_CONCLUSION = 'KẾT LUẬN CỦA CHI ỦY',
  SUBMISSION = 'TỜ TRÌNH CỦA CHI BỘ (DỰ THẢO TRÌNH)',

  // Cấp 2 - Chi bộ
  MONTHLY_RESOLUTION = 'NGHỊ QUYẾT CHI BỘ HẰNG THÁNG',
  YEARLY_RESOLUTION = 'NGHỊ QUYẾT CHI BỘ NĂM',
  CONGRESS_RESOLUTION = 'NGHỊ QUYẾT ĐẠI HỘI CHI BỘ',
  MEETING_NOTICE = 'THÔNG BÁO KẾT LUẬN HỌP CHI BỘ',
  MEETING_MINUTES = 'BIÊN BẢN CUỘC HỌP CHI BỘ',
  BRANCH_PROGRAM = 'CHƯƠNG TRÌNH SINH HOẠT CHI BỘ',
  MONTHLY_PLAN = 'KẾ HOẠCH CÔNG TÁC THÁNG',
  REPORT = 'BÁO CÁO SƠ KẾT / TỔNG KẾT',
  YEAR_END_CELL_REVIEW = 'BÁO CÁO KIỂM ĐIỂM CHI BỘ CUỐI NĂM',
  MONTHLY_MEETING_ASSESSMENT = 'PHIẾU ĐÁNH GIÁ CHẤT LƯỢNG SINH HOẠT THÁNG',

  // Cấp 3 - Chuyên đề
  THEMATIC_RESOLUTION = 'NGHỊ QUYẾT CHI BỘ CHUYÊN ĐỀ',
  THEMATIC_PLAN = 'KẾ HOẠCH THỰC HIỆN NGHỊ QUYẾT CHUYÊN ĐỀ',
  THEMATIC_REPORT = 'BÁO CÁO KẾT QUẢ THỰC HIỆN CHUYÊN ĐỀ',

  // KẾT NẠP & CHÍNH THỨC
  KN_MAU_1 = 'MẪU 1-KNĐ: ĐƠN XIN VÀO ĐẢNG',
  KN_MAU_2 = 'MẪU 2-KNĐ: LÝ LỊCH NGƯỜI VÀO ĐẢNG',
  KN_MAU_3 = 'MẪU 3-KNĐ: GIẤY GIỚI THIỆU NGƯỜI VÀO ĐẢNG',
  KN_MAU_4 = 'MẪU 4-KNĐ: NHẬN XÉT CỦA ĐOÀN THỂ',
  KN_MAU_5 = 'MẪU 5-KNĐ: Ý KIẾN CHI ỦY NƠI CƯ TRÚ',
  KN_MAU_6 = 'MẪU 6-KNĐ: NGHỊ QUYẾT CHI BỘ KẾT NẠP',
  KN_MAU_7 = 'MẪU 7-KNĐ: BÁO CÁO CHI ỦY VỀ HỒ SƠ',
  KN_MAU_8 = 'MẪU 8-KNĐ: NGHỊ QUYẾT ĐẢNG ỦY CƠ SỞ',
  KN_MAU_9 = 'MẪU 9-KNĐ: QUYẾT ĐỊNH KẾT NẠP',
  CT_MAU_10 = 'MẪU 10-KNĐ: KIỂM ĐIỂM DỰ BỊ',
  CT_MAU_11 = 'MẪU 11-KNĐ: NHẬN XÉT NGƯỜI GIÚP ĐỠ',
  CT_MAU_12 = 'MẪU 12-KNĐ: NHẬN XÉT ĐOÀN THỂ',
  CT_MAU_13 = 'MẪU 13-KNĐ: Ý KIẾN NƠI CƯ TRÚ',
  CT_MAU_14 = 'MẪU 14-KNĐ: NGHỊ QUYẾT CÔNG NHẬN CHÍNH THỨC',
  CT_MAU_15 = 'MẪU 15-KNĐ: BÁO CÁO CHI ỦY HỒ SƠ CHÍNH THỨC',
  CT_MAU_16 = 'MẪU 16-KNĐ: QUYẾT ĐỊNH CÔNG NHẬN CHÍNH THỨC',

  // QUY TRÌNH KIỂM TRA CHUYÊN ĐỀ (KT1-KT12)
  KT_1 = 'KT1. KẾ HOẠCH KIỂM TRA CHUYÊN ĐỀ',
  KT_2 = 'KT2. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',
  KT_3 = 'KT3. ĐỀ CƯƠNG YÊU CẦU BÁO CÁO TỰ KIỂM TRA',
  KT_4 = 'KT4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',
  KT_5 = 'KT5. BÁO CÁO TỰ KIỂM TRA CỦA ĐẢNG VIÊN',
  KT_6 = 'KT6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',
  KT_7 = 'KT7. BIÊN BẢN XÁC MINH CỦA TỔ KIỂM TRA',
  KT_8 = 'KT8. BÁO CÁO KẾT QUẢ KIỂM TRA (TỔ KT)',
  KT_9 = 'KT9. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ (KT)',
  KT_10 = 'KT10. THÔNG BÁO KẾT LUẬN KIỂM TRA',
  KT_11 = 'KT11. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',
  KT_12 = 'KT12. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',

  // QUY TRÌNH GIÁM SÁT CHUYÊN ĐỀ (GS1-GS12)
  GS_1 = 'GS1. KẾ HOẠCH GIÁM SÁT CHUYÊN ĐỀ',
  GS_2 = 'GS2. KẾ HOẠCH CHI TIẾT CỦA TỔ GIÁM SÁT',
  GS_3 = 'GS3. ĐỀ CƯƠNG BÁO CÁO TỰ GIÁM SÁT',
  GS_4 = 'GS4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',
  GS_5 = 'GS5. BÁO CÁO TỰ GIÁM SÁT CỦA ĐẢNG VIÊN',
  GS_6 = 'GS6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',
  GS_7 = 'GS7. BIÊN BẢN XÁC MINH CỦA TỔ GIÁM SÁT',
  GS_8 = 'GS8. BÁO CÁO KẾT QUẢ GIÁM SÁT (TỔ GS)',
  GS_9 = 'GS9. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ (GS)',
  GS_10 = 'GS10. THÔNG BÁO KẾT LUẬN GIÁM SÁT',
  GS_11 = 'GS11. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',
  GS_12 = 'GS12. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',

  // QUY TRÌNH GIẢI QUYẾT TỐ CÁO (TC1-TC16)
  TC_1 = 'TC1. BIÊN BẢN LÀM VIỆC VỚI NGƯỜI TỐ CÁO',
  TC_2 = 'TC2. KẾ HOẠCH GIẢI QUYẾT TỐ CÁO (CHI BỘ)',
  TC_3 = 'TC3. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',
  TC_4 = 'TC4. ĐỀ CƯƠNG BÁO CÁO GIẢI TRÌNH',
  TC_5 = 'TC5. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',
  TC_6 = 'TC6. BÁO CÁO GIẢI TRÌNH CỦA ĐẢNG VIÊN',
  TC_7 = 'TC7. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',
  TC_8 = 'TC8. BIÊN BẢN XÁC MINH',
  TC_9 = 'TC9. BÁO CÁO KẾT QUẢ CỦA TỔ KIỂM TRA',
  TC_10 = 'TC10. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ',
  TC_11 = 'TC11. THÔNG BÁO KẾT LUẬN GIẢI QUYẾT TỐ CÁO',
  TC_12 = 'TC12. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',
  TC_13 = 'TC13. PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT',
  TC_14 = 'TC14. BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT',
  TC_15 = 'TC15. PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT',
  TC_16 = 'TC16. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',

  // QUY TRÌNH KIỂM TRA DẤU HIỆU VI PHẠM (DH1-DH18)
  DH_1 = 'DH1. KẾ HOẠCH KIỂM TRA DẤU HIỆU VI PHẠM',
  DH_2 = 'DH2. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',
  DH_3 = 'DH3. ĐỀ CƯƠNG BÁO CÁO',
  DH_4 = 'DH4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',
  DH_5 = 'DH5. BIÊN BẢN LÀM VIỆC VỚI TỔ CHỨC, CÁ NHÂN LIÊN QUAN',
  DH_6 = 'DH6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',
  DH_7 = 'DH7. BÁO CÁO KẾT QUẢ KIỂM TRA',
  DH_8 = 'DH8. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ',
  DH_9 = 'DH9. THÔNG BÁO KẾT LUẬN KIỂM TRA',
  DH_10 = 'DH10. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',
  DH_11 = 'DH11. BIÊN BẢN TRIỂN KHAI QUY TRÌNH KỶ LUẬT',
  DH_12 = 'DH12. BIÊN BẢN KIỂM PHIẾU THI HÀNH KỶ LUẬT',
  DH_13 = 'DH13. QUYẾT ĐỊNH KỶ LUẬT',
  DH_14 = 'DH14. BIÊN BẢN TRIỂN KHAI QUYẾT ĐỊNH KỶ LUẬT',
  DH_15 = 'DH15. PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT',
  DH_16 = 'DH16. BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT',
  DH_17 = 'DH17. PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT',
  DH_18 = 'DH18. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',

  // QUY TRÌNH THI HÀNH KỶ LUẬT (KL1-KL16)
  KL_1 = 'KL1. KẾ HOẠCH THI HÀNH KỶ LUẬT (CHI BỘ)',
  KL_2 = 'KL2. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',
  KL_3 = 'KL3. ĐỀ CƯƠNG BÁO CÁO KIỂM ĐIỂM',
  KL_4 = 'KL4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',
  KL_5 = 'KL5. BÁO CÁO KIỂM ĐIỂM CỦA ĐẢNG VIÊN',
  KL_6 = 'KL6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',
  KL_7 = 'KL7. BIÊN BẢN THẨM TRA, XÁC MINH',
  KL_8 = 'KL8. BÁO CÁO ĐỀ NGHỊ THI HÀNH KỶ LUẬT',
  KL_9 = 'KL9. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ',
  KL_10 = 'KL10. PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT',
  KL_11 = 'KL11. BIÊN BẢN KIỂM PHIẾU THI HÀNH KỶ LUẬT',
  KL_12 = 'KL12. QUYẾT ĐỊNH KỶ LUẬT',
  KL_13 = 'KL13. BIÊN BẢN CÔNG BỐ QUYẾT ĐỊNH KỶ LUẬT',
  KL_14 = 'KL14. PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT',
  KL_15 = 'KL15. BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT',
  KL_16 = 'KL16. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ'
}

export const AUDIT_TABS_MAPPING: Record<AuditTab, DocType[]> = {
  [AuditTab.KIEM_TRA]: [
    DocType.KT_1, DocType.KT_2, DocType.KT_3, DocType.KT_4, DocType.KT_5, DocType.KT_6,
    DocType.KT_7, DocType.KT_8, DocType.KT_9, DocType.KT_10, DocType.KT_11, DocType.KT_12
  ],
  [AuditTab.GIAM_SAT]: [
    DocType.GS_1, DocType.GS_2, DocType.GS_3, DocType.GS_4, DocType.GS_5, DocType.GS_6,
    DocType.GS_7, DocType.GS_8, DocType.GS_9, DocType.GS_10, DocType.GS_11, DocType.GS_12
  ],
  [AuditTab.TO_CAO]: [
    DocType.TC_1, DocType.TC_2, DocType.TC_3, DocType.TC_4, DocType.TC_5, DocType.TC_6,
    DocType.TC_7, DocType.TC_8, DocType.TC_9, DocType.TC_10, DocType.TC_11, DocType.TC_12,
    DocType.TC_13, DocType.TC_14, DocType.TC_15, DocType.TC_16
  ],
  [AuditTab.DAU_HIEU_VP]: [
    DocType.DH_1, DocType.DH_2, DocType.DH_3, DocType.DH_4, DocType.DH_5, DocType.DH_6,
    DocType.DH_7, DocType.DH_8, DocType.DH_9, DocType.DH_10, DocType.DH_11, DocType.DH_12,
    DocType.DH_13, DocType.DH_14, DocType.DH_15, DocType.DH_16, DocType.DH_17, DocType.DH_18
  ],
  [AuditTab.KY_LUAT]: [
    DocType.KL_1, DocType.KL_2, DocType.KL_3, DocType.KL_4, DocType.KL_5, DocType.KL_6,
    DocType.KL_7, DocType.KL_8, DocType.KL_9, DocType.KL_10, DocType.KL_11, DocType.KL_12,
    DocType.KL_13, DocType.KL_14, DocType.KL_15, DocType.KL_16
  ]
};

export const LEVEL_PERMISSION_MAPPING: Record<DocLevel, DocType[]> = {
  [DocLevel.LEVEL_1]: [DocType.COMMITTEE_PROGRAM, DocType.COMMITTEE_CONCLUSION, DocType.SUBMISSION],
  [DocLevel.LEVEL_2]: [
    DocType.MONTHLY_RESOLUTION, DocType.YEARLY_RESOLUTION, DocType.CONGRESS_RESOLUTION,
    DocType.BRANCH_PROGRAM, DocType.MEETING_NOTICE, DocType.MEETING_MINUTES,
    DocType.MONTHLY_PLAN, DocType.REPORT, DocType.YEAR_END_CELL_REVIEW, DocType.MONTHLY_MEETING_ASSESSMENT
  ],
  [DocLevel.LEVEL_3]: [DocType.THEMATIC_RESOLUTION, DocType.THEMATIC_PLAN, DocType.THEMATIC_REPORT],
  [DocLevel.LEVEL_ADMISSION]: [
    DocType.KN_MAU_1, DocType.KN_MAU_2, DocType.KN_MAU_3, DocType.KN_MAU_4,
    DocType.KN_MAU_5, DocType.KN_MAU_6, DocType.KN_MAU_7, DocType.KN_MAU_8, DocType.KN_MAU_9
  ],
  [DocLevel.LEVEL_DEV]: [
    DocType.CT_MAU_10, DocType.CT_MAU_11, DocType.CT_MAU_12, DocType.CT_MAU_13,
    DocType.CT_MAU_14, DocType.CT_MAU_15, DocType.CT_MAU_16
  ],
  [DocLevel.LEVEL_AUDIT]: [
    ...AUDIT_TABS_MAPPING[AuditTab.GIAM_SAT],
    ...AUDIT_TABS_MAPPING[AuditTab.KIEM_TRA],
    ...AUDIT_TABS_MAPPING[AuditTab.TO_CAO],
    ...AUDIT_TABS_MAPPING[AuditTab.DAU_HIEU_VP],
    ...AUDIT_TABS_MAPPING[AuditTab.KY_LUAT]
  ]
};

export const DOC_STRUCTURES: Partial<Record<DocType, string[]>> = {
  [DocType.MONTHLY_MEETING_ASSESSMENT]: ['I. Thông tin chung', 'II. Chấm điểm chi tiết (1-8)', 'III. Tổng điểm', 'IV. Xếp loại', 'V. Chữ ký'],
};

// ==================== HỒ SƠ ĐẢNG VIÊN / QUẦN CHÚNG ====================

export interface MemberProfile {
  id: string;
  fullName: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  homeTown: string;
  address: string;
  ethnicity: string;
  religion: string;
  familyBackground: string;
  profession: string;
  workplace: string;
  educationGeneral: string;
  educationProfessional: string;
  politicalTheory: string;
  foreignLanguage: string;
  unionAdmissionDate: string;
  unionAdmissionPlace: string;
  workHistory: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== LỘ TRÌNH KẾT NẠP ====================

export enum AdmissionStep {
  QUAN_CHUNG = 'Quần chúng ưu tú',
  HOC_CAM_TINH = 'Học lớp cảm tình Đảng',
  THAM_TRA = 'Thẩm tra lý lịch',
  KET_NAP = 'Xét kết nạp',
  DU_BI = 'Đảng viên dự bị',
  CHINH_THUC = 'Đảng viên chính thức'
}

export const ADMISSION_STEP_ORDER: AdmissionStep[] = [
  AdmissionStep.QUAN_CHUNG,
  AdmissionStep.HOC_CAM_TINH,
  AdmissionStep.THAM_TRA,
  AdmissionStep.KET_NAP,
  AdmissionStep.DU_BI,
  AdmissionStep.CHINH_THUC
];

export interface AdmissionTracking {
  id: string;
  profileId: string;
  currentStep: AdmissionStep;
  stepStartDate: string;
  note: string;
  history: { step: AdmissionStep; date: string; note: string }[];
  createdAt: string;
  updatedAt: string;
}
