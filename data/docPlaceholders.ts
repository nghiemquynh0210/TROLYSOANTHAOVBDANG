import { DocType } from '../types';

/**
 * Gợi ý nhập liệu riêng cho từng loại văn bản.
 * Hiển thị trong placeholder của textarea soạn thảo.
 */
export const DOC_PLACEHOLDERS: Partial<Record<DocType, string>> = {
    // ═══════════════════════════════════════════════════
    // CẤP 1 — CHI ỦY
    // ═══════════════════════════════════════════════════
    [DocType.COMMITTEE_PROGRAM]: `Ví dụ: Chương trình sinh hoạt Chi ủy tháng 3/2026.\n- Đánh giá công tác tháng 2: hoàn thành giám sát đảng viên A, thu đảng phí đạt 100%.\n- Nội dung tháng 3: phân công nhiệm vụ cho chi ủy viên, chuẩn bị nội dung sinh hoạt Chi bộ, triển khai Nghị quyết cấp trên.`,

    [DocType.COMMITTEE_CONCLUSION]: `Ví dụ: Kết luận của Chi ủy về đề nghị kết nạp đảng viên mới.\n- Chi ủy đã họp ngày 15/3/2026, nhất trí đề nghị kết nạp quần chúng Nguyễn Văn A.\n- Hồ sơ đầy đủ, lý lịch đã thẩm tra, 2 đảng viên giới thiệu xác nhận.`,

    [DocType.SUBMISSION]: `Ví dụ: Tờ trình đề nghị Đảng ủy phường xem xét kết nạp quần chúng Trần Thị B.\n- Quần chúng sinh năm 1995, là cán bộ khu phố, có quá trình phấn đấu từ 2023.\n- Chi bộ đã biểu quyết đồng ý 100%.`,

    // ═══════════════════════════════════════════════════
    // CẤP 2 — CHI BỘ
    // ═══════════════════════════════════════════════════
    [DocType.MONTHLY_RESOLUTION]: `Ví dụ: Nghị quyết tháng 3/2026.\n- Đánh giá: Tháng 2 hoàn thành 5/6 chỉ tiêu, thu đảng phí đạt 98%.\n- Nhiệm vụ trọng tâm tháng 3: tổ chức sinh hoạt chuyên đề "Học tập tư tưởng HCM", vận động 2 quần chúng ưu tú, phối hợp an ninh trật tự.`,

    [DocType.YEARLY_RESOLUTION]: `Ví dụ: Nghị quyết năm 2026.\n- Phương hướng: Kết nạp 2-3 đảng viên mới, chuyển chính thức 1 đảng viên dự bị.\n- Nhiệm vụ: Nâng cao chất lượng sinh hoạt Chi bộ, triển khai giám sát chuyên đề, xây dựng khu phố văn minh.\n- Chỉ tiêu: 100% đảng viên hoàn thành nhiệm vụ, sinh hoạt đầy đủ.`,

    [DocType.CONGRESS_RESOLUTION]: `Ví dụ: Nghị quyết Đại hội Chi bộ nhiệm kỳ 2025-2030.\n- Tổng kết nhiệm kỳ 2020-2025: kết nạp 8 đảng viên, Chi bộ đạt Hoàn thành xuất sắc 3/5 năm.\n- Phương hướng 2025-2030: phấn đấu Chi bộ trong sạch vững mạnh, mỗi năm kết nạp 2 đảng viên.\n- Bầu Chi ủy khóa mới: 3 đồng chí.`,

    [DocType.MEETING_NOTICE]: `Ví dụ: Thông báo kết luận họp Chi bộ tháng 3/2026.\n- Thời gian họp: 19h ngày 05/3/2026.\n- Nội dung: đánh giá công tác tháng 2, bàn kế hoạch tháng 3, thông qua kết nạp đảng viên.\n- Kết luận: nhất trí triển khai 4 nhiệm vụ trọng tâm...`,

    [DocType.MEETING_MINUTES]: `Ví dụ: Biên bản họp Chi bộ tháng 3/2026.\n- Thời gian: 19h00 ngày 05/3/2026, tại hội trường khu phố.\n- Có mặt: 12/15 đảng viên, vắng 3 (đ/c A - ốm, đ/c B - đi công tác, đ/c C - có lý do).\n- Chủ trì: đ/c Nguyễn Văn X - Bí thư. Thư ký: đ/c Lê Thị Y.`,

    [DocType.BRANCH_PROGRAM]: `Ví dụ: Chương trình sinh hoạt Chi bộ tháng 3/2026.\n1. Khai mạc, tuyên bố lý do\n2. Thông tin thời sự, Nghị quyết cấp trên\n3. Đánh giá công tác tháng 2\n4. Phương hướng tháng 3: triển khai giám sát, vận động quần chúng\n5. Ý kiến đảng viên, biểu quyết, bế mạc.`,

    [DocType.MONTHLY_PLAN]: `Ví dụ: Kế hoạch công tác tháng 3/2026.\n- Công tác tổ chức: sinh hoạt Chi bộ, sinh hoạt chuyên đề.\n- Công tác kiểm tra: giám sát đ/c Trần Văn C về chấp hành Điều lệ Đảng.\n- Công tác dân vận: phối hợp khu phố tổ chức họp tổ dân.\n- Thu đảng phí trước ngày 20.`,

    [DocType.REPORT]: `Ví dụ: Báo cáo sơ kết 6 tháng đầu năm 2026.\n- Kết quả: tổ chức 6 kỳ sinh hoạt, 1 chuyên đề, kết nạp 1 đảng viên, giám sát 2 đảng viên.\n- Hạn chế: 3 đảng viên sinh hoạt chưa đều, chất lượng sinh hoạt chuyên đề chưa cao.\n- Kiến nghị: tăng cường giáo dục chính trị tư tưởng.`,

    [DocType.YEAR_END_CELL_REVIEW]: `Ví dụ: Kiểm điểm Chi bộ cuối năm 2026.\n- Về chính trị tư tưởng: 100% đảng viên chấp hành tốt chủ trương, đường lối.\n- Về tổ chức: sinh hoạt đều, đúng quy định, nội dung phong phú.\n- Hạn chế: chưa phát triển đảng viên trẻ, công tác kiểm tra chưa thường xuyên.\n- Tự xếp loại: Hoàn thành tốt nhiệm vụ.`,

    [DocType.MONTHLY_MEETING_ASSESSMENT]: `Ví dụ: Đánh giá chất lượng sinh hoạt Chi bộ tháng 3/2026.\n- Nội dung sinh hoạt: đánh giá công tác, triển khai Nghị quyết, thảo luận chuyên đề.\n- Tham dự: 12/15 đảng viên (80%).\n- Ý kiến phát biểu: 8 đảng viên (53%).\n- Đánh giá chung: Đạt yêu cầu / Chưa đạt yêu cầu.`,

    // ═══════════════════════════════════════════════════
    // CẤP 3 — CHUYÊN ĐỀ
    // ═══════════════════════════════════════════════════
    [DocType.THEMATIC_RESOLUTION]: `Ví dụ: Nghị quyết chuyên đề "Nâng cao chất lượng sinh hoạt Chi bộ gắn với học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh".\n- Mục tiêu: 100% đảng viên đăng ký nội dung phấn đấu, có sản phẩm cụ thể.\n- Giải pháp: đổi mới hình thức sinh hoạt, mời báo cáo viên...`,

    [DocType.THEMATIC_PLAN]: `Ví dụ: Kế hoạch thực hiện Nghị quyết chuyên đề "Xây dựng khu phố văn minh".\n- Thời gian: từ tháng 3 đến tháng 12/2026.\n- Phân công: đ/c A phụ trách tuyên truyền, đ/c B phụ trách vệ sinh môi trường.\n- Kinh phí: từ nguồn xã hội hóa.`,

    [DocType.THEMATIC_REPORT]: `Ví dụ: Báo cáo kết quả thực hiện chuyên đề "Phòng chống tham nhũng, tiêu cực" năm 2026.\n- Kết quả: 15/15 đảng viên cam kết, 2 buổi sinh hoạt chuyên đề, không phát hiện vi phạm.\n- Bài học: cần duy trì thường xuyên hơn.`,

    // ═══════════════════════════════════════════════════
    // KẾT NẠP ĐẢNG (Mẫu 1-9 KNĐ)
    // ═══════════════════════════════════════════════════
    [DocType.KN_MAU_1]: `Ví dụ: Đơn xin vào Đảng của quần chúng Nguyễn Thị Mai.\n- Sinh năm 1998, dân tộc Kinh, tôn giáo: Không.\n- Nghề nghiệp: Giáo viên tiểu học, trường TH Nguyễn Du.\n- Nơi ở: 123 Lê Lợi, Phường 1, Quận 3.\n- Nguyện vọng: Được đứng trong hàng ngũ Đảng.`,

    [DocType.KN_MAU_2]: `Ví dụ: Lý lịch người vào Đảng của quần chúng Trần Văn Bình.\n- Họ tên: Trần Văn Bình, sinh 15/06/1995, tại Bệnh viện Từ Dũ, TP.HCM.\n- Quê quán: xã An Phú, huyện Củ Chi. Nơi ở: 45 Nguyễn Trãi, P.2, Q.5.\n- Trình độ: Đại học Luật, Cử nhân. Lý luận chính trị: Sơ cấp.\n- Gia đình: Bố - Trần Văn A, mẹ - Lê Thị B (đều không vi phạm pháp luật).`,

    [DocType.KN_MAU_3]: `Ví dụ: Giấy giới thiệu người vào Đảng.\n- Tôi là: Lê Minh Tuấn, đảng viên chính thức, được phân công giúp đỡ quần chúng Nguyễn Thị Mai từ tháng 6/2025.\n- Nhận xét: Có lập trường chính trị vững vàng, đạo đức tốt, tích cực công tác.\n- Đề nghị Chi bộ xem xét kết nạp.`,

    [DocType.KN_MAU_4]: `Ví dụ: Nhận xét của Công đoàn cơ sở Trường TH Nguyễn Du về quần chúng Nguyễn Thị Mai.\n- Phẩm chất chính trị: Chấp hành tốt chủ trương, đường lối.\n- Đạo đức: Sống giản dị, trung thực, được đồng nghiệp tín nhiệm.\n- Vai trò đoàn thể: Tổ phó Công đoàn, hoàn thành tốt nhiệm vụ.`,

    [DocType.KN_MAU_5]: `Ví dụ: Ý kiến của Chi ủy nơi cư trú (Chi bộ KP5, P.1, Q.3).\n- Quần chúng Nguyễn Thị Mai cư trú tại địa phương từ năm 2020.\n- Bản thân chấp hành tốt pháp luật, tham gia hoạt động khu phố.\n- Gia đình không vi phạm, có uy tín tại địa phương.`,

    [DocType.KN_MAU_6]: `Ví dụ: Nghị quyết Chi bộ kết nạp quần chúng Nguyễn Thị Mai.\n- Hội nghị ngày 05/3/2026, có mặt 12/15 đảng viên.\n- Kết quả biểu quyết: 12/12 tán thành (100%).\n- Chi bộ đề nghị Đảng ủy phường xem xét kết nạp.`,

    [DocType.KN_MAU_7]: `Ví dụ: Báo cáo Chi ủy đề nghị kết nạp quần chúng Nguyễn Thị Mai.\n- Tóm tắt: nữ, sinh 1998, giáo viên, quá trình phấn đấu từ 2023, được 2 đảng viên giới thiệu.\n- Hồ sơ gồm 6 loại đầy đủ. Chi bộ biểu quyết 100% đồng ý.\n- Kính đề nghị Đảng ủy xem xét.`,

    [DocType.KN_MAU_8]: `Ví dụ: Nghị quyết Đảng ủy phường về việc kết nạp quần chúng Nguyễn Thị Mai.\n- Ban Chấp hành Đảng bộ phường họp ngày 20/3/2026.\n- Kết quả: 9/9 ủy viên tán thành (100%).\n- Đảng ủy đồng ý kết nạp và báo cáo cấp trên.`,

    [DocType.KN_MAU_9]: `Ví dụ: Quyết định kết nạp đảng viên Nguyễn Thị Mai.\n- Căn cứ Điều lệ Đảng, Nghị quyết Chi bộ số..., Nghị quyết Đảng ủy số...\n- Kết nạp: Nguyễn Thị Mai, sinh 1998, giáo viên.\n- Người giới thiệu: đ/c Lê Minh Tuấn và đ/c Phạm Văn Hùng.`,

    // ═══════════════════════════════════════════════════
    // CHUYỂN ĐẢNG CHÍNH THỨC (Mẫu 10-16 KNĐ)
    // ═══════════════════════════════════════════════════
    [DocType.CT_MAU_10]: `Ví dụ: Bản tự kiểm điểm của đảng viên dự bị Nguyễn Thị Mai (12 tháng dự bị).\n- Ưu điểm: chấp hành tốt Điều lệ, sinh hoạt đầy đủ, hoàn thành nhiệm vụ được giao.\n- Khuyết điểm: chưa mạnh dạn phát biểu ý kiến trong sinh hoạt.\n- Biện pháp: tích cực nghiên cứu, phát biểu trong các kỳ sinh hoạt tới.`,

    [DocType.CT_MAU_11]: `Ví dụ: Nhận xét của đảng viên giúp đỡ (đ/c Lê Minh Tuấn) về đảng viên dự bị Nguyễn Thị Mai.\n- Tư tưởng chính trị: vững vàng, tin tưởng sự lãnh đạo của Đảng.\n- Đạo đức: giản dị, trung thực, được quần chúng tín nhiệm.\n- Nhiệm vụ: hoàn thành tốt công tác giảng dạy và Đoàn thể.\n- Đề nghị: công nhận đảng viên chính thức.`,

    [DocType.CT_MAU_12]: `Ví dụ: Nhận xét của Công đoàn trường TH Nguyễn Du về đảng viên dự bị Nguyễn Thị Mai.\n- Trong 12 tháng dự bị: hoàn thành xuất sắc nhiệm vụ, tích cực hoạt động Công đoàn.\n- Đề nghị Chi bộ công nhận chính thức.`,

    [DocType.CT_MAU_13]: `Ví dụ: Ý kiến Chi ủy nơi cư trú về đảng viên dự bị Nguyễn Thị Mai.\n- Trong thời gian dự bị: chấp hành tốt quy định cư trú, tham gia sinh hoạt khu phố.\n- Gia đình ổn định, không vi phạm.\n- Chi ủy đồng ý đề nghị công nhận chính thức.`,

    [DocType.CT_MAU_14]: `Ví dụ: Nghị quyết Chi bộ công nhận đảng viên chính thức Nguyễn Thị Mai.\n- Hội nghị ngày 10/3/2027, có mặt 13/15 đảng viên.\n- Kết quả: 13/13 tán thành (100%).\n- Chi bộ đề nghị Đảng ủy phường công nhận chính thức.`,

    [DocType.CT_MAU_15]: `Ví dụ: Báo cáo Chi ủy đề nghị công nhận chính thức đảng viên Nguyễn Thị Mai.\n- Ngày kết nạp: 01/3/2026. Hết dự bị: 01/3/2027.\n- Kết quả 12 tháng dự bị: hoàn thành tốt nhiệm vụ, không vi phạm.\n- Chi bộ biểu quyết 100% đồng ý.`,

    [DocType.CT_MAU_16]: `Ví dụ: Quyết định công nhận đảng viên chính thức Nguyễn Thị Mai.\n- Căn cứ Điều lệ Đảng, Nghị quyết Chi bộ, Nghị quyết Đảng ủy.\n- Công nhận: Nguyễn Thị Mai là đảng viên chính thức kể từ ngày 01/3/2027.`,

    // ═══════════════════════════════════════════════════
    // KIỂM TRA CHUYÊN ĐỀ (KT1-KT12)
    // ═══════════════════════════════════════════════════
    [DocType.KT_1]: `Ví dụ: Kế hoạch kiểm tra đ/c Nguyễn Văn A về việc chấp hành Quy chế làm việc của Chi bộ, thời gian từ tháng 1 đến tháng 6/2026.\n- Nội dung: thực hiện nguyên tắc tập trung dân chủ, sinh hoạt Đảng, đóng đảng phí.\n- Tổ kiểm tra: 3 đồng chí do đ/c B làm Tổ trưởng.`,

    [DocType.KT_2]: `Ví dụ: Kế hoạch chi tiết của Tổ kiểm tra đ/c Nguyễn Văn A.\n- Phân công: đ/c B - Tổ trưởng (phụ trách chung), đ/c C - viết biên bản, đ/c D - thu thập tài liệu.\n- Lịch làm việc: tuần 1 tháng 3 - triển khai, tuần 2 - thu báo cáo, tuần 3 - làm việc trực tiếp.`,

    [DocType.KT_3]: `Ví dụ: Đề cương yêu cầu đ/c Nguyễn Văn A báo cáo.\n- Tự đánh giá việc chấp hành Quy chế làm việc: sinh hoạt, thực hiện nghị quyết, giữ gìn đoàn kết.\n- Nêu rõ ưu điểm, hạn chế, nguyên nhân, kiến nghị.`,

    [DocType.KT_4]: `Ví dụ: Biên bản triển khai kế hoạch kiểm tra đ/c Nguyễn Văn A.\n- Thời gian: 14h ngày 05/3/2026, tại trụ sở Chi bộ.\n- Có mặt: Tổ kiểm tra (3 đ/c) và đ/c Nguyễn Văn A.\n- Nội dung: công bố kế hoạch, giao đề cương, hẹn nộp báo cáo tự kiểm tra.`,

    [DocType.KT_5]: `Ví dụ: Báo cáo tự kiểm tra của đ/c Nguyễn Văn A.\n- Ưu điểm: sinh hoạt đầy đủ, chấp hành nghị quyết, đóng đảng phí đúng hạn.\n- Hạn chế: đôi khi chưa phát biểu ý kiến trong sinh hoạt.\n- Kiến nghị: không có.`,

    [DocType.KT_6]: `Ví dụ: Biên bản làm việc với đ/c Nguyễn Văn A.\n- Thời gian: 9h ngày 15/3/2026.\n- Tổ kiểm tra đã trao đổi, đối chiếu nội dung báo cáo tự kiểm tra.\n- Đ/c A giải trình thêm về việc vắng sinh hoạt 2 buổi (có lý do chính đáng).`,

    [DocType.KT_7]: `Ví dụ: Biên bản xác minh của Tổ kiểm tra.\n- Làm việc với Tổ trưởng Công đoàn để xác minh việc đ/c A tham gia hoạt động đoàn thể.\n- Kết quả: đ/c A có tham gia đầy đủ và hoàn thành nhiệm vụ Công đoàn.`,

    [DocType.KT_8]: `Ví dụ: Báo cáo kết quả kiểm tra đ/c Nguyễn Văn A của Tổ kiểm tra.\n- Ưu điểm: chấp hành tốt Điều lệ, sinh hoạt 10/12 buổi, đóng phí đúng hạn.\n- Hạn chế: vắng 2 buổi có lý do nhưng chưa báo trước.\n- Đề nghị: Chi bộ nhắc nhở, không cần kỷ luật.`,

    [DocType.KT_9]: `Ví dụ: Trích biên bản hội nghị Chi bộ xem xét kết quả kiểm tra đ/c Nguyễn Văn A.\n- Họp ngày 05/4/2026, 13/15 đảng viên có mặt.\n- Bí thư thông qua báo cáo, Chi bộ thảo luận.\n- Kết luận: đ/c A có ưu điểm là chính, hạn chế nhỏ, yêu cầu khắc phục.`,

    [DocType.KT_10]: `Ví dụ: Thông báo kết luận kiểm tra đ/c Nguyễn Văn A.\n- Ưu điểm: chấp hành tốt Quy chế, giữ gìn đoàn kết.\n- Hạn chế: cần chủ động báo cáo khi vắng sinh hoạt.\n- Chi bộ yêu cầu đ/c A khắc phục và báo cáo kết quả trước ngày 30/6/2026.`,

    [DocType.KT_11]: `Ví dụ: Biên bản triển khai thông báo kết luận kiểm tra đến đ/c Nguyễn Văn A.\n- Thời gian: 10h ngày 10/4/2026.\n- Đại diện Chi bộ đọc thông báo, đ/c A ký nhận và cam kết khắc phục.`,

    [DocType.KT_12]: `Ví dụ: Mục lục hồ sơ kiểm tra đ/c Nguyễn Văn A.\n- Gồm 11 văn bản từ KT1 đến KT11, đóng quyển, lưu trữ tại Chi bộ.`,

    // ═══════════════════════════════════════════════════
    // GIÁM SÁT CHUYÊN ĐỀ (GS1-GS12)
    // ═══════════════════════════════════════════════════
    [DocType.GS_1]: `Ví dụ: Kế hoạch giám sát đ/c Trần Văn C về đạo đức, lối sống, thời gian từ tháng 4 đến tháng 9/2026.\n- Nội dung: thực hành tiết kiệm, chống lãng phí, giữ gìn phẩm chất đạo đức của người đảng viên.\n- Tổ giám sát: 3 đồng chí do đ/c D làm Tổ trưởng.`,

    [DocType.GS_2]: `Ví dụ: Kế hoạch chi tiết của Tổ giám sát đ/c Trần Văn C.\n- Phân công nhiệm vụ: đ/c D phụ trách chung, đ/c E ghi biên bản, đ/c F xác minh.\n- Lịch: tuần 1 tháng 4 - triển khai, tuần 3 - thu báo cáo, tháng 5 - làm việc trực tiếp.`,

    [DocType.GS_3]: `Ví dụ: Đề cương báo cáo tự giám sát cho đ/c Trần Văn C.\n- Tự nhận xét về đạo đức, lối sống cá nhân và gia đình.\n- Việc rèn luyện theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.\n- Ưu điểm, hạn chế và biện pháp khắc phục.`,

    [DocType.GS_4]: `Ví dụ: Biên bản triển khai kế hoạch giám sát đ/c Trần Văn C.\n- Thời gian: 14h ngày 10/4/2026.\n- Tổ giám sát công bố kế hoạch, giao đề cương, hẹn nộp báo cáo trong 15 ngày.`,

    [DocType.GS_5]: `Ví dụ: Báo cáo tự giám sát của đ/c Trần Văn C.\n- Ưu điểm: sống giản dị, liêm khiết, không vi phạm đạo đức.\n- Hạn chế: chưa thường xuyên tự phê bình trong sinh hoạt.\n- Kiến nghị: được Chi bộ tiếp tục quan tâm giúp đỡ.`,

    [DocType.GS_6]: `Ví dụ: Biên bản làm việc Tổ giám sát với đ/c Trần Văn C.\n- Đ/c C trình bày báo cáo, Tổ giám sát trao đổi, đặt câu hỏi.\n- Đ/c C giải trình: gia đình ổn định, không có tài sản bất minh.`,

    [DocType.GS_7]: `Ví dụ: Biên bản xác minh - Tổ giám sát làm việc với tổ trưởng khu phố.\n- Xác nhận: đ/c C chấp hành tốt tại nơi cư trú, không vi phạm, gia đình gương mẫu.`,

    [DocType.GS_8]: `Ví dụ: Báo cáo kết quả giám sát đ/c Trần Văn C.\n- Ưu điểm: đạo đức tốt, lối sống lành mạnh, quần chúng tín nhiệm.\n- Hạn chế: cần tự giác tự phê bình hơn.\n- Đề nghị: Chi bộ biểu dương và nhắc đ/c C phát huy.`,

    [DocType.GS_9]: `Ví dụ: Trích biên bản hội nghị Chi bộ xem xét kết quả giám sát đ/c Trần Văn C.\n- 14/15 đảng viên có mặt. Chi bộ thảo luận, nhất trí kết luận.\n- Bí thư kết luận: đ/c C có nhiều ưu điểm, tiếp tục phát huy.`,

    [DocType.GS_10]: `Ví dụ: Thông báo kết luận giám sát đ/c Trần Văn C.\n- Ưu điểm: chấp hành tốt, đạo đức lối sống mẫu mực.\n- Yêu cầu: tiếp tục phát huy, tự giác tự phê bình.`,

    [DocType.GS_11]: `Ví dụ: Biên bản triển khai thông báo kết luận giám sát đến đ/c Trần Văn C.\n- Đ/c C tiếp nhận thông báo, cam kết tiếp tục phấn đấu.`,

    [DocType.GS_12]: `Ví dụ: Mục lục hồ sơ giám sát đ/c Trần Văn C.\n- Gồm 11 văn bản từ GS1 đến GS11, đóng quyển lưu trữ.`,

    // ═══════════════════════════════════════════════════
    // GIẢI QUYẾT TỐ CÁO (TC1-TC16)
    // ═══════════════════════════════════════════════════
    [DocType.TC_1]: `Ví dụ: Biên bản làm việc với người tố cáo.\n- Người tố cáo: Lê Văn X, khu phố 3.\n- Nội dung tố cáo: đ/c Phạm Văn Y có dấu hiệu vi phạm trong quản lý quỹ khu phố.\n- Bằng chứng: hóa đơn không khớp, báo cáo thu chi mâu thuẫn.`,

    [DocType.TC_2]: `Ví dụ: Kế hoạch giải quyết tố cáo đ/c Phạm Văn Y.\n- Nội dung: xác minh việc quản lý quỹ, thu chi khu phố.\n- Tổ kiểm tra: 3 đ/c, thời gian 30 ngày.`,

    [DocType.TC_3]: `Ví dụ: Kế hoạch chi tiết Tổ kiểm tra giải quyết tố cáo đ/c Y.\n- Phân công: thu thập chứng từ, làm việc với kế toán, xác minh số liệu.`,

    [DocType.TC_4]: `Ví dụ: Đề cương yêu cầu đ/c Phạm Văn Y giải trình.\n- Giải trình về: quỹ thu chi, hóa đơn, mục đích sử dụng kinh phí.\n- Cung cấp sổ sách, chứng từ liên quan.`,

    [DocType.TC_5]: `Ví dụ: Biên bản triển khai kế hoạch giải quyết tố cáo.\n- Công bố kế hoạch đến đ/c Y, giao đề cương giải trình.`,

    [DocType.TC_6]: `Ví dụ: Báo cáo giải trình của đ/c Phạm Văn Y.\n- Giải trình: quỹ thu được 5 triệu, chi 4.8 triệu theo danh mục được duyệt.\n- Chênh lệch 200k do ghi nhầm số liệu.`,

    [DocType.TC_7]: `Ví dụ: Biên bản làm việc Tổ kiểm tra với đ/c Phạm Văn Y.\n- Đối chiếu sổ sách với giải trình, yêu cầu bổ sung chứng từ.`,

    [DocType.TC_8]: `Ví dụ: Biên bản xác minh - làm việc với kế toán khu phố.\n- Xác nhận: số liệu thu chi cơ bản đúng, sai sót là do ghi chép không cẩn thận.`,

    [DocType.TC_9]: `Ví dụ: Báo cáo kết quả giải quyết tố cáo đ/c Y.\n- Kết luận: tố cáo có phần đúng (ghi chép thiếu cẩn thận), không có tham ô.\n- Đề nghị: nhắc nhở đ/c Y về trách nhiệm quản lý tài chính.`,

    [DocType.TC_10]: `Ví dụ: Trích biên bản hội nghị Chi bộ xem xét kết quả giải quyết tố cáo.\n- Chi bộ nhất trí kết luận không kỷ luật, yêu cầu đ/c Y rút kinh nghiệm.`,

    [DocType.TC_11]: `Ví dụ: Thông báo kết luận giải quyết tố cáo.\n- Tố cáo một phần đúng (thiếu cẩn thận), đ/c Y phải khắc phục nghiêm túc.\n- Thông báo đến người tố cáo biết kết quả.`,

    [DocType.TC_12]: `Ví dụ: Biên bản triển khai thông báo kết luận đến đ/c Y và người tố cáo.`,

    [DocType.TC_13]: `Ví dụ: Phiếu biểu quyết đề nghị kỷ luật đ/c Phạm Văn Y (nếu có).\n- Hình thức kỷ luật đề nghị: Khiển trách / Cảnh cáo / Cách chức / Khai trừ.`,

    [DocType.TC_14]: `Ví dụ: Biên bản kiểm phiếu đề nghị kỷ luật.\n- Tổng số phiếu: 13. Khiển trách: 10 phiếu. Không kỷ luật: 3 phiếu.`,

    [DocType.TC_15]: `Ví dụ: Phiếu biểu quyết thi hành kỷ luật.\n- Hình thức: Khiển trách: __; Cảnh cáo: __; Cách chức: __; Khai trừ: __.`,

    [DocType.TC_16]: `Ví dụ: Mục lục hồ sơ giải quyết tố cáo đ/c Phạm Văn Y.\n- Gồm 15 văn bản, đóng quyển lưu trữ.`,

    // ═══════════════════════════════════════════════════
    // DẤU HIỆU VI PHẠM (DH1-DH18)
    // ═══════════════════════════════════════════════════
    [DocType.DH_1]: `Ví dụ: Kế hoạch kiểm tra dấu hiệu vi phạm đ/c Hoàng Văn E.\n- Dấu hiệu: đ/c E vắng sinh hoạt Đảng nhiều kỳ liên tiếp không lý do.\n- Nội dung kiểm tra: chấp hành Điều lệ Đảng, Quy định 37.\n- Thời gian: 30 ngày.`,

    [DocType.DH_2]: `Ví dụ: Kế hoạch chi tiết Tổ kiểm tra vi phạm đ/c E.\n- Thu thập sổ sinh hoạt, xác minh lý do vắng mặt.`,

    [DocType.DH_3]: `Ví dụ: Đề cương yêu cầu đ/c E báo cáo giải trình.\n- Lý do vắng sinh hoạt các tháng 1, 2, 3/2026.\n- Tình hình chấp hành nghĩa vụ đảng viên.`,

    [DocType.DH_4]: `Ví dụ: Biên bản triển khai kế hoạch kiểm tra đ/c E.\n- Công bố kế hoạch, giao đề cương, yêu cầu nộp giải trình trong 10 ngày.`,

    [DocType.DH_5]: `Ví dụ: Biên bản làm việc với đ/c Tổ trưởng dân phố (liên quan đ/c E).\n- Xác nhận: đ/c E thường xuyên đi vắng, ít tham gia hoạt động khu phố.`,

    [DocType.DH_6]: `Ví dụ: Biên bản làm việc với đ/c Hoàng Văn E.\n- Đ/c E giải trình: do công việc bận, phải đi công tác xa.\n- Tổ kiểm tra nhận thấy: lý do chưa thỏa đáng cho 3 tháng liên tiếp.`,

    [DocType.DH_7]: `Ví dụ: Báo cáo kết quả kiểm tra dấu hiệu vi phạm đ/c E.\n- Kết luận: đ/c E vi phạm Điều 3, Quy định 37 (vắng sinh hoạt không lý do).\n- Đề nghị: kỷ luật khiển trách.`,

    [DocType.DH_8]: `Ví dụ: Trích biên bản hội nghị Chi bộ xem xét kết quả kiểm tra đ/c E.\n- Chi bộ thảo luận, nhất trí đề nghị kỷ luật khiển trách.`,

    [DocType.DH_9]: `Ví dụ: Thông báo kết luận kiểm tra đ/c E.\n- Vi phạm Điều lệ Đảng. Yêu cầu khắc phục ngay.`,

    [DocType.DH_10]: `Ví dụ: Biên bản triển khai thông báo kết luận kiểm tra đến đ/c E.`,

    [DocType.DH_11]: `Ví dụ: Biên bản triển khai quy trình kỷ luật đ/c Hoàng Văn E.\n- Chi bộ họp biểu quyết hình thức kỷ luật.`,

    [DocType.DH_12]: `Ví dụ: Biên bản kiểm phiếu thi hành kỷ luật đ/c E.\n- Tổng: 13 phiếu. Khiển trách: 11, Cảnh cáo: 2.`,

    [DocType.DH_13]: `Ví dụ: Quyết định kỷ luật đ/c Hoàng Văn E.\n- Hình thức: Khiển trách. Lý do: vi phạm sinh hoạt Đảng.`,

    [DocType.DH_14]: `Ví dụ: Biên bản triển khai quyết định kỷ luật đến đ/c E.\n- Đ/c E ký nhận quyết định, cam kết chấp hành.`,

    [DocType.DH_15]: `Ví dụ: Phiếu biểu quyết đề nghị kỷ luật đ/c E.\n- Hình thức đề nghị: Khiển trách.`,

    [DocType.DH_16]: `Ví dụ: Biên bản kiểm phiếu đề nghị kỷ luật đ/c E.`,

    [DocType.DH_17]: `Ví dụ: Phiếu biểu quyết thi hành kỷ luật đ/c E.`,

    [DocType.DH_18]: `Ví dụ: Mục lục hồ sơ kiểm tra dấu hiệu vi phạm đ/c E.\n- Gồm 17 văn bản, đóng quyển lưu trữ.`,

    // ═══════════════════════════════════════════════════
    // THI HÀNH KỶ LUẬT (KL1-KL16)
    // ═══════════════════════════════════════════════════
    [DocType.KL_1]: `Ví dụ: Kế hoạch thi hành kỷ luật đ/c Đỗ Văn F.\n- Căn cứ: Kết luận kiểm tra, vi phạm Quy định 37 về đạo đức đảng viên.\n- Nội dung: xem xét hình thức kỷ luật phù hợp.\n- Tổ kiểm tra: 3 đ/c, trong 20 ngày.`,

    [DocType.KL_2]: `Ví dụ: Kế hoạch chi tiết Tổ kiểm tra thi hành kỷ luật đ/c F.\n- Phân công: thu thập hồ sơ, yêu cầu kiểm điểm, tổ chức biểu quyết.`,

    [DocType.KL_3]: `Ví dụ: Đề cương yêu cầu đ/c Đỗ Văn F kiểm điểm.\n- Nội dung vi phạm, nhận thức về mức độ, biện pháp khắc phục.`,

    [DocType.KL_4]: `Ví dụ: Biên bản triển khai kế hoạch thi hành kỷ luật đ/c F.\n- Công bố kế hoạch, giao đề cương kiểm điểm cho đ/c F.`,

    [DocType.KL_5]: `Ví dụ: Báo cáo kiểm điểm của đ/c Đỗ Văn F.\n- Tự nhận: vi phạm Quy định 37 về giữ gìn đạo đức.\n- Nguyên nhân: do nhận thức chưa đầy đủ, thiếu rèn luyện.\n- Xin Chi bộ xem xét.`,

    [DocType.KL_6]: `Ví dụ: Biên bản làm việc Tổ kiểm tra với đ/c Đỗ Văn F.\n- Đ/c F trình bày kiểm điểm, Tổ trao đổi, làm rõ nội dung vi phạm.`,

    [DocType.KL_7]: `Ví dụ: Biên bản thẩm tra, xác minh vi phạm đ/c F.\n- Xác minh với tổ chức, cá nhân liên quan. Kết quả: vi phạm có thật.`,

    [DocType.KL_8]: `Ví dụ: Báo cáo đề nghị thi hành kỷ luật đ/c F.\n- Vi phạm: Điều 3, Quy định 37. Đề nghị: Cảnh cáo.`,

    [DocType.KL_9]: `Ví dụ: Trích biên bản hội nghị Chi bộ xem xét kỷ luật đ/c F.\n- Chi bộ thảo luận, biểu quyết. Đa số đồng ý hình thức Cảnh cáo.`,

    [DocType.KL_10]: `Ví dụ: Phiếu biểu quyết thi hành kỷ luật đ/c F.\n- Khiển trách: __ ; Cảnh cáo: __ ; Cách chức: __ ; Khai trừ: __.`,

    [DocType.KL_11]: `Ví dụ: Biên bản kiểm phiếu thi hành kỷ luật đ/c F.\n- Tổng: 14 phiếu. Cảnh cáo: 12, Khiển trách: 2.`,

    [DocType.KL_12]: `Ví dụ: Quyết định kỷ luật đ/c Đỗ Văn F.\n- Hình thức: Cảnh cáo. Có hiệu lực từ ngày ký.`,

    [DocType.KL_13]: `Ví dụ: Biên bản công bố quyết định kỷ luật đến đ/c F.\n- Đại diện Chi bộ đọc quyết định, đ/c F ký nhận.`,

    [DocType.KL_14]: `Ví dụ: Phiếu biểu quyết đề nghị kỷ luật đ/c F.\n- Hình thức đề nghị: Cảnh cáo.`,

    [DocType.KL_15]: `Ví dụ: Biên bản kiểm phiếu đề nghị kỷ luật đ/c F.`,

    [DocType.KL_16]: `Ví dụ: Mục lục hồ sơ thi hành kỷ luật đ/c Đỗ Văn F.\n- Gồm 15 văn bản, đóng quyển lưu trữ.`,
};

/**
 * Lấy placeholder phù hợp cho loại văn bản, fallback về mặc định.
 */
export const getDocPlaceholder = (docType: DocType): string => {
    return DOC_PLACEHOLDERS[docType]
        || `Nhập dữ liệu thô cho "${docType}". AI sẽ tự động hoàn thiện văn bản chuẩn theo đúng biểu mẫu.`;
};
