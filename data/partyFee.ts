
/**
 * Dữ liệu và logic tính đảng phí
 * Theo Quy định 01-QĐ/TW ngày 03/02/2026 của Bộ Chính trị
 * Có hiệu lực từ 01/02/2026
 * Thay thế Quyết định 342-QĐ/TW ngày 28/12/2010
 */

// Lương tối thiểu vùng 2026 (Nghị định 74/2024/NĐ-CP)
export const MINIMUM_WAGES: Record<string, number> = {
    'Vùng I': 4960000,
    'Vùng II': 4410000,
    'Vùng III': 3860000,
    'Vùng IV': 3450000
};

export type MemberType =
    | 'bhxh'            // Có BHXH bắt buộc (đang đi làm)
    | 'huu_tri'         // Hưu trí
    | 'huu_lam_them'    // Hưu trí + làm thêm
    | 'chua_du_tuoi_huu' // Chưa đủ tuổi hưu, không BHXH
    | 'du_tuoi_huu'     // Đủ tuổi hưu, không BHXH
    | 'hoc_sinh_sv'     // Học sinh, sinh viên
    | 'om_dau_thai_san' // Đang nghỉ ốm đau, thai sản
    | 'nguoi_co_cong'   // Người có công, trợ cấp mất sức
    | 'mien';           // Miễn đóng

export interface MemberTypeInfo {
    key: MemberType;
    label: string;
    description: string;
    needsSalary?: boolean;
    needsPension?: boolean;
    needsExtraIncome?: boolean;
    needsRegion?: boolean;
    needsAllowance?: boolean;
    fixedAmount?: number;
    exemptMsg?: string;
}

export const MEMBER_TYPES: MemberTypeInfo[] = [
    {
        key: 'bhxh',
        label: 'Đang làm việc (có BHXH)',
        description: 'Đảng viên thuộc đối tượng tham gia BHXH bắt buộc',
        needsSalary: true
    },
    {
        key: 'huu_tri',
        label: 'Hưu trí',
        description: 'Đảng viên hưởng lương hưu hàng tháng',
        needsPension: true
    },
    {
        key: 'huu_lam_them',
        label: 'Hưu trí + làm thêm',
        description: 'Đảng viên hưu trí được mời làm việc, hưởng tiền công/phụ cấp',
        needsPension: true,
        needsExtraIncome: true
    },
    {
        key: 'om_dau_thai_san',
        label: 'Nghỉ ốm đau / thai sản',
        description: 'Đảng viên đang nghỉ ốm đau, thai sản hưởng BHXH',
        needsAllowance: true
    },
    {
        key: 'chua_du_tuoi_huu',
        label: 'Chưa đủ tuổi nghỉ hưu (không BHXH)',
        description: 'Đảng viên chưa đến tuổi hưu, không tham gia BHXH',
        needsRegion: true
    },
    {
        key: 'du_tuoi_huu',
        label: 'Đủ tuổi nghỉ hưu (không BHXH)',
        description: 'Đảng viên đã đủ tuổi hưu theo điều kiện lao động bình thường',
        needsRegion: true
    },
    {
        key: 'hoc_sinh_sv',
        label: 'Học sinh / Sinh viên',
        description: 'Đảng viên là học sinh, sinh viên',
        fixedAmount: 5000
    },
    {
        key: 'nguoi_co_cong',
        label: 'Người có công / Mất sức LĐ',
        description: 'Đảng viên hưởng trợ cấp bệnh binh, mất sức LĐ, bảo trợ XH',
        needsAllowance: true
    },
    {
        key: 'mien',
        label: 'Miễn đóng đảng phí',
        description: 'Đảng viên ≥50 năm tuổi Đảng, hộ nghèo, bệnh hiểm nghèo, trợ cấp hưu trí XH',
        exemptMsg: 'Được miễn đóng đảng phí theo QĐ 01-QĐ/TW'
    }
];

/**
 * Tính đảng phí hàng tháng
 */
