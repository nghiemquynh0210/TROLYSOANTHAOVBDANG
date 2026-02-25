/**
 * Dữ liệu cấu trúc Phiếu đánh giá chất lượng sinh hoạt chi bộ
 * Theo mẫu chuẩn quy định
 */

export interface ScoreOption {
    label: string;
    value: number;
}

export interface SubCriterion {
    id: string;
    label: string;
    maxScore: number;
    /** 'radio' = chọn 1 mức, 'toggle' = có/không (0 hoặc maxScore) */
    type: 'radio' | 'toggle';
    options?: ScoreOption[];
    note?: string;
}

export interface Criterion {
    id: number;
    title: string;
    maxScore: number;
    subCriteria: SubCriterion[];
    note?: string;
}

export const QUALITY_CRITERIA: Criterion[] = [
    {
        id: 1,
        title: 'Chấp hành thời gian, thời lượng sinh hoạt chi bộ',
        maxScore: 5,
        note: 'Chi bộ dưới 30 đảng viên ít nhất 90 phút; chi bộ trên 30 đảng viên ít nhất 120 phút.',
        subCriteria: [
            {
                id: 'c1_time',
                label: 'Thời gian sinh hoạt chi bộ (chi bộ dưới 30 đảng viên: ít nhất 90 phút; chi bộ từ 30 đảng viên trở lên: ít nhất 120 phút)',
                maxScore: 5,
                type: 'radio',
                note: 'Căn cứ thời gian sinh hoạt chi bộ, chấm điểm một trong các mức (tối đa 5 điểm và thấp nhất là 1 điểm)',
                options: [
                    { label: 'Đạt ít nhất 90 phút (hoặc 120 phút nếu từ 30 đảng viên trở lên)', value: 5 },
                    { label: 'Thời gian ít hơn quy định không quá 15 phút', value: 4 },
                    { label: 'Thời gian ít hơn quy định từ 15 phút đến 30 phút', value: 3 },
                    { label: 'Thời gian chỉ bằng 1/2 so với quy định', value: 2 },
                    { label: 'Thời gian dưới 1/2 so với quy định', value: 1 },
                ]
            }
        ]
    },
    {
        id: 2,
        title: 'Tỉ lệ đảng viên dự sinh hoạt chi bộ',
        maxScore: 5,
        note: 'Trừ trường hợp được miễn công tác, sinh hoạt đảng theo quy định và đảng viên trong lực lượng vũ trang làm nhiệm vụ đặc biệt',
        subCriteria: [
            {
                id: 'c2_rate',
                label: 'Tỉ lệ đảng viên dự họp (trừ trường hợp được miễn công tác, sinh hoạt đảng theo quy định và đảng viên trong lực lượng vũ trang làm nhiệm vụ đặc biệt)',
                maxScore: 4,
                type: 'radio',
                note: 'Căn cứ tỷ lệ đảng viên sinh hoạt chi bộ, chấm điểm một trong các mức (tối đa 4 điểm và thấp nhất là 1 điểm)',
                options: [
                    { label: 'Đạt từ 90% đảng viên dự họp trở lên', value: 4 },
                    { label: 'Đạt từ 75% đến dưới 90% đảng viên dự họp', value: 3 },
                    { label: 'Đạt từ 65% đến dưới 75% đảng viên dự họp', value: 2 },
                    { label: 'Đạt dưới 65% đảng viên dự họp hoặc có đảng viên vắng không lý do', value: 1 },
                ]
            },
            {
                id: 'c2_bonus',
                label: 'Không có đảng viên vắng mặt có lý do quá 3 lần liên tiếp trong năm (Điểm cộng)',
                maxScore: 1,
                type: 'toggle',
                note: 'Điểm cộng: +1 điểm nếu chi bộ không có đảng viên vắng mặt có lý do quá 3 lần liên tiếp trong năm'
            }
        ]
    },
    {
        id: 3,
        title: 'Công tác chuẩn bị sinh hoạt chi bộ',
        maxScore: 10,
        subCriteria: [
            {
                id: 'c3_content',
                label: 'Chuẩn bị nội dung sinh hoạt: đúng, đủ nội dung, có trọng tâm, trọng điểm, gắn với tình hình thực tế của chi bộ và địa phương, cơ quan, đơn vị',
                maxScore: 3,
                type: 'toggle'
            },
            {
                id: 'c3_direction',
                label: 'Có định hướng thảo luận và xây dựng dự thảo kết luận (hoặc nghị quyết) kỳ sinh hoạt',
                maxScore: 2,
                type: 'toggle'
            },
            {
                id: 'c3_meeting',
                label: 'Họp chi ủy (hoặc bí thư, phó bí thư hội ý) trước kỳ sinh hoạt chi bộ; có ghi biên bản họp chi ủy',
                maxScore: 2,
                type: 'toggle',
                note: 'Chi bộ chỉ có mỗi bí thư thì không phải đánh giá nội dung này, được tính điểm tối đa'
            },
            {
                id: 'c3_notify',
                label: 'Thông báo thời gian, địa điểm, nội dung sinh hoạt đến từng đảng viên trong chi bộ và cấp ủy viên cấp trên được phân công theo dõi',
                maxScore: 1,
                type: 'toggle'
            },
            {
                id: 'c3_upload',
                label: 'Đăng tải tài liệu sinh hoạt trên ứng dụng Sổ tay đảng viên điện tử trước khi sinh hoạt ít nhất 01 ngày',
                maxScore: 2,
                type: 'toggle'
            }
        ]
    },
    {
        id: 4,
        title: 'Tổ chức sinh hoạt chi bộ',
        maxScore: 30,
        subCriteria: [
            {
                id: 'c4_process',
                label: 'Thực hiện đầy đủ các bước quy trình sinh hoạt chi bộ (theo điểm 2.2, Mục II của Hướng dẫn số 42-HD/BTCTW ngày 28/10/2025 của Ban Tổ chức Trung ương về thực hiện Chỉ thị số 50-CT/TW ngày 23/7/2025 của Ban Bí thư về tiếp tục đổi mới và nâng cao chất lượng sinh hoạt chi bộ trong giai đoạn mới)',
                maxScore: 5,
                type: 'toggle'
            },
            {
                id: 'c4_regular',
                label: 'Sinh hoạt thường kỳ thực hiện nội dung tại điểm 3.1, Mục II của Hướng dẫn số 42-HD/BTCTW ngày 28/10/2025 của Ban Tổ chức Trung ương; trong đó tập trung về công tác chính trị tư tưởng, về thực hiện nhiệm vụ chính trị, xây dựng nhiệm vụ của tháng tiếp theo, có giải pháp khả thi',
                maxScore: 10,
                type: 'toggle',
                note: 'Trường hợp sinh hoạt thường kỳ kết hợp cùng sinh hoạt chuyên đề thì điểm tối đa là 10 điểm'
            },
            {
                id: 'c4_thematic',
                label: 'Sinh hoạt chuyên đề thực hiện nội dung tại điểm 3.2, Mục II của Hướng dẫn số 42-HD/BTCTW ngày 28/10/2025 của Ban Tổ chức Trung ương; việc phân công chuẩn bị chuyên đề, nội dung chuyên đề theo đúng quy định tại Giải pháp 2, phần II. Nhiệm vụ và giải pháp trọng tâm của Kế hoạch số 08-KH/ĐU ngày 19/9/2025 của Đảng ủy phường An Phú về thực hiện Chỉ thị số 50-CT/TW',
                maxScore: 5,
                type: 'toggle',
                note: 'Trong quý, tháng nào tổ chức sinh hoạt chuyên đề thì mới tính điểm'
            },
            {
                id: 'c4_praise',
                label: 'Có biểu dương đảng viên tiêu biểu trong tháng; nhắc nhở, phê bình đảng viên chưa hoàn thành nhiệm vụ được giao, đảng viên không thực hiện đúng cam kết tu dưỡng, rèn luyện, phấn đấu hàng năm hoặc có khuyết điểm trong thực hiện chủ trương, nghị quyết, chỉ thị, quy định của Đảng và cấp ủy cấp trên nhưng chưa đến mức phải xử lý kỷ luật (nếu có)',
                maxScore: 2,
                type: 'toggle'
            },
            {
                id: 'c4_discuss',
                label: 'Có nhiều đảng viên tham gia phát biểu ý kiến (cấp ủy có thẩm quyền căn cứ số lượng đảng viên, loại hình chi bộ để quy định số lượng đảng viên tham gia ý kiến đảm bảo sinh hoạt chi bộ có chất lượng)',
                maxScore: 5,
                type: 'radio',
                note: 'Cấp ủy có thẩm quyền căn cứ số lượng đảng viên, loại hình chi bộ để quy định số lượng đảng viên tham gia ý kiến đảm bảo sinh hoạt chi bộ có chất lượng',
                options: [
                    { label: 'Trên 50% số đảng viên dự sinh hoạt phát biểu ý kiến', value: 5 },
                    { label: 'Từ 40% đến dưới 50% số đảng viên dự sinh hoạt phát biểu ý kiến', value: 4 },
                    { label: 'Từ 30% đến dưới 40% số đảng viên dự sinh hoạt phát biểu ý kiến', value: 3 },
                    { label: 'Dưới 30% số đảng viên dự sinh hoạt phát biểu ý kiến', value: 2 },
                ]
            },
            {
                id: 'c4_minutes',
                label: 'Sổ biên bản sinh hoạt chi bộ ghi chép đầy đủ diễn biến buổi sinh hoạt chi bộ',
                maxScore: 1,
                type: 'toggle'
            },
            {
                id: 'c4_ideology',
                label: 'Dành thời gian ít nhất 15 phút - 30 phút để đánh giá tình hình tư tưởng đảng viên; tự phê bình và phê bình; đấu tranh chống suy thoái về tư tưởng chính trị, đạo đức, lối sống, những biểu hiện "tự diễn biến", "tự chuyển hóa" trong nội bộ',
                maxScore: 1,
                type: 'toggle'
            },
            {
                id: 'c4_digital',
                label: 'Tài liệu sinh hoạt chi bộ được đăng tải trên ứng dụng Sổ tay đảng viên điện tử',
                maxScore: 1,
                type: 'toggle'
            }
        ]
    },
    {
        id: 5,
        title: 'Công tác điều hành của Bí thư (hoặc Phó Bí thư) chi bộ',
        maxScore: 10,
        subCriteria: [
            {
                id: 'c5_flexible',
                label: 'Điều hành linh hoạt, hiệu quả',
                maxScore: 2,
                type: 'toggle'
            },
            {
                id: 'c5_direction',
                label: 'Có định hướng thảo luận (bao gồm cả những vấn đề mới, phát sinh và đảng viên quan tâm)',
                maxScore: 4,
                type: 'toggle'
            },
            {
                id: 'c5_democratic',
                label: 'Kỹ năng gợi mở, tạo không khí dân chủ trong sinh hoạt; khuyến khích đảng viên tham gia phát biểu ý kiến',
                maxScore: 3,
                type: 'toggle'
            },
            {
                id: 'c5_conclude',
                label: 'Khả năng tổng hợp, khái quát các vấn đề thảo luận thành kết luận hoặc nghị quyết của chi bộ',
                maxScore: 1,
                type: 'toggle'
            }
        ]
    },
    {
        id: 6,
        title: 'Thực hiện nguyên tắc tổ chức, sinh hoạt đảng',
        maxScore: 5,
        subCriteria: [
            {
                id: 'c6_democratic',
                label: 'Thực hiện đúng nguyên tắc tập trung dân chủ trong sinh hoạt chi bộ',
                maxScore: 1,
                type: 'toggle'
            },
            {
                id: 'c6_criticism',
                label: 'Chi ủy, đảng viên nghiêm túc, thực sự cầu thị khi tự phê bình và phê bình; không có biểu hiện nể nang, né tránh, ngại va chạm',
                maxScore: 2,
                type: 'toggle'
            },
            {
                id: 'c6_quality',
                label: 'Sinh hoạt chi bộ bảo đảm tính lãnh đạo, tính giáo dục, tính chiến đấu',
                maxScore: 1,
                type: 'toggle'
            },
            {
                id: 'c6_feedback',
                label: 'Bí thư chi bộ cung cấp thông tin, định hướng cho đảng viên; ghi nhận và giải quyết tâm tư, nguyện vọng chính đáng của đảng viên',
                maxScore: 1,
                type: 'toggle'
            }
        ]
    },
    {
        id: 7,
        title: 'Kết quả lãnh đạo thực hiện kết luận hoặc nghị quyết của chi bộ',
        maxScore: 30,
        note: 'Căn cứ kết quả thực hiện kết luận hoặc nghị quyết chi bộ tháng trước; đánh giá việc thực hiện nhiệm vụ chính trị, xây dựng Đảng, các chỉ tiêu nghị quyết đề ra',
        subCriteria: [
            {
                id: 'c7_result',
                label: 'Kết quả thực hiện kết luận hoặc nghị quyết chi bộ tháng trước; đánh giá việc thực hiện nhiệm vụ chính trị, xây dựng Đảng, các chỉ tiêu nghị quyết đề ra',
                maxScore: 30,
                type: 'radio',
                note: 'Đánh giá tổng thể kết quả lãnh đạo thực hiện kết luận/nghị quyết chi bộ',
                options: [
                    { label: 'Hoàn thành xuất sắc nhiệm vụ (từ 90% đến 100% chỉ tiêu đề ra)', value: 30 },
                    { label: 'Hoàn thành tốt nhiệm vụ (từ 80% đến dưới 90% chỉ tiêu đề ra)', value: 27 },
                    { label: 'Hoàn thành nhiệm vụ (từ 70% đến dưới 80% chỉ tiêu đề ra)', value: 24 },
                    { label: 'Hoàn thành cơ bản nhiệm vụ (từ 60% đến dưới 70% chỉ tiêu đề ra)', value: 20 },
                    { label: 'Chưa hoàn thành nhiệm vụ (từ 50% đến dưới 60% chỉ tiêu đề ra)', value: 15 },
                    { label: 'Không hoàn thành nhiệm vụ (dưới 50% chỉ tiêu đề ra)', value: 10 },
                ]
            }
        ]
    },
    {
        id: 8,
        title: 'Kết thúc sinh hoạt chi bộ',
        maxScore: 5,
        subCriteria: [
            {
                id: 'c8_conclude',
                label: 'Chủ trì kết luận nội dung sinh hoạt; thông qua kết luận hoặc nghị quyết chi bộ',
                maxScore: 2,
                type: 'toggle'
            },
            {
                id: 'c8_approve',
                label: 'Thông qua nội dung biên bản sinh hoạt chi bộ; kết luận hoặc nghị quyết kỳ sinh hoạt; phân công nhiệm vụ cụ thể cho đảng viên',
                maxScore: 2,
                type: 'toggle'
            },
            {
                id: 'c8_upload',
                label: 'Đăng tải tài liệu sinh hoạt (sau khi hoàn thiện) trên ứng dụng Sổ tay đảng viên điện tử trong thời gian 02 ngày sau khi sinh hoạt',
                maxScore: 1,
                type: 'toggle'
            }
        ]
    }
];

/** Xếp loại chất lượng */
export function getClassification(total: number): { label: string; color: string } {
    if (total >= 90) return { label: 'Tốt', color: 'text-green-600' };
    if (total >= 70) return { label: 'Khá', color: 'text-blue-600' };
    if (total >= 50) return { label: 'Trung bình', color: 'text-amber-600' };
    return { label: 'Kém', color: 'text-red-600' };
}

/** Tổng điểm tối đa thực tế */
export const MAX_TOTAL = QUALITY_CRITERIA.reduce((sum, c) => sum + c.maxScore, 0);
