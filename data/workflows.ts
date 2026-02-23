export interface WorkflowStep {
    phase: 'CHUẨN BỊ' | 'TIẾN HÀNH' | 'KẾT THÚC';
    number: number;
    title: string;
    responsible: string;
    docType: string;
    description: string;
}

export interface Workflow {
    title: string;
    description: string;
    steps: WorkflowStep[];
}

export const WORKFLOWS: Record<string, Workflow> = {
    'KIỂM TRA': {
        title: 'QUY TRÌNH KIỂM TRA CHUYÊN ĐỀ',
        description: 'Quy trình kiểm tra đảng viên chấp hành chủ trương, quy định của Đảng',
        steps: [
            {
                phase: 'CHUẨN BỊ',
                number: 1,
                title: 'Kế hoạch kiểm tra chuyên đề',
                responsible: 'Chi bộ ban hành',
                docType: 'KT1',
                description: 'Chi bộ xây dựng và ban hành kế hoạch kiểm tra, xác định rõ: thành phần tổ kiểm tra; nhiệm vụ, quyền hạn; nội dung; mốc thời gian; phương pháp tiến hành.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 2,
                title: 'Kế hoạch chi tiết của Tổ kiểm tra',
                responsible: 'Tổ kiểm tra xây dựng',
                docType: 'KT2',
                description: 'Tổ kiểm tra xây dựng kế hoạch chi tiết, đề cương báo cáo, phân công nhiệm vụ cụ thể cho từng thành viên và lịch làm việc.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 3,
                title: 'Đề cương yêu cầu báo cáo tự kiểm tra',
                responsible: 'Tổ kiểm tra gửi đảng viên',
                docType: 'KT3',
                description: 'Tổ kiểm tra gửi đề cương gợi ý để đảng viên được kiểm tra chuẩn bị báo cáo tự kiểm tra theo đúng nội dung yêu cầu.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 4,
                title: 'Biên bản triển khai kế hoạch',
                responsible: 'Tổ kiểm tra và đảng viên',
                docType: 'KT4',
                description: 'Tổ kiểm tra triển khai kế hoạch, đề cương và thống nhất lịch làm việc với đảng viên được kiểm tra.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 5,
                title: 'Báo cáo tự kiểm tra của đảng viên',
                responsible: 'Đảng viên được kiểm tra',
                docType: 'KT5',
                description: 'Đảng viên được kiểm tra gửi báo cáo tự kiểm tra theo đề cương, kèm theo các hồ sơ, tài liệu có liên quan.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 6,
                title: 'Biên bản làm việc với đảng viên',
                responsible: 'Tổ kiểm tra',
                docType: 'KT6',
                description: 'Tổ kiểm tra làm việc trực tiếp với đảng viên được kiểm tra để làm rõ các nội dung cần thiết.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 7,
                title: 'Biên bản xác minh (nếu cần)',
                responsible: 'Tổ kiểm tra',
                docType: 'KT7',
                description: 'Tổ kiểm tra làm việc với các tổ chức, cá nhân có liên quan để thẩm tra, xác minh thông tin (nếu cần thiết).'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 8,
                title: 'Báo cáo kết quả kiểm tra',
                responsible: 'Tổ kiểm tra',
                docType: 'KT8',
                description: 'Tổ kiểm tra tổng hợp, phân tích và xây dựng báo cáo kết quả kiểm tra, nêu rõ ưu điểm, hạn chế và đề nghị.'
            },
            {
                phase: 'KẾT THÚC',
                number: 9,
                title: 'Trích biên bản hội nghị Chi bộ',
                responsible: 'Chi bộ tổ chức',
                docType: 'KT9',
                description: 'Chi bộ tổ chức hội nghị để nghe báo cáo, thảo luận và thống nhất kết luận về kết quả kiểm tra.'
            },
            {
                phase: 'KẾT THÚC',
                number: 10,
                title: 'Thông báo kết luận kiểm tra',
                responsible: 'Chi bộ ban hành',
                docType: 'KT10',
                description: 'Chi bộ ban hành thông báo kết luận kiểm tra, nêu rõ ưu điểm, hạn chế và yêu cầu đối với đảng viên.'
            },
            {
                phase: 'KẾT THÚC',
                number: 11,
                title: 'Biên bản triển khai thông báo kết luận',
                responsible: 'Đại diện Chi bộ',
                docType: 'KT11',
                description: 'Đại diện Chi bộ triển khai thông báo kết luận đến đảng viên được kiểm tra và yêu cầu thực hiện.'
            },
            {
                phase: 'KẾT THÚC',
                number: 12,
                title: 'Mục lục & chứng từ kết thúc hồ sơ',
                responsible: 'Đảng vụ Chi bộ',
                docType: 'KT12',
                description: 'Hoàn thiện hồ sơ, lập mục lục và lưu trữ theo quy định của Đảng.'
            }
        ]
    },
    'GIÁM SÁT': {
        title: 'QUY TRÌNH GIÁM SÁT CHUYÊN ĐỀ',
        description: 'Quy trình giám sát đảng viên thực hiện nhiệm vụ, chủ trương của Đảng',
        steps: [
            {
                phase: 'CHUẨN BỊ',
                number: 1,
                title: 'Kế hoạch giám sát chuyên đề',
                responsible: 'Chi bộ ban hành',
                docType: 'GS1',
                description: 'Chi bộ xây dựng và ban hành kế hoạch giám sát, xác định rõ: thành phần tổ giám sát; nhiệm vụ, quyền hạn; nội dung; mốc thời gian; phương pháp tiến hành.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 2,
                title: 'Kế hoạch chi tiết của Tổ giám sát',
                responsible: 'Tổ giám sát xây dựng',
                docType: 'GS2',
                description: 'Tổ giám sát xây dựng kế hoạch chi tiết, đề cương báo cáo, phân công nhiệm vụ cụ thể cho từng thành viên và lịch làm việc.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 3,
                title: 'Đề cương báo cáo tự giám sát',
                responsible: 'Tổ giám sát gửi đảng viên',
                docType: 'GS3',
                description: 'Tổ giám sát gửi đề cương gợi ý để đảng viên được giám sát chuẩn bị báo cáo tự giám sát theo đúng nội dung yêu cầu.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 4,
                title: 'Biên bản triển khai kế hoạch',
                responsible: 'Tổ giám sát và đảng viên',
                docType: 'GS4',
                description: 'Tổ giám sát triển khai kế hoạch, đề cương và thống nhất lịch làm việc với đảng viên được giám sát.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 5,
                title: 'Báo cáo tự giám sát của đảng viên',
                responsible: 'Đảng viên được giám sát',
                docType: 'GS5',
                description: 'Đảng viên được giám sát gửi báo cáo tự giám sát theo đề cương, kèm theo các hồ sơ, tài liệu có liên quan.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 6,
                title: 'Biên bản làm việc với đảng viên',
                responsible: 'Tổ giám sát',
                docType: 'GS6',
                description: 'Tổ giám sát làm việc trực tiếp với đảng viên được giám sát để làm rõ các nội dung cần thiết.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 7,
                title: 'Biên bản xác minh (nếu cần)',
                responsible: 'Tổ giám sát',
                docType: 'GS7',
                description: 'Tổ giám sát làm việc với các tổ chức, cá nhân có liên quan để thẩm tra, xác minh thông tin (nếu cần thiết).'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 8,
                title: 'Báo cáo kết quả giám sát',
                responsible: 'Tổ giám sát',
                docType: 'GS8',
                description: 'Tổ giám sát tổng hợp, phân tích và xây dựng báo cáo kết quả giám sát, nêu rõ ưu điểm, hạn chế và đề nghị.'
            },
            {
                phase: 'KẾT THÚC',
                number: 9,
                title: 'Trích biên bản hội nghị Chi bộ',
                responsible: 'Chi bộ tổ chức',
                docType: 'GS9',
                description: 'Chi bộ tổ chức hội nghị để nghe báo cáo, thảo luận và thống nhất kết luận về kết quả giám sát.'
            },
            {
                phase: 'KẾT THÚC',
                number: 10,
                title: 'Thông báo kết luận giám sát',
                responsible: 'Chi bộ ban hành',
                docType: 'GS10',
                description: 'Chi bộ ban hành thông báo kết luận giám sát, nêu rõ ưu điểm, hạn chế và yêu cầu đối với đảng viên.'
            },
            {
                phase: 'KẾT THÚC',
                number: 11,
                title: 'Biên bản triển khai thông báo kết luận',
                responsible: 'Đại diện Chi bộ',
                docType: 'GS11',
                description: 'Đại diện Chi bộ triển khai thông báo kết luận đến đảng viên được giám sát và yêu cầu thực hiện.'
            },
            {
                phase: 'KẾT THÚC',
                number: 12,
                title: 'Mục lục & chứng từ kết thúc hồ sơ',
                responsible: 'Đảng vụ Chi bộ',
                docType: 'GS12',
                description: 'Hoàn thiện hồ sơ, lập mục lục và lưu trữ theo quy định của Đảng.'
            }
        ]
    },
    'GIẢI QUYẾT TỐ CÁO': {
        title: 'QUY TRÌNH GIẢI QUYẾT TỐ CÁO',
        description: 'Quy trình xử lý tố cáo đối với đảng viên vi phạm',
        steps: [
            {
                phase: 'CHUẨN BỊ',
                number: 1,
                title: 'Biên bản làm việc với người tố cáo',
                responsible: 'Đại diện Chi bộ',
                docType: 'TC1',
                description: 'Đại diện Chi bộ làm việc với người tố cáo để nắm rõ nội dung, xác định danh tính đối tượng tố cáo và đảng viên bị tố cáo.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 2,
                title: 'Kế hoạch giải quyết tố cáo',
                responsible: 'Chi bộ ban hành',
                docType: 'TC2',
                description: 'Chi bộ xây dựng và ban hành kế hoạch giải quyết tố cáo, thành lập Tổ kiểm tra, xác định nội dung cần xác minh.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 3,
                title: 'Kế hoạch chi tiết của Tổ kiểm tra',
                responsible: 'Tổ kiểm tra xây dựng',
                docType: 'TC3',
                description: 'Tổ kiểm tra xây dựng kế hoạch chi tiết, phân công nhiệm vụ và lịch làm việc để xác minh nội dung tố cáo.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 4,
                title: 'Đề cương báo cáo giải trình',
                responsible: 'Tổ kiểm tra gửi đảng viên',
                docType: 'TC4',
                description: 'Tổ kiểm tra gửi đề cương yêu cầu đảng viên bị tố cáo chuẩn bị báo cáo giải trình về các nội dung tố cáo.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 5,
                title: 'Biên bản triển khai kế hoạch',
                responsible: 'Tổ kiểm tra và đảng viên',
                docType: 'TC5',
                description: 'Tổ kiểm tra triển khai kế hoạch và thống nhất lịch làm việc với đảng viên bị tố cáo.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 6,
                title: 'Báo cáo giải trình của đảng viên',
                responsible: 'Đảng viên bị tố cáo',
                docType: 'TC6',
                description: 'Đảng viên bị tố cáo gửi báo cáo giải trình về các nội dung tố cáo, kèm theo chứng cứ, tài liệu liên quan.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 7,
                title: 'Biên bản làm việc với đảng viên',
                responsible: 'Tổ kiểm tra',
                docType: 'TC7',
                description: 'Tổ kiểm tra làm việc trực tiếp với đảng viên bị tố cáo để làm rõ các nội dung cần thiết.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 8,
                title: 'Biên bản xác minh',
                responsible: 'Tổ kiểm tra',
                docType: 'TC8',
                description: 'Tổ kiểm tra làm việc với người tố cáo, tổ chức và cá nhân có liên quan để xác minh tính chính xác của nội dung tố cáo.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 9,
                title: 'Báo cáo kết quả của Tổ kiểm tra',
                responsible: 'Tổ kiểm tra',
                docType: 'TC9',
                description: 'Tổ kiểm tra tổng hợp, phân tích và báo cáo kết quả xác minh, kết luận nội dung tố cáo đúng, sai hay đúng một phần.'
            },
            {
                phase: 'KẾT THÚC',
                number: 10,
                title: 'Trích biên bản hội nghị Chi bộ',
                responsible: 'Chi bộ tổ chức',
                docType: 'TC10',
                description: 'Chi bộ tổ chức hội nghị để nghe báo cáo, thảo luận và thống nhất kết luận về kết quả giải quyết tố cáo.'
            },
            {
                phase: 'KẾT THÚC',
                number: 11,
                title: 'Thông báo kết luận giải quyết tố cáo',
                responsible: 'Chi bộ ban hành',
                docType: 'TC11',
                description: 'Chi bộ ban hành thông báo kết luận giải quyết tố cáo, nêu rõ kết quả xác minh và hình thức xử lý (nếu có).'
            },
            {
                phase: 'KẾT THÚC',
                number: 12,
                title: 'Biên bản triển khai thông báo kết luận',
                responsible: 'Đại diện Chi bộ',
                docType: 'TC12',
                description: 'Đại diện Chi bộ triển khai thông báo kết luận đến đảng viên bị tố cáo và người tố cáo.'
            },
            {
                phase: 'KẾT THÚC',
                number: 13,
                title: 'Phiếu biểu quyết đề nghị kỷ luật',
                responsible: 'Chi bộ (nếu cần kỷ luật)',
                docType: 'TC13',
                description: 'Nếu tố cáo đúng và cần kỷ luật, Chi bộ tổ chức biểu quyết đề nghị thi hành kỷ luật đảng viên.'
            },
            {
                phase: 'KẾT THÚC',
                number: 14,
                title: 'Biên bản kiểm phiếu đề nghị kỷ luật',
                responsible: 'Ban kiểm phiếu',
                docType: 'TC14',
                description: 'Ban kiểm phiếu kiểm đếm phiếu biểu quyết và lập biên bản công bố kết quả biểu quyết đề nghị kỷ luật.'
            },
            {
                phase: 'KẾT THÚC',
                number: 15,
                title: 'Phiếu biểu quyết thi hành kỷ luật',
                responsible: 'Chi bộ (nếu được cấp trên phê duyệt)',
                docType: 'TC15',
                description: 'Sau khi cấp trên phê duyệt, Chi bộ tổ chức biểu quyết thi hành kỷ luật đảng viên.'
            },
            {
                phase: 'KẾT THÚC',
                number: 16,
                title: 'Mục lục & chứng từ kết thúc hồ sơ',
                responsible: 'Đảng vụ Chi bộ',
                docType: 'TC16',
                description: 'Hoàn thiện hồ sơ, lập mục lục và lưu trữ theo quy định của Đảng.'
            }
        ]
    },
    'DẤU HIỆU VI PHẠM': {
        title: 'QUY TRÌNH KIỂM TRA DẤU HIỆU VI PHẠM',
        description: 'Quy trình xử lý khi phát hiện đảng viên có dấu hiệu vi phạm',
        steps: [
            {
                phase: 'CHUẨN BỊ',
                number: 1,
                title: 'Kế hoạch kiểm tra dấu hiệu vi phạm',
                responsible: 'Chi bộ ban hành',
                docType: 'DH1',
                description: 'Chi bộ xây dựng và ban hành kế hoạch kiểm tra khi phát hiện đảng viên có dấu hiệu vi phạm, thành lập Tổ kiểm tra.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 2,
                title: 'Kế hoạch chi tiết của Tổ kiểm tra',
                responsible: 'Tổ kiểm tra xây dựng',
                docType: 'DH2',
                description: 'Tổ kiểm tra xây dựng kế hoạch chi tiết, phân công nhiệm vụ và lịch làm việc để xác minh dấu hiệu vi phạm.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 3,
                title: 'Đề cương báo cáo',
                responsible: 'Tổ kiểm tra gửi đảng viên',
                docType: 'DH3',
                description: 'Tổ kiểm tra gửi đề cương yêu cầu đảng viên chuẩn bị báo cáo giải trình về dấu hiệu vi phạm.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 4,
                title: 'Biên bản triển khai kế hoạch',
                responsible: 'Tổ kiểm tra và đảng viên',
                docType: 'DH4',
                description: 'Tổ kiểm tra triển khai kế hoạch và thống nhất lịch làm việc với đảng viên có dấu hiệu vi phạm.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 5,
                title: 'Biên bản làm việc với tổ chức, cá nhân liên quan',
                responsible: 'Tổ kiểm tra',
                docType: 'DH5',
                description: 'Tổ kiểm tra làm việc với các tổ chức, cá nhân có liên quan để thu thập thông tin, chứng cứ về dấu hiệu vi phạm.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 6,
                title: 'Biên bản làm việc với đảng viên',
                responsible: 'Tổ kiểm tra',
                docType: 'DH6',
                description: 'Tổ kiểm tra làm việc trực tiếp với đảng viên có dấu hiệu vi phạm để làm rõ các nội dung cần thiết.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 7,
                title: 'Báo cáo kết quả kiểm tra',
                responsible: 'Tổ kiểm tra',
                docType: 'DH7',
                description: 'Tổ kiểm tra tổng hợp, phân tích và báo cáo kết quả kiểm tra, kết luận về tính chất, mức độ vi phạm.'
            },
            {
                phase: 'KẾT THÚC',
                number: 8,
                title: 'Trích biên bản hội nghị Chi bộ',
                responsible: 'Chi bộ tổ chức',
                docType: 'DH8',
                description: 'Chi bộ tổ chức hội nghị để nghe báo cáo, thảo luận và thống nhất kết luận về kết quả kiểm tra dấu hiệu vi phạm.'
            },
            {
                phase: 'KẾT THÚC',
                number: 9,
                title: 'Thông báo kết luận kiểm tra',
                responsible: 'Chi bộ ban hành',
                docType: 'DH9',
                description: 'Chi bộ ban hành thông báo kết luận kiểm tra, nêu rõ tính chất, mức độ vi phạm và hướng xử lý.'
            },
            {
                phase: 'KẾT THÚC',
                number: 10,
                title: 'Biên bản triển khai thông báo kết luận',
                responsible: 'Đại diện Chi bộ',
                docType: 'DH10',
                description: 'Đại diện Chi bộ triển khai thông báo kết luận đến đảng viên có dấu hiệu vi phạm.'
            },
            {
                phase: 'KẾT THÚC',
                number: 11,
                title: 'Biên bản triển khai quy trình kỷ luật',
                responsible: 'Chi bộ (nếu cần kỷ luật)',
                docType: 'DH11',
                description: 'Nếu vi phạm đủ điều kiện kỷ luật, Chi bộ triển khai quy trình thi hành kỷ luật theo quy định.'
            },
            {
                phase: 'KẾT THÚC',
                number: 12,
                title: 'Biên bản kiểm phiếu thi hành kỷ luật',
                responsible: 'Ban kiểm phiếu',
                docType: 'DH12',
                description: 'Ban kiểm phiếu kiểm đếm phiếu biểu quyết thi hành kỷ luật và lập biên bản công bố kết quả.'
            },
            {
                phase: 'KẾT THÚC',
                number: 13,
                title: 'Quyết định kỷ luật',
                responsible: 'Cấp có thẩm quyền',
                docType: 'DH13',
                description: 'Cấp có thẩm quyền ban hành quyết định kỷ luật đảng viên vi phạm theo hình thức đã được biểu quyết.'
            },
            {
                phase: 'KẾT THÚC',
                number: 14,
                title: 'Biên bản triển khai quyết định kỷ luật',
                responsible: 'Đại diện Chi bộ',
                docType: 'DH14',
                description: 'Đại diện Chi bộ công bố quyết định kỷ luật đến đảng viên bị kỷ luật và tập thể Chi bộ.'
            },
            {
                phase: 'KẾT THÚC',
                number: 15,
                title: 'Phiếu biểu quyết đề nghị kỷ luật',
                responsible: 'Chi bộ',
                docType: 'DH15',
                description: 'Chi bộ tổ chức biểu quyết đề nghị thi hành kỷ luật đảng viên vi phạm.'
            },
            {
                phase: 'KẾT THÚC',
                number: 16,
                title: 'Biên bản kiểm phiếu đề nghị kỷ luật',
                responsible: 'Ban kiểm phiếu',
                docType: 'DH16',
                description: 'Ban kiểm phiếu kiểm đếm phiếu biểu quyết đề nghị kỷ luật và lập biên bản công bố kết quả.'
            },
            {
                phase: 'KẾT THÚC',
                number: 17,
                title: 'Phiếu biểu quyết thi hành kỷ luật',
                responsible: 'Chi bộ',
                docType: 'DH17',
                description: 'Sau khi cấp trên phê duyệt, Chi bộ tổ chức biểu quyết thi hành kỷ luật đảng viên.'
            },
            {
                phase: 'KẾT THÚC',
                number: 18,
                title: 'Mục lục & chứng từ kết thúc hồ sơ',
                responsible: 'Đảng vụ Chi bộ',
                docType: 'DH18',
                description: 'Hoàn thiện hồ sơ, lập mục lục và lưu trữ theo quy định của Đảng.'
            }
        ]
    },
    'THI HÀNH KỶ LUẬT': {
        title: 'QUY TRÌNH THI HÀNH KỶ LUẬT ĐẢNG VIÊN',
        description: 'Quy trình thi hành kỷ luật đối với đảng viên vi phạm',
        steps: [
            {
                phase: 'CHUẨN BỊ',
                number: 1,
                title: 'Kế hoạch thi hành kỷ luật',
                responsible: 'Chi bộ ban hành',
                docType: 'KL1',
                description: 'Chi bộ xây dựng và ban hành kế hoạch thi hành kỷ luật, thành lập Tổ kiểm tra, xác định nội dung cần làm rõ.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 2,
                title: 'Kế hoạch chi tiết của Tổ kiểm tra',
                responsible: 'Tổ kiểm tra xây dựng',
                docType: 'KL2',
                description: 'Tổ kiểm tra xây dựng kế hoạch chi tiết, phân công nhiệm vụ và lịch làm việc để xem xét hành vi vi phạm.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 3,
                title: 'Đề cương báo cáo kiểm điểm',
                responsible: 'Tổ kiểm tra gửi đảng viên',
                docType: 'KL3',
                description: 'Tổ kiểm tra gửi đề cương yêu cầu đảng viên vi phạm chuẩn bị báo cáo kiểm điểm về hành vi vi phạm.'
            },
            {
                phase: 'CHUẨN BỊ',
                number: 4,
                title: 'Biên bản triển khai kế hoạch',
                responsible: 'Tổ kiểm tra và đảng viên',
                docType: 'KL4',
                description: 'Tổ kiểm tra triển khai kế hoạch và thống nhất lịch làm việc với đảng viên vi phạm.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 5,
                title: 'Báo cáo kiểm điểm của đảng viên',
                responsible: 'Đảng viên vi phạm',
                docType: 'KL5',
                description: 'Đảng viên vi phạm gửi báo cáo kiểm điểm, thừa nhận sai phạm, nguyên nhân và cam kết khắc phục.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 6,
                title: 'Biên bản làm việc với đảng viên',
                responsible: 'Tổ kiểm tra',
                docType: 'KL6',
                description: 'Tổ kiểm tra làm việc trực tiếp với đảng viên vi phạm để làm rõ tính chất, mức độ và hậu quả vi phạm.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 7,
                title: 'Biên bản thẩm tra, xác minh',
                responsible: 'Tổ kiểm tra',
                docType: 'KL7',
                description: 'Tổ kiểm tra thẩm tra, xác minh với các tổ chức, cá nhân có liên quan để làm rõ hành vi vi phạm.'
            },
            {
                phase: 'TIẾN HÀNH',
                number: 8,
                title: 'Báo cáo đề nghị thi hành kỷ luật',
                responsible: 'Tổ kiểm tra',
                docType: 'KL8',
                description: 'Tổ kiểm tra tổng hợp, phân tích và báo cáo đề nghị hình thức kỷ luật phù hợp với tính chất, mức độ vi phạm.'
            },
            {
                phase: 'KẾT THÚC',
                number: 9,
                title: 'Trích biên bản hội nghị Chi bộ',
                responsible: 'Chi bộ tổ chức',
                docType: 'KL9',
                description: 'Chi bộ tổ chức hội nghị để nghe báo cáo, đảng viên kiểm điểm, Chi bộ thảo luận và đề nghị hình thức kỷ luật.'
            },
            {
                phase: 'KẾT THÚC',
                number: 10,
                title: 'Phiếu biểu quyết thi hành kỷ luật',
                responsible: 'Chi bộ',
                docType: 'KL10',
                description: 'Chi bộ tổ chức biểu quyết thi hành kỷ luật đảng viên vi phạm theo hình thức đã thống nhất.'
            },
            {
                phase: 'KẾT THÚC',
                number: 11,
                title: 'Biên bản kiểm phiếu thi hành kỷ luật',
                responsible: 'Ban kiểm phiếu',
                docType: 'KL11',
                description: 'Ban kiểm phiếu kiểm đếm phiếu biểu quyết và lập biên bản công bố kết quả biểu quyết thi hành kỷ luật.'
            },
            {
                phase: 'KẾT THÚC',
                number: 12,
                title: 'Quyết định kỷ luật',
                responsible: 'Cấp có thẩm quyền',
                docType: 'KL12',
                description: 'Cấp có thẩm quyền ban hành quyết định kỷ luật đảng viên vi phạm theo hình thức đã được biểu quyết.'
            },
            {
                phase: 'KẾT THÚC',
                number: 13,
                title: 'Biên bản công bố quyết định kỷ luật',
                responsible: 'Đại diện Chi bộ',
                docType: 'KL13',
                description: 'Đại diện Chi bộ công bố quyết định kỷ luật đến đảng viên bị kỷ luật và tập thể Chi bộ.'
            },
            {
                phase: 'KẾT THÚC',
                number: 14,
                title: 'Phiếu biểu quyết đề nghị kỷ luật',
                responsible: 'Chi bộ',
                docType: 'KL14',
                description: 'Chi bộ tổ chức biểu quyết đề nghị thi hành kỷ luật để trình cấp có thẩm quyền xem xét, quyết định.'
            },
            {
                phase: 'KẾT THÚC',
                number: 15,
                title: 'Biên bản kiểm phiếu đề nghị kỷ luật',
                responsible: 'Ban kiểm phiếu',
                docType: 'KL15',
                description: 'Ban kiểm phiếu kiểm đếm phiếu biểu quyết đề nghị kỷ luật và lập biên bản công bố kết quả.'
            },
            {
                phase: 'KẾT THÚC',
                number: 16,
                title: 'Mục lục & chứng từ kết thúc hồ sơ',
                responsible: 'Đảng vụ Chi bộ',
                docType: 'KL16',
                description: 'Hoàn thiện hồ sơ, lập mục lục và lưu trữ theo quy định của Đảng.'
            }
        ]
    }
};