export function calculatePartyFee(
    memberType: MemberType,
    options: {
        salary?: number;         // Lương tính BHXH
        pension?: number;        // Lương hưu
        extraIncome?: number;    // Tiền công/phụ cấp (hưu làm thêm)
        allowance?: number;      // Trợ cấp ốm đau/thai sản/bệnh binh
        region?: string;         // Vùng (I, II, III, IV)
    }
): { amount: number; formula: string; note?: string } {
    const { salary = 0, pension = 0, extraIncome = 0, allowance = 0, region = 'Vùng I' } = options;
    const now = new Date();
    const isPhase1 = now < new Date('2028-01-01'); // 2026-2027

    switch (memberType) {
        case 'bhxh':
            return {
                amount: Math.round(salary * 0.01),
                formula: `${salary.toLocaleString('vi-VN')}đ × 1% = ${Math.round(salary * 0.01).toLocaleString('vi-VN')}đ`,
                note: '1% lương làm căn cứ đóng BHXH bắt buộc'
            };

        case 'huu_tri':
            return {
                amount: Math.round(pension * 0.005),
                formula: `${pension.toLocaleString('vi-VN')}đ × 0.5% = ${Math.round(pension * 0.005).toLocaleString('vi-VN')}đ`,
                note: '0.5% mức lương hưu được hưởng'
            };

        case 'huu_lam_them': {
            const fromPension = Math.round(pension * 0.005);
            const fromExtra = Math.round(extraIncome * 0.005);
            return {
                amount: fromPension + fromExtra,
                formula: `(${pension.toLocaleString('vi-VN')}đ × 0.5%) + (${extraIncome.toLocaleString('vi-VN')}đ × 0.5%) = ${(fromPension + fromExtra).toLocaleString('vi-VN')}đ`,
                note: '0.5% lương hưu + 0.5% tiền công/phụ cấp'
            };
        }

        case 'om_dau_thai_san':
            return {
                amount: Math.round(allowance * 0.01),
                formula: `${allowance.toLocaleString('vi-VN')}đ × 1% = ${Math.round(allowance * 0.01).toLocaleString('vi-VN')}đ`,
                note: '1% mức trợ cấp ốm đau/thai sản do BHXH chi trả'
            };

        case 'chua_du_tuoi_huu': {
            const minWage = MINIMUM_WAGES[region] || MINIMUM_WAGES['Vùng I'];
            const rate = isPhase1 ? 0.003 : 0.005;
            const rateLabel = isPhase1 ? '0.3%' : '0.5%';
            const phaseLabel = isPhase1 ? '(2026-2027)' : '(từ 2028)';
            const amount = Math.round(minWage * rate);
            return {
                amount,
                formula: `${minWage.toLocaleString('vi-VN')}đ (${region}) × ${rateLabel} = ${amount.toLocaleString('vi-VN')}đ`,
                note: `${rateLabel} lương tối thiểu vùng ${phaseLabel}`
            };
        }

        case 'du_tuoi_huu': {
            const minWage = MINIMUM_WAGES[region] || MINIMUM_WAGES['Vùng I'];
            const rate = isPhase1 ? 0.002 : 0.003;
            const rateLabel = isPhase1 ? '0.2%' : '0.3%';
            const phaseLabel = isPhase1 ? '(2026-2027)' : '(từ 2028)';
            const amount = Math.round(minWage * rate);
            return {
                amount,
                formula: `${minWage.toLocaleString('vi-VN')}đ (${region}) × ${rateLabel} = ${amount.toLocaleString('vi-VN')}đ`,
                note: `${rateLabel} lương tối thiểu vùng ${phaseLabel}`
            };
        }

        case 'hoc_sinh_sv':
            return {
                amount: 5000,
                formula: 'Mức cố định: 5.000đ/tháng',
                note: 'Đảng viên là học sinh, sinh viên'
            };

        case 'nguoi_co_cong':
            return {
                amount: Math.round(allowance * 0.005),
                formula: `${allowance.toLocaleString('vi-VN')}đ × 0.5% = ${Math.round(allowance * 0.005).toLocaleString('vi-VN')}đ`,
                note: '50% mức đóng quy định (= 0.5% trợ cấp)'
            };

        case 'mien':
            return {
                amount: 0,
                formula: 'Miễn đóng đảng phí',
                note: 'Đảng viên ≥50 năm tuổi Đảng, hộ nghèo/cận nghèo, bệnh hiểm nghèo, trợ cấp hưu trí XH'
            };

        default:
            return { amount: 0, formula: 'Chưa xác định' };
    }
}

/**
 * Tỷ lệ trích nộp lên cấp trên (theo QĐ 01-QĐ/TW)
 */
export const RETENTION_RATES = {
    chiBoGiu: 70,     // Chi bộ giữ lại 70% (QĐ 01-QĐ/TW, mục 1.1)
    nopCapTren: 30    // Nộp cấp trên 30%
};

export function calculateRetention(totalCollected: number) {
    return {
        chiBoGiu: Math.round(totalCollected * RETENTION_RATES.chiBoGiu / 100),
        nopCapTren: Math.round(totalCollected * RETENTION_RATES.nopCapTren / 100)
    };
}

/**
 * Thông tin ngân hàng chi bộ (VietQR)
 */
export const BANK_CONFIG = {
    bankId: 'BIDV',
    accountNo: '8670100005',
    accountName: 'CHI BO KHU PHO 3',
    template: 'compact2'
};

/**
 * Tạo URL ảnh QR VietQR cho đảng viên
 */
export function getVietQRUrl(amount: number, memberName: string, month: number, year: number): string {
    const mm = String(month).padStart(2, '0');
    const addInfo = encodeURIComponent(`DP T${mm}/${year} ${memberName}`.slice(0, 50));
    const accName = encodeURIComponent(BANK_CONFIG.accountName);
    return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${amount}&addInfo=${addInfo}&accountName=${accName}`;
}
