
export interface Regulation {
    id: string;
    number: string;
    title: string;
    issuedBy: string;
    issuedDate: string;
    effectiveDate: string;
    summary: string;
    keyPoints: string[];
    supersedes?: string;
    category: 'kiểm tra' | 'kỷ luật' | 'tổ chức' | 'đảng viên' | 'chung' | 'đảng phí';
    isNew?: boolean;
}

export const REGULATIONS: Regulation[] = [
    // ═══════════════════════════════════════════
    //  KHÓA XIV (2025-2026) — VĂN BẢN MỚI NHẤT
    // ═══════════════════════════════════════════
    {
        id: 'qd-01-dangphi',
        number: 'Quy định số 01-QĐ/TW',
        title: 'Về chế độ đảng phí',
        issuedBy: 'Bộ Chính trị',
        issuedDate: '03/02/2026',
        effectiveDate: '01/02/2026',
        summary: 'Quy định mới nhất về chế độ đảng phí, thay thế Quyết định 342-QĐ/TW ngày 28/12/2010. Đảng viên có BHXH bắt buộc đóng 1% lương; hưu trí đóng 0.5% lương hưu; sinh viên 5.000đ/tháng. Miễn đóng cho đảng viên ≥50 năm tuổi Đảng, hộ nghèo, bệnh hiểm nghèo.',
        keyPoints: [
            'Thay thế Quyết định 342-QĐ/TW ngày 28/12/2010',
            'Đảng viên có BHXH bắt buộc: đóng 1% lương tính BHXH',
            'Đảng viên hưu trí: đóng 0.5% lương hưu',
            'Đảng viên chưa đủ tuổi hưu (không BHXH): 0.3% lương tối thiểu vùng (2026-2027), 0.5% (từ 2028)',
            'Đảng viên đủ tuổi hưu (không BHXH): 0.2% lương tối thiểu vùng (2026-2027), 0.3% (từ 2028)',
            'Học sinh, sinh viên: 5.000 đồng/tháng',
            'Miễn đóng: ≥50 năm tuổi Đảng, hộ nghèo, bệnh hiểm nghèo',
            'Có thể đóng qua Cổng Dịch vụ công Quốc gia hoặc tiền mặt',
            'Không đóng 3 tháng/năm không lý do → xóa tên'
        ],
        supersedes: 'Quyết định 342-QĐ/TW ngày 28/12/2010',
        category: 'đảng phí',
        isNew: true
    },
    {
        id: 'qd-294',
        number: 'Quy định số 294-QĐ/TW',
        title: 'Về thi hành Điều lệ Đảng (Khóa XIV)',
        issuedBy: 'Ban Chấp hành Trung ương Đảng khóa XIV',
        issuedDate: '2025',
        effectiveDate: '01/07/2025',
        summary: 'Quy định mới nhất về thi hành Điều lệ Đảng do BCH Trung ương khóa XIV ban hành, thay thế Quy định 24-QĐ/TW khóa XIII. Có hiệu lực từ 01/7/2025 với nhiều nội dung đáng chú ý cho đảng viên.',
        keyPoints: [
            'Thay thế Quy định 24-QĐ/TW ngày 30/7/2021 của BCH TW khóa XIII',
            'Cập nhật điều kiện kết nạp đảng viên theo Điều lệ khóa XIV',
            'Quy định mới về sinh hoạt chi bộ, quản lý đảng viên',
            'Quy trình chuyển đảng chính thức và điều kiện mới',
            'Có hiệu lực từ 01/7/2025'
        ],
        supersedes: 'Quy định 24-QĐ/TW ngày 30/7/2021 (Khóa XIII)',
        category: 'tổ chức',
        isNew: true
    },
    {
        id: 'qd-296',
        number: 'Quy định số 296-QĐ/TW',
        title: 'Về công tác kiểm tra, giám sát và kỷ luật của Đảng',
        issuedBy: 'Ban Chấp hành Trung ương Đảng khóa XIV',
        issuedDate: '2025',
        effectiveDate: '2025',
        summary: 'Quy định toàn diện mới nhất về công tác kiểm tra, giám sát, thi hành kỷ luật đảng do BCH TW khóa XIV ban hành, thay thế Quy định 22-QĐ/TW.',
        keyPoints: [
            'Thay thế Quy định 22-QĐ/TW ngày 28/7/2021 của BCH TW khóa XIII',
            'Quy trình kiểm tra chuyên đề cập nhật',
            'Quy trình giám sát chuyên đề cập nhật',
            'Quy trình giải quyết tố cáo, xử lý dấu hiệu vi phạm',
            'Thẩm quyền kỷ luật và quy trình thi hành kỷ luật'
        ],
        supersedes: 'Quy định 22-QĐ/TW ngày 28/7/2021 (Khóa XIII)',
        category: 'kiểm tra',
        isNew: true
    },
    {
        id: 'hd-38',
        number: 'Hướng dẫn số 38-HD/BTCTW',
        title: 'Hướng dẫn nghiệp vụ công tác đảng viên',
        issuedBy: 'Ban Tổ chức Trung ương',
        issuedDate: '2025',
        effectiveDate: '2025',
        summary: 'Hướng dẫn chi tiết nghiệp vụ công tác đảng viên, bao gồm quy trình kết nạp đảng viên mới, hồ sơ và biểu mẫu cần thiết theo Điều lệ khóa XIV.',
        keyPoints: [
            'Hướng dẫn quy trình kết nạp đảng viên mới',
            'Hồ sơ và biểu mẫu chuẩn theo Điều lệ khóa XIV',
            'Quy trình thẩm tra lý lịch người vào Đảng',
            'Quản lý đảng viên và chuyển sinh hoạt Đảng'
        ],
        category: 'đảng viên',
        isNew: true
    },
    {
        id: 'hd-30',
        number: 'Hướng dẫn số 30-HD/BTCTW',
        title: 'Hướng dẫn triển khai Quy định 86-QĐ/TW về nhiệm vụ đảng viên và quản lý đảng viên ở nước ngoài',
        issuedBy: 'Ban Tổ chức Trung ương',
        issuedDate: '23/04/2025',
        effectiveDate: '23/04/2025',
        summary: 'Hướng dẫn triển khai một số nội dung của Quy định 86-QĐ/TW liên quan đến nhiệm vụ của đảng viên và công tác quản lý đảng viên ở nước ngoài.',
        keyPoints: [
            'Nhiệm vụ của đảng viên khi công tác, học tập ở nước ngoài',
            'Quản lý đảng viên ở nước ngoài theo Quy định 86-QĐ/TW',
            'Quy trình chuyển sinh hoạt Đảng khi ra nước ngoài',
            'Quy trình tiếp nhận đảng viên trở về nước'
        ],
        category: 'đảng viên',
        isNew: true
    },
    {
        id: 'nq-68',
        number: 'Nghị quyết số 68-NQ/TW',
        title: 'Về phát triển kinh tế tư nhân trở thành động lực quan trọng',
        issuedBy: 'Bộ Chính trị',
        issuedDate: '2025',
        effectiveDate: '2025',
        summary: 'Nghị quyết của Bộ Chính trị nhấn mạnh vai trò đồng hành của Nhà nước với khu vực tư nhân, phát huy tối đa nguồn lực xã hội cho phát triển kinh tế.',
        keyPoints: [
            'Khuyến khích phát triển tập đoàn kinh tế tư nhân lớn',
            'Nhà nước đồng hành, hỗ trợ khu vực tư nhân',
            'Phát huy nguồn lực xã hội cho phát triển kinh tế',
            'Vai trò của Đảng trong định hướng kinh tế tư nhân'
        ],
        category: 'chung',
        isNew: true
    },

    // ═══════════════════════════════════════════
    //  KHÓA XIII (2021-2025) — VẪN CÒN HIỆU LỰC
    // ═══════════════════════════════════════════
    {
        id: 'qd-24',
        number: 'Quy định số 24-QĐ/TW',
        title: 'Về thi hành Điều lệ Đảng (Khóa XIII)',
        issuedBy: 'Ban Chấp hành Trung ương khóa XIII',
        issuedDate: '30/07/2021',
        effectiveDate: '30/07/2021',
        summary: 'Quy định thi hành Điều lệ Đảng khóa XIII. ĐÃ ĐƯỢC THAY THẾ bởi Quy định 294-QĐ/TW khóa XIV từ 01/7/2025. Tuy nhiên các nguyên tắc cơ bản vẫn được kế thừa.',
        keyPoints: [
            '⚠️ ĐÃ ĐƯỢC THAY THẾ bởi QĐ 294-QĐ/TW (Khóa XIV) từ 01/7/2025',
            'Sửa đổi trình độ học vấn: yêu cầu bằng THCS trở lên, bỏ "tương đương"',
            'Bổ sung điều kiện xem xét kết nạp lại đảng viên bị đưa ra khỏi Đảng',
            'Đảng viên giới thiệu phải cùng công tác/sinh hoạt ≥ 12 tháng',
            'Thay thế Quy định 29-QĐ/TW ngày 25/7/2016'
        ],
        supersedes: 'Quy định 29-QĐ/TW ngày 25/7/2016',
        category: 'tổ chức'
    },
    {
        id: 'qd-22',
        number: 'Quy định số 22-QĐ/TW',
        title: 'Về công tác kiểm tra, giám sát và kỷ luật của Đảng (Khóa XIII)',
        issuedBy: 'Ban Chấp hành Trung ương',
        issuedDate: '28/07/2021',
        effectiveDate: '28/07/2021',
        summary: 'Quy định về công tác kiểm tra, giám sát, thi hành kỷ luật đảng khóa XIII. ĐÃ ĐƯỢC THAY THẾ bởi Quy định 296-QĐ/TW khóa XIV.',
        keyPoints: [
            '⚠️ ĐÃ ĐƯỢC THAY THẾ bởi QĐ 296-QĐ/TW (Khóa XIV)',
            'Chi bộ kiểm tra đảng viên chấp hành Cương lĩnh, Điều lệ, nghị quyết',
            'Giám sát chuyên đề theo kế hoạch hàng năm',
            'Quy trình xem xét, thi hành kỷ luật đảng viên vi phạm',
            'Thẩm quyền kỷ luật: khiển trách, cảnh cáo, cách chức, khai trừ'
        ],
        category: 'kiểm tra'
    },
    {
        id: 'qd-37',
        number: 'Quy định số 37-QĐ/TW',
        title: 'Về những điều đảng viên không được làm',
        issuedBy: 'Ban Chấp hành Trung ương',
        issuedDate: '25/10/2021',
        effectiveDate: '25/10/2021',
        summary: 'Quy định 19 điều đảng viên không được làm, bao gồm: chống lại Đảng, chia rẽ, bè phái, tham nhũng, vi phạm đạo đức, lối sống...',
        keyPoints: [
            '19 điều cấm đối với đảng viên',
            'Cấm nói, viết, làm trái Cương lĩnh, Điều lệ, nghị quyết',
            'Cấm tham nhũng, lãng phí, tiêu cực',
            'Cấm vi phạm quy định về kê khai tài sản, thu nhập'
        ],
        category: 'đảng viên'
    },
    {
        id: 'qd-69',
        number: 'Quy định số 69-QĐ/TW',
        title: 'Về kỷ luật tổ chức đảng, đảng viên vi phạm',
        issuedBy: 'Bộ Chính trị',
        issuedDate: '06/07/2022',
        effectiveDate: '06/07/2022',
        summary: 'Thay thế Quy định 102-QĐ/TW, quy định cụ thể các hành vi vi phạm và hình thức kỷ luật tương ứng đối với tổ chức đảng và đảng viên.',
        keyPoints: [
            'Quy định chi tiết hành vi vi phạm và mức kỷ luật',
            'Phân loại vi phạm: về chính trị, tổ chức, đạo đức, tham nhũng',
            'Nguyên tắc xử lý: khách quan, công bằng, đúng người, đúng vi phạm',
            'Tình tiết tăng nặng và giảm nhẹ'
        ],
        supersedes: 'Quy định 102-QĐ/TW ngày 15/6/2017',
        category: 'kỷ luật',
        isNew: true
    },
    {
        id: 'hd-01',
        number: 'Hướng dẫn số 01-HD/TW',
        title: 'Hướng dẫn một số vấn đề cụ thể thi hành Điều lệ Đảng (Khóa XIII)',
        issuedBy: 'Ban Bí thư',
        issuedDate: '28/09/2021',
        effectiveDate: '28/09/2021',
        summary: 'Hướng dẫn chi tiết việc kết nạp đảng viên, chuyển đảng chính thức, quản lý đảng viên, sinh hoạt chi bộ và các vấn đề cụ thể khác theo Điều lệ khóa XIII.',
        keyPoints: [
            'Hướng dẫn hồ sơ kết nạp đảng viên (Mẫu 1-KNĐ đến 9-KNĐ)',
            'Hướng dẫn hồ sơ chuyển đảng chính thức (Mẫu 10-KNĐ đến 16-KNĐ)',
            'Quy trình thẩm tra lý lịch người vào Đảng',
            'Sinh hoạt chi bộ hàng tháng: nội dung, quy trình, đánh giá chất lượng',
            'Trường hợp đặc biệt: người trên 60 tuổi, người thay đổi nơi cư trú'
        ],
        category: 'tổ chức'
    },
    {
        id: 'hd-02',
        number: 'Hướng dẫn số 02-HD/UBKTTW',
        title: 'Hướng dẫn thực hiện Quy định 22-QĐ/TW',
        issuedBy: 'Ủy ban Kiểm tra Trung ương',
        issuedDate: '12/09/2021',
        effectiveDate: '12/09/2021',
        summary: 'Hướng dẫn chi tiết quy trình, thủ tục kiểm tra, giám sát và thi hành kỷ luật theo Quy định 22-QĐ/TW.',
        keyPoints: [
            'Hướng dẫn quy trình kiểm tra chuyên đề (11 bước)',
            'Hướng dẫn quy trình giám sát chuyên đề (11 bước)',
            'Quy trình giải quyết tố cáo, xử lý dấu hiệu vi phạm',
            'Biểu mẫu chuẩn cho từng bước trong quy trình'
        ],
        category: 'kiểm tra'
    },
    {
        id: 'qd-124',
        number: 'Quy định số 124-QĐ/TW',
        title: 'Về kiểm điểm và đánh giá, xếp loại chất lượng hàng năm',
        issuedBy: 'Bộ Chính trị',
        issuedDate: '02/02/2018',
        effectiveDate: '02/02/2018',
        summary: 'Quy định nội dung, trình tự, tiêu chí đánh giá, xếp loại chất lượng hàng năm đối với tổ chức đảng và đảng viên.',
        keyPoints: [
            'Tiêu chí: Hoàn thành xuất sắc, Hoàn thành tốt, Hoàn thành, Không hoàn thành',
            'Quy trình kiểm điểm cuối năm',
            'Trách nhiệm của cấp ủy trong đánh giá',
            'Liên hệ kết quả đánh giá với quy hoạch, đào tạo, khen thưởng'
        ],
        category: 'tổ chức'
    },
    {
        id: 'qd-86',
        number: 'Quy định số 86-QĐ/TW',
        title: 'Về nhiệm vụ của đảng viên và công tác quản lý đảng viên ở nước ngoài',
        issuedBy: 'Ban Bí thư',
        issuedDate: '2024',
        effectiveDate: '2024',
        summary: 'Quy định nhiệm vụ của đảng viên khi công tác, học tập ở nước ngoài và công tác quản lý đảng viên ở nước ngoài.',
        keyPoints: [
            'Nhiệm vụ cụ thể của đảng viên khi ra nước ngoài',
            'Trách nhiệm sinh hoạt Đảng khi ở nước ngoài',
            'Công tác quản lý, giám sát đảng viên ở nước ngoài',
            'Quy trình chuyển sinh hoạt Đảng khi ra nước ngoài'
        ],
        category: 'đảng viên',
        isNew: true
    }
];

export const REGULATION_CATEGORIES = [
    { key: 'all', label: 'Tất cả' },
    { key: 'kiểm tra', label: 'Kiểm tra - Giám sát' },
    { key: 'kỷ luật', label: 'Kỷ luật' },
    { key: 'tổ chức', label: 'Tổ chức Đảng' },
    { key: 'đảng viên', label: 'Đảng viên' },
    { key: 'đảng phí', label: 'Đảng phí' },
    { key: 'chung', label: 'Chung' }
];
