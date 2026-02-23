import { DocType } from '../types';

/**
 * Cấu trúc biểu mẫu KTGS trích xuất từ các tệp mẫu chuẩn.
 * Dùng để inject vào prompt AI, buộc AI giữ nguyên 100% khung sườn.
 *
 * Nguồn: C:\Users\Admin\Downloads\HUONGDANMAUCHI BO
 */

export const KTGS_TEMPLATES: Partial<Record<DocType, string>> = {

    // ═══════════════════════════════════════════════════════════════
    // CHI ỦY — CHƯƠNG TRÌNH SINH HOẠT CHI ỦY
    // ═══════════════════════════════════════════════════════════════

    [DocType.COMMITTEE_PROGRAM]: `ĐẢNG BỘ PHƯỜNG ……………               ĐẢNG CỘNG SẢN VIỆT NAM
CHI BỘ ……………
        *                              ……………, ngày …… tháng …… năm 20……

CHƯƠNG TRÌNH HỌP BAN CHI ỦY CHI BỘ ……………
THÁNG …… NĂM 20……
-----

I. MỤC ĐÍCH, YÊU CẦU
- Đánh giá tình hình thực hiện nhiệm vụ chính trị, công tác xây dựng Đảng Tháng …… năm 20…… và dịp ……
- Thảo luận, thống nhất chương trình công tác trọng tâm Tháng …… năm 20……; chuẩn bị nội dung sinh hoạt chi bộ định kỳ.
- Phát huy vai trò lãnh đạo tập thể Ban Chi ủy; bảo đảm nguyên tắc tập trung dân chủ, trách nhiệm cá nhân gắn với tập thể.

II. THỜI GIAN, ĐỊA ĐIỂM
- Thời gian: …… giờ ……, ngày …… tháng …… năm 20……
- Địa điểm: ……………………………………………

III. THÀNH PHẦN
- Các đồng chí trong Ban Chi ủy Chi bộ ……………

IV. NỘI DUNG CHƯƠNG TRÌNH
1. Khai mạc, thông qua chương trình họp
- Đồng chí Bí thư Chi bộ chủ trì, nêu mục đích, yêu cầu cuộc họp.
- Thông qua chương trình, phân công thư ký ghi biên bản.

2. Đánh giá tình hình Tháng …… năm 20……
- Nghe báo cáo tóm tắt:
  + Công tác lãnh đạo thực hiện nhiệm vụ chính trị tại khu phố.
  + Công tác xây dựng Đảng, quản lý đảng viên, nắm bắt tư tưởng Nhân dân.
  + Công tác phối hợp với Ban điều hành khu phố, các đoàn thể.
- Ban Chi ủy thảo luận, nhận xét ưu điểm, hạn chế, nguyên nhân.

3. Thảo luận chương trình công tác Tháng …… năm 20……
Tập trung vào các nội dung trọng tâm:
- Công tác tuyên truyền, định hướng tư tưởng đảng viên và Nhân dân.
- Lãnh đạo thực hiện các nhiệm vụ chính trị tại địa phương.
- Công tác quản lý đảng viên, sinh hoạt chi bộ, thu nộp đảng phí.
- Công tác phát triển Đảng.
- Các nhiệm vụ đột xuất theo chỉ đạo của Đảng ủy phường.

4. Chuẩn bị nội dung sinh hoạt Chi bộ Tháng …… năm 20……
- Dự kiến nội dung trọng tâm sinh hoạt chi bộ.
- Phân công Ủy viên, chuẩn bị tài liệu.
- Thống nhất thời gian, địa điểm tổ chức sinh hoạt chi bộ.

5. Công tác kiểm tra, giám sát và phân công nhiệm vụ
- Xây dựng Kế hoạch kiểm tra, giám sát năm 20……
- Phân công nhiệm vụ cụ thể cho từng đồng chí Chi ủy viên, gắn trách nhiệm cá nhân.

6. Ý kiến kết luận của Bí thư Chi bộ
- Kết luận các nội dung đã thống nhất.
- Chỉ đạo tổ chức thực hiện; giao nhiệm vụ cụ thể, thời hạn hoàn thành.

V. BẾ MẠC
- Thư ký thông qua dự thảo biên bản họp.
- Bí thư Chi bộ kết thúc cuộc họp.

Nơi nhận:                                          T/M CHI BỘ
- Đảng ủy phường (báo cáo);                           BÍ THƯ
- Ban chi ủy;
- Lưu Chi bộ.`,

    [DocType.COMMITTEE_CONCLUSION]: `ĐẢNG BỘ PHƯỜNG ……………               ĐẢNG CỘNG SẢN VIỆT NAM
CHI BỘ ……………
                                   ……………, ngày …… tháng …… năm 20……

KẾT LUẬN
HỌP BAN CHI ỦY CHI BỘ …………… - THÁNG …… NĂM 20……
-----

Thời gian: …… giờ ……, ngày …… tháng …… năm 20……
Địa điểm: ……………………………………………
Thành phần triệu tập: Các đồng chí Ủy viên Ban Chi ủy Chi bộ ……………
(Tổng số: …… đồng chí)
Chủ trì: Đồng chí …………… – Bí thư Chi bộ
Thư ký: Đồng chí ……………

NỘI DUNG CHƯƠNG TRÌNH

I. PHẦN MỞ ĐẦU
1. Tuyên bố lý do: Họp Ban Chi ủy định kỳ tháng ……/20…… nhằm đánh giá kết quả lãnh đạo tháng ……/20……, triển khai nghị quyết tháng ……/20……
2. Điểm danh: Báo cáo số lượng cấp ủy viên có mặt/vắng mặt trên tổng số …… đồng chí.
3. Thông qua chương trình làm việc.

II. ĐÁNH GIÁ TÌNH HÌNH THỰC HIỆN NHIỆM VỤ THÁNG ……/20……
Sau khi nghe báo cáo và thảo luận, Ban Chi ủy thống nhất đánh giá:
- Công tác Chính trị - Tư tưởng: (nội dung đánh giá)
- Công tác xây dựng Đảng: (nội dung đánh giá)
- An ninh trật tự: (nội dung đánh giá)
- Công tác chăm lo đời sống: (nội dung đánh giá)
* Đánh giá công tác xây dựng Đảng:
- Tình hình tư tưởng cán bộ, đảng viên và nhân dân.
- Duy trì nề nếp sinh hoạt chi bộ, thu nộp đảng phí tháng ……/20……
2. Đánh giá chung:
- Ưu điểm: ……………………
- Hạn chế, tồn tại: ……………………

III. TRIỂN KHAI NHIỆM VỤ TRỌNG TÂM THÁNG …… NĂM 20……
1. Công tác lãnh đạo thực hiện nhiệm vụ chính trị:
a) Công tác tuyên truyền:
- (nội dung tuyên truyền trọng tâm trong tháng)

b) Công tác chăm lo đời sống:
- (nội dung chăm lo đời sống, chính sách xã hội)

c) An ninh trật tự:
- (nội dung đảm bảo an ninh trật tự trên địa bàn)

d) Công tác Quân sự:
- (nội dung quản lý quân số, thanh niên nhập ngũ)

e) Công tác xây dựng Đảng:
- Duy trì nề nếp sinh hoạt và nâng tỷ lệ sử dụng Sổ tay đảng viên điện tử.
- Xây dựng và triển khai Kế hoạch kiểm tra, giám sát năm 20…… của Chi bộ.
- Thu nộp đảng phí tháng ……/20……
- Phân công đảng viên nắm bắt tình hình dư luận xã hội.
- Tổ chức rà soát xây dựng các kế hoạch, nghị quyết.

f) Lãnh đạo các đoàn thể:
- Chỉ đạo Ban Công tác Mặt trận và các chi hội đoàn thể tham gia hoạt động.
- (nội dung lãnh đạo đoàn thể cụ thể trong tháng)

IV. THẢO LUẬN CỦA BAN CHI ỦY
- Các đồng chí trong Ban Chi ủy (…… đ/c) thảo luận, đóng góp ý kiến vào các chỉ tiêu, giải pháp.
- (ghi tóm tắt nội dung thảo luận, các ý kiến thống nhất)

V. KẾT LUẬN CỦA BÍ THƯ CHI BỘ (Đồng chí ……………)
- Tiếp thu các ý kiến, thống nhất nội dung đánh giá và phương hướng nhiệm vụ tháng ……/20……
- Đồng chí Bí thư Chi bộ: (phân công nhiệm vụ cụ thể)
- Đồng chí Phó Bí thư/Chi ủy viên: (phân công nhiệm vụ cụ thể)
- Ban điều hành và các Đoàn thể: (phân công nhiệm vụ cụ thể)
- Thư ký: Hoàn thiện Biên bản họp và ban hành chính thức Nghị quyết tháng ……/20…… để triển khai ra Chi bộ.

Nơi nhận:                                          T/M CHI BỘ
- Đảng ủy phường (báo cáo);                           BÍ THƯ
- Ban chi ủy;
- Lưu Chi bộ.`,

    [DocType.BRANCH_PROGRAM]: `ĐẢNG BỘ PHƯỜNG ……………               ĐẢNG CỘNG SẢN VIỆT NAM
CHI BỘ ……………
                                   ……………, ngày …… tháng …… năm 20……

CHƯƠNG TRÌNH
Họp Chi bộ …………… - Tháng …… năm 20……
-----

I. MỤC ĐÍCH, YÊU CẦU
- Đánh giá kết quả lãnh đạo thực hiện nhiệm vụ chính trị, công tác xây dựng Đảng tháng …… năm 20……
- Thảo luận, thống nhất nhiệm vụ trọng tâm tháng …… năm 20……; phát huy vai trò tiên phong, gương mẫu của đảng viên.
- Thực hiện nghiêm túc nguyên tắc sinh hoạt Đảng; nâng cao chất lượng sinh hoạt chi bộ.

II. THỜI GIAN, ĐỊA ĐIỂM
Thời gian: …… giờ ……, ngày …… tháng …… năm 20……
Địa điểm: ……………………………………………

III. THÀNH PHẦN
Toàn thể đảng viên Chi bộ ……………
(Mời, nếu có): Đại diện Đảng ủy phường ……………

IV. NỘI DUNG CHƯƠNG TRÌNH
1. Khai mạc
- Đồng chí Bí thư Chi bộ tuyên bố lý do, giới thiệu đại biểu (nếu có).
- Thông qua chương trình, cử thư ký ghi biên bản.

2. Thông tin thời sự, quán triệt chủ trương
Thông tin những nội dung nổi bật về tình hình thời sự, các văn bản chỉ đạo mới của cấp trên liên quan đến địa phương, khu phố.

3. Đánh giá kết quả thực hiện nhiệm vụ tháng …… năm 20……
Báo cáo tóm tắt:
- Công tác lãnh đạo thực hiện nhiệm vụ chính trị tại khu phố.
- Công tác xây dựng Đảng, quản lý và rèn luyện đảng viên.
- Công tác phối hợp với Ban điều hành khu phố và các đoàn thể.
- Đảng viên tham gia thảo luận, đóng góp ý kiến.

4. Thảo luận, thống nhất nhiệm vụ trọng tâm tháng …… năm 20……
Tập trung vào các nội dung:
- Công tác tuyên truyền, định hướng tư tưởng đảng viên và Nhân dân.
- Lãnh đạo thực hiện các nhiệm vụ chính trị tại địa phương.
- Công tác quản lý đảng viên, sinh hoạt chi bộ, thu nộp đảng phí.
- Công tác phát triển Đảng.
- Các nhiệm vụ đột xuất theo chỉ đạo của Đảng ủy phường.

5. Ý kiến phát biểu của đại biểu cấp trên (nếu có)

6. Kết luận của Bí thư Chi bộ
- Kết luận các ý kiến thảo luận.
- Thông qua nhiệm vụ trọng tâm tháng …… năm 20……
- Phân công nhiệm vụ cụ thể cho từng đảng viên.

7. Phê bình và tự phê bình

V. KẾT THÚC
- Thư ký thông qua dự thảo biên bản họp.
- Bí thư Chi bộ kết thúc buổi sinh hoạt.

Nơi nhận:                                          T/M CHI BỘ
- Đảng ủy phường (báo cáo);                           BÍ THƯ
- Ban chi ủy;
- Lưu Chi bộ.`,

    // ═══════════════════════════════════════════════════════════════
    // KIỂM TRA CHUYÊN ĐỀ — KT1 → KT12
    // ═══════════════════════════════════════════════════════════════

    [DocType.KT_1]: `KẾ HOẠCH
kiểm tra việc……….......….…. đối với đồng chí……….........…
-----
Thực hiện Kế hoạch số ….- KH/CB, ngày ……/…../….. của Chi bộ về kiểm tra, giám sát của Chi bộ năm 20….. Chi bộ xây dựng Kế hoạch kiểm tra việc….. đối với đồng chí….……… như sau:
I. MỤC ĐÍCH, YÊU CẦU
- Đánh giá đúng ưu điểm, hạn chế, khuyết điểm (nếu có) của đảng viên trong việc…………………….; qua đó phát huy ưu điểm, kịp thời khắc phục, sửa chữa những hạn chế, khuyết điểm, góp phần nâng cao chất lượng công tác kiểm tra, giám sát và thi hành kỷ luật của Đảng.
- Việc kiểm tra phải đảm bảo dân chủ, khách quan, công tâm, thận trọng, chặt chẽ, chính xác, nghiêm minh, tuân thủ đúng nguyên tắc, quy trình, thủ tục, thẩm quyền, phương pháp công tác theo quy định của Đảng; nêu cao ý thức tự phê bình và phê bình của đảng viên.
II. NỘI DUNG
1. Thành phần Tổ kiểm tra
- Đ/c:............................................... - Bí thư (Phó Bí thư) Chi bộ - Tổ trưởng
- Đ/c:............................................... - ...................... - Thành viên
- Đ/c:............................................... - ...................... - Thư ký
2. Nhiệm vụ, quyền hạn của Tổ kiểm tra
2.1. Nhiệm vụ:
- Chậm nhất sau 03 ngày làm việc, kể từ ngày chi bộ ký Kế hoạch kiểm tra, Tổ kiểm tra phải tiến hành triển khai Kế hoạch…
- Thực hiện nhiệm vụ theo đúng quy trình kiểm tra.
- Hoàn thiện hồ sơ, bàn giao…
2.2. Quyền hạn:
Yêu cầu đảng viên được kiểm tra; tổ chức và cá nhân có liên quan (nếu có) chấp hành nghiêm kế hoạch kiểm tra…
3. Nội dung:
Kiểm tra việc...... đối với đồng chí.......
4. Thời gian, địa điểm kiểm tra
- Mốc thời gian kiểm tra: Từ tháng …../20…… đến tháng ……/20……
- Thời gian kiểm tra: .......
- Địa điểm kiểm tra: .......
5. Phương pháp tiến hành
5.1. Tổ kiểm tra triển khai kế hoạch…
5.2. Đảng viên được kiểm tra gửi báo cáo tự kiểm tra…
5.3. Tổ kiểm tra nghiên cứu báo cáo…
5.4. Chi bộ tổ chức hội nghị…
5.5. Tổ kiểm tra hoàn chỉnh báo cáo…
5.6. Đại diện Chi bộ thông báo kết luận…
III. TỔ CHỨC THỰC HIỆN
1. Giao Tổ kiểm tra thực hiện đầy đủ các bước kiểm tra đảng viên theo quy trình…
2. Đảng viên được kiểm tra nghiêm túc chấp hành…
Nơi nhận: UBKT Đảng ủy…, Các đ/c đảng viên, Đảng viên được kiểm tra, Lưu CB
T/M CHI BỘ - BÍ THƯ`,

    [DocType.KT_2]: `KẾ HOẠCH CHI TIẾT
-----
Thực hiện Kế hoạch số ….- KH/CB, ngày …/…./….. của Chi bộ về kiểm tra việc…… đối với đồng chí………. Tổ Kiểm tra xây dựng Kế hoạch chi tiết như sau:
I. ĐỀ CƯƠNG BÁO CÁO: (đảng viên được kiểm tra báo cáo theo đề cương đính kèm).
II. PHÂN CÔNG THÀNH VIÊN TỔ KIỂM TRA
1. Đ/c...................................... - Tổ trưởng, phụ trách chung.
2. Đ/c.......................................- Thành viên, phụ trách kiểm tra..............
3. Đ/c..................................... - Thư ký, phụ trách kiểm tra...................
III. LỊCH LÀM VIỆC CỦA TỔ
(Bảng lịch làm việc)
Nơi nhận: Đảng viên được kiểm tra, Thành viên Tổ, Lưu Tổ
TỔ TRƯỞNG`,

    [DocType.KT_3]: `ĐẢNG CỘNG SẢN VIỆT NAM
An Phú, ngày……tháng…..năm 20…..
ĐỀ CƯƠNG BÁO CÁO
tự kiểm tra theo Kế hoạch số…..-KH/CB, ngày …./…./20… của Chi bộ (*)
-----
Kính gửi: Chi bộ…….
Họ và tên:…………………………..
Chức vụ đảng…………………………………..
Chức vụ chính quyền, đoàn thể:…………………….
Cơ quan, đơn vị công tác:……………………………………
Thực hiện Kế hoạch số…..-KH/CB, ngày…./…./…..của Chi bộ (*) và thông báo của Tổ kiểm tra tại biên bản làm việc ngày…./…./….. về nội dung kiểm tra đảng viên (**). Tôi xin báo cáo như sau:
I. NỘI DUNG BÁO CÁO
(khi xây dựng văn bản ở mục này, cần gợi ý cụ thể đối với từng nội dung kiểm tra…)
II. TỰ NHẬN XÉT VÀ KIẾN NGHỊ
Tự nhận xét
Ưu điểm
Hạn chế, khuyết điểm
* Nguyên nhân của hạn chế, khuyết điểm:
2. Kiến nghị (nếu có):
Trên đây là báo cáo tự kiểm tra về ……… Xin báo cáo chi bộ…………
NGƯỜI BÁO CÁO
(Ký tên)
Họ và tên
Ghi chú: (*) Kế hoạch kiểm tra, giám sát của chi bộ - (**) Biên bản của Tổ kiểm tra`,

    [DocType.KT_4]: `BIÊN BẢN
triển khai kế hoạch kiểm tra
-----
Vào lúc, ……giờ…..phút, ngày…../…./…… tại………………. Tổ kiểm tra làm việc với thành phần và nội dung cụ thể như sau:
I. Thành phần tham dự
Tổ kiểm tra:
- Đ/c……………………………………………… - Chủ trì
- Đ/c……………………………………………….- Ghi biên bản
Đảng viên được kiểm tra:
Đồng chí: ……………………………
II. Nội dung: Triển khai Kế hoạch số ….-KH/CB ngày …../…./……của Chi bộ; Tổ kiểm tra thống nhất lịch làm việc với đảng viên được kiểm tra.
III. Diễn biến:
1. Đồng chí……………………………đại diện Tổ kiểm tra nêu mục đích, yêu cầu của cuộc làm việc. Triển khai Kế hoạch…
Đ/c …………… tiếp nhận các ý kiến từ Tổ kiểm tra và thống nhất lịch làm việc…
Biên bản kết thúc vào lúc….giờ….phút, ngày …./…../…..đã được đọc lại cho những người có mặt cùng nghe và nhất trí với nội dung.
CHỦ TRÌ                    GHI BIÊN BẢN                    ĐẢNG VIÊN ĐƯỢC KIỂM TRA`,

    [DocType.KT_5]: `ĐẢNG CỘNG SẢN VIỆT NAM
An Phú, ngày……tháng…..năm 20…..
BÁO CÁO
tự kiểm tra theo Kế hoạch số…..-KH/CB, ngày …./…./20… của Chi bộ (*)
-----
Kính gửi: Chi bộ…….
Họ và tên:…………………………..
Chức vụ đảng…………………………………..
Chức vụ chính quyền, đoàn thể:…………………….
Cơ quan, đơn vị công tác:……………………………………
Thực hiện Kế hoạch số…..-KH/CB, ngày…./…./…..của Chi bộ (*) và thông báo của Tổ kiểm tra…(**). Tôi xin báo cáo như sau:
I. NỘI DUNG BÁO CÁO
(báo cáo cụ thể các nội dung theo gợi ý của chi bộ).
II. TỰ NHẬN XÉT VÀ KIẾN NGHỊ
Tự nhận xét
Ưu điểm:
Hạn chế, nguyên nhân:
2. Kiến nghị (nếu có):
Trên đây là báo cáo tự kiểm tra về việc ………; báo cáo chi bộ xem xét, kết luận.
NGƯỜI BÁO CÁO
(Ký tên)
Họ và tên`,

    [DocType.KT_6]: `BIÊN BẢN
làm việc với đảng viên được kiểm tra
-----
Vào lúc, ……giờ…..phút, ngày…../…./…… tại…………………..Tổ kiểm tra làm việc với thành phần và nội dung cụ thể như sau:
I. Thành phần tham dự
1. Tổ kiểm tra:
Đ/c……………………………………………………………- Chủ trì
Đ/c……………………………………………………………- Ghi biên bản
2. Đảng viên được kiểm tra: đ/c  …………………………………...().
II. Nội dung và diễn biến cuộc làm việc: (ghi đầy đủ nội dung và diễn biến cuộc làm việc của Tổ kiểm tra với đảng viên được kiểm tra)
Biên bản kết thúc vào lúc….giờ….phút, ngày …./…../….., đã được đọc lại cho những người có mặt cùng nghe và nhất trí với nội dung.
CHỦ TRÌ                    GHI BIÊN BẢN                    ĐẢNG VIÊN ĐƯỢC KIỂM TRA`,

    [DocType.KT_7]: `BIÊN BẢN
làm việc với ()………………………….(dùng trong quá trình thẩm tra, xác minh)
-----
Vào lúc, ……giờ…..phút, ngày…../…./…… tại……………..Tổ kiểm tra làm việc với thành phần và nội dung cụ thể như sau:
I. Thành phần tham dự
1. Tổ kiểm tra:
Đ/c……………………………………………………………- Chủ trì
Đ/c……………………………………………………………- Ghi biên bản
2.  ………………………………………………………….(1)………….
II. Nội dung và diễn biến cuộc làm việc: (ghi đầy đủ nội dung và diễn biến cuộc làm việc của Tổ kiểm tra với …………………….(1))
Biên bản kết thúc vào lúc….giờ….phút, ngày …./…../….., đã được đọc lại cho những người có mặt cùng nghe và nhất trí với nội dung.
CHỦ TRÌ                    GHI BIÊN BẢN                    (1)`,

    [DocType.KT_8]: `BÁO CÁO
kết quả kiểm tra đảng viên ……………
-----
Thực hiện Kế hoạch số …..-KH/CB, ngày …../…./…... của Chi bộ, Tổ Kiểm tra đã tiến hành kiểm tra ….……(họ và tên, chức vụ) về việc………(ghi nội dung kiểm tra).
Tổ kiểm tra báo cáo kết quả như sau:
I. Kết quả kiểm tra
(Nêu rõ kết quả thẩm tra, xác minh về từng nội dung đã được kiểm tra theo đề cương; làm rõ ưu điểm, hạn chế, khuyết điểm, nguyên nhân)
II. Nhận xét kiến nghị
1. Về ưu điểm:
2. Về hạn chế, nguyên nhân:
3. Tổ kiểm tra đề nghị với Chi bộ để đề nghị (hoặc yêu cầu) đồng chí………. phát huy ưu điểm, sửa chữa, khắc phục…
Trên đây là báo cáo kết quả kiểm tra việc …… đối với đồng chí……. Tổ Kiểm tra báo cáo Chi bộ xem xét, kết luận.
TỔ TRƯỞNG`,

    [DocType.KT_9]: `TRÍCH BIÊN BẢN
Hội nghị chi bộ
-----
Vào lúc, ……giờ…..phút, ngày…../…./…… tại……………..Chi bộ tiến hành hội nghị với thành phần, nội dung cụ thể như sau.
I. Thành phần tham dự
1. Chi bộ:
- Có mặt …../…..đồng chí
- Vắng mặt …….đồng chí:
+ Đ/c………………., lý do…………..
2. Chủ trì: Đ/c ……………………………
3. Ghi biên bản: Đ/c……………………………
II. Nội dung: Nghe Tổ kiểm tra thông qua dự thảo báo cáo kết quả kiểm tra.
III. Diễn biến
1. Đ/c Bí thư chi bộ phát biểu quán triệt…
2. Đ/c ………, đại diện Tổ kiểm tra thông qua báo cáo kết quả kiểm tra đối với đồng chí……(1); dự thảo Thông báo kết luận kiểm tra…
3. Chi bộ thảo luận (ghi đầy đủ họ tên và ý kiến của từng đồng chí phát biểu):
4. Đề nghị đ/c:……(1) phát biểu hoặc giải trình một số nội dung chưa rõ (nếu có).
5. Đồng chí Bí thư Chi bộ, chủ trì hội nghị kết luận
(1) Về ưu điểm:
(2) Về hạn chế, khuyết điểm:
(3) Đề nghị đồng chí……(1) trong thời gian tới cần thực hiện tốt…
Hội nghị không còn ý kiến nào khác, thống nhất với các nội dung nêu trên, kết thúc lúc…..giờ….phút, cùng ngày.
GHI BIÊN BẢN                                                CHỦ TRÌ`,

    [DocType.KT_10]: `THÔNG BÁO
kết luận kiểm tra đảng viên ……………………
-----
Thực hiện Kế hoạch kiểm tra, giám sát năm…, Chi bộ đã tiến hành kiểm tra việc ……(ghi nội dung đã được kiểm tra) đối với đồng chí……(ghi họ và tên, chức vụ); mốc thời gian kiểm tra từ tháng…./20…..đến tháng …./20….
Sau khi nghe báo cáo của Tổ kiểm tra, Chi bộ đã thảo luận và thống nhất kết luận đối với đồng chí……… như sau:
1. Ưu điểm:
2. Hạn chế:
3. Chi bộ yêu cầu:
Theo Quy chế làm việc, Chi bộ thông báo để đồng chí……… (họ và tên, chức vụ) biết, triển khai thực hiện và báo cáo kết quả về Chi bộ trước ngày…/…./20…..
Nơi nhận:                                                   T/M CHI BỘ
UBKT Đảng ủy…………,                                        BÍ THƯ
Cấp ủy chi bộ,
Đảng viên được kiểm tra,
Lưu Chi bộ, hồ sơ.`,

    [DocType.KT_11]: `BIÊN BẢN
triển khai Thông báo kết luận kiểm tra
-----
Vào lúc, ……giờ…..phút, ngày…../…./…… tại………………. đại diện Chi bộ triển khai thông báo kết luận kiểm tra với thành phần và nội dung cụ thể như sau:
I. Thành phần tham dự
Đại diện chi bộ:
- Đ/c……………………………………………… - Chủ trì
- Đ/c……………………………………………….- Ghi biên bản
Đảng viên được kiểm tra:
Đồng chí: ……………………………
II. Nội dung: Triển khai Thông báo số ….-TB/CB ngày …../…./……của Chi bộ về kết luận kiểm tra đảng viên……………..………
III. Diễn biến:
1. Đồng chí……………đại diện Chi bộ nêu mục đích, yêu cầu…
2. Đ/c …………… tiếp nhận…
Biên bản kết thúc vào lúc….giờ….phút, ngày …./…../…..đã được đọc lại…nhất trí với nội dung.
CHỦ TRÌ                    GHI BIÊN BẢN                    ĐẢNG VIÊN ĐƯỢC KIỂM TRA`,

    [DocType.KT_12]: `MỤC LỤC VÀ CHỨNG TỪ KẾT THÚC
Hồ sơ kiểm tra đảng viên……………
(Liệt kê đầy đủ 11 văn bản trong bộ hồ sơ, đóng quyển lưu trữ)`,

    // ═══════════════════════════════════════════════════════════════
    // GIÁM SÁT CHUYÊN ĐỀ — GS1 → GS12
    // ═══════════════════════════════════════════════════════════════

    [DocType.GS_1]: `KẾ HOẠCH
giám sát việc……….......….…. đối với đồng chí……….........…
-----
Thực hiện Kế hoạch số ….- KH/CB, ngày ……/…../….. của Chi bộ về kiểm tra, giám sát của Chi bộ năm 20….. Chi bộ xây dựng Kế hoạch giám sát việc….. đối với đồng chí…… như sau:
I. MỤC ĐÍCH, YÊU CẦU
- Đánh giá đúng ưu điểm, hạn chế, khuyết điểm (nếu có)…; qua đó phát huy ưu điểm…
- Việc giám sát phải đảm bảo dân chủ, khách quan, công tâm…
II. NỘI DUNG
1. Thành phần Tổ giám sát
- Đ/c:............................................... - Bí thư (Phó Bí thư) Chi bộ - Tổ trưởng
- Đ/c:............................................... - ...................... - Thành viên
- Đ/c:............................................... - ...................... - Thư ký
2. Nhiệm vụ, quyền hạn của Tổ giám sát
2.1. Nhiệm vụ:
2.2. Quyền hạn:
3. Nội dung:
4. Thời gian, địa điểm giám sát
5. Phương pháp tiến hành (5.1 → 5.6)
III. TỔ CHỨC THỰC HIỆN
Nơi nhận: UBKT Đảng ủy…, Các đ/c đảng viên, Đảng viên được giám sát, Lưu CB
T/M CHI BỘ - BÍ THƯ`,

    [DocType.GS_2]: `KẾ HOẠCH CHI TIẾT
-----
I. ĐỀ CƯƠNG BÁO CÁO: (đảng viên được giám sát báo cáo theo đề cương đính kèm).
II. PHÂN CÔNG THÀNH VIÊN TỔ GIÁM SÁT
1. Đ/c...................................... - Tổ trưởng, phụ trách chung.
2. Đ/c.......................................- Thành viên, phụ trách giám sát...
3. Đ/c..................................... - Thư ký, phụ trách giám sát...
III. LỊCH LÀM VIỆC CỦA TỔ
TỔ TRƯỞNG`,

    [DocType.GS_3]: `ĐỀ CƯƠNG BÁO CÁO
theo Kế hoạch số…..-KH/CB, ngày …./…./20… của Chi bộ (*)
-----
Kính gửi: Chi bộ…….
Họ và tên / Chức vụ đảng / Chức vụ chính quyền, đoàn thể / Cơ quan, đơn vị công tác
I. NỘI DUNG BÁO CÁO
II. TỰ NHẬN XÉT VÀ KIẾN NGHỊ
Ưu điểm / Hạn chế, khuyết điểm / Nguyên nhân / Kiến nghị
NGƯỜI BÁO CÁO`,

    [DocType.GS_4]: `BIÊN BẢN triển khai kế hoạch giám sát
-----
I. Thành phần tham dự (Tổ giám sát + Đảng viên được giám sát)
II. Nội dung: Triển khai Kế hoạch…
III. Diễn biến
Biên bản kết thúc…
CHỦ TRÌ                    GHI BIÊN BẢN                    ĐẢNG VIÊN ĐƯỢC GIÁM SÁT`,

    [DocType.GS_5]: `BÁO CÁO theo Kế hoạch số…..-KH/CB, ngày …./…./20… của Chi bộ (*)
-----
Kính gửi: Chi bộ…….
I. NỘI DUNG BÁO CÁO
II. TỰ NHẬN XÉT VÀ KIẾN NGHỊ
a. Ưu điểm / b. Hạn chế, nguyên nhân / Kiến nghị
NGƯỜI BÁO CÁO`,

    [DocType.GS_6]: `BIÊN BẢN làm việc với đảng viên được giám sát
-----
I. Thành phần tham dự
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…
CHỦ TRÌ                    GHI BIÊN BẢN                    ĐẢNG VIÊN ĐƯỢC GIÁM SÁT`,

    [DocType.GS_7]: `BIÊN BẢN làm việc với ()………(dùng trong quá trình thẩm tra, xác minh)
-----
I. Thành phần tham dự
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…
CHỦ TRÌ                    GHI BIÊN BẢN                    (1)`,

    [DocType.GS_8]: `BÁO CÁO kết quả giám sát đảng viên ……………
-----
I. Kết quả giám sát
II. Nhận xét kiến nghị
1. Về ưu điểm / 2. Về hạn chế, nguyên nhân / 3. Đề nghị
TỔ TRƯỞNG`,

    [DocType.GS_9]: `TRÍCH BIÊN BẢN Hội nghị chi bộ
-----
I. Thành phần tham dự
II. Nội dung: Nghe Tổ giám sát thông qua dự thảo báo cáo kết quả giám sát.
III. Diễn biến (1→5)
GHI BIÊN BẢN                                                CHỦ TRÌ`,

    [DocType.GS_10]: `THÔNG BÁO kết luận giám sát đảng viên ……………………
-----
1. Ưu điểm / 2. Hạn chế / 3. Chi bộ yêu cầu
Nơi nhận: UBKT Đảng ủy…, Cấp ủy chi bộ, Đảng viên được giám sát, Lưu Chi bộ, hồ sơ.
T/M CHI BỘ - BÍ THƯ`,

    [DocType.GS_11]: `BIÊN BẢN triển khai Thông báo kết luận giám sát
-----
I. Thành phần tham dự
II. Nội dung
III. Diễn biến
Biên bản kết thúc…
CHỦ TRÌ                    GHI BIÊN BẢN                    ĐẢNG VIÊN ĐƯỢC GIÁM SÁT`,

    [DocType.GS_12]: `MỤC LỤC VÀ CHỨNG TỪ KẾT THÚC
Hồ sơ giám sát đảng viên……………`,

    // ═══════════════════════════════════════════════════════════════
    // GIẢI QUYẾT TỐ CÁO — TC1 → TC16
    // ═══════════════════════════════════════════════════════════════

    [DocType.TC_1]: `BIÊN BẢN
làm việc với người viết đơn tố cáo hoặc người tố cáo trực tiếp
-----
I. Thành phần tham dự (Đại diện chi ủy, chi bộ + Người tố cáo)
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…`,

    [DocType.TC_2]: `KẾ HOẠCH giải quyết tố cáo đồng chí……………
-----
I. MỤC ĐÍCH, YÊU CẦU
II. NỘI DUNG (Thành phần Tổ KT, Nhiệm vụ quyền hạn, Nội dung tố cáo, Thời gian, Phương pháp)
III. TỔ CHỨC THỰC HIỆN
T/M CHI BỘ - BÍ THƯ`,

    [DocType.TC_3]: `KẾ HOẠCH CHI TIẾT (Tổ kiểm tra giải quyết tố cáo)
-----
I. ĐỀ CƯƠNG BÁO CÁO
II. PHÂN CÔNG THÀNH VIÊN TỔ KIỂM TRA
III. LỊCH LÀM VIỆC CỦA TỔ
TỔ TRƯỞNG`,

    [DocType.TC_4]: `ĐỀ CƯƠNG GỢI Ý BÁO CÁO GIẢI TRÌNH
-----
Kính gửi: Chi bộ ……, Tổ kiểm tra.
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG`,

    [DocType.TC_5]: `BIÊN BẢN triển khai kế hoạch giải quyết tố cáo
-----
I. THÀNH PHẦN THAM DỰ
II. Nội dung
III. Diễn biến
Biên bản kết thúc…`,

    [DocType.TC_6]: `BÁO CÁO GIẢI TRÌNH
-----
Kính gửi: Chi bộ ……, Tổ kiểm tra.
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG
NGƯỜI BÁO CÁO`,

    [DocType.TC_7]: `BIÊN BẢN làm việc với đảng viên được kiểm tra
-----
I. Thành phần tham dự
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…
CHỦ TRÌ                    GHI BIÊN BẢN                    ĐẢNG VIÊN`,

    [DocType.TC_8]: `BIÊN BẢN làm việc của Tổ kiểm tra với ……(1)…..
-----
I. THÀNH PHẦN THAM DỰ
II. NỘI DUNG VÀ DIỄN BIẾN
Biên bản kết thúc…
GHI BIÊN BẢN            (1)                T/M TỔ KIỂM TRA - TỔ TRƯỞNG`,

    [DocType.TC_9]: `BÁO CÁO kết quả giải quyết tố cáo ………
-----
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG TỐ CÁO
III. KẾT QUẢ THẨM TRA, XÁC MINH
IV. NHẬN XÉT VÀ ĐỀ NGHỊ
TỔ TRƯỞNG`,

    [DocType.TC_10]: `BIÊN BẢN Hội nghị chi bộ
-----
I. THÀNH PHẦN
II. NỘI DUNG
III. DIỄN BIẾN (1. Đại diện Tổ trình bày, 2. ĐV giải trình, 3. Chi bộ thảo luận)
GHI BIÊN BẢN                                                CHỦ TRÌ`,

    [DocType.TC_11]: `THÔNG BÁO kết luận giải quyết tố cáo ……
-----
1. Ghi kết luận về từng nội dung tố cáo
2. Chi bộ yêu cầu/kiến nghị
T/M CHI BỘ - BÍ THƯ`,

    [DocType.TC_12]: `BIÊN BẢN triển khai Thông báo kết luận
-----
I. Thành phần
II. Nội dung
III. Diễn biến
Biên bản kết thúc…`,

    [DocType.TC_13]: `PHIẾU BIỂU QUYẾT đề nghị thi hành kỷ luật đối với đảng viên……...
(Đánh dấu X vào ô tương ứng: Không kỷ luật / Khiển trách / Cảnh cáo / Cách chức / Khai trừ)`,

    [DocType.TC_14]: `BIÊN BẢN Kiểm phiếu biểu quyết đề nghị thi hành kỷ luật
-----
Tổng số phiếu / phiếu hợp lệ / Kết quả: Không KL / Khiển trách / Cảnh cáo / Cách chức / Khai trừ
Thư ký                                                Tổ trưởng`,

    [DocType.TC_15]: `PHIẾU BIỂU QUYẾT thi hành kỷ luật đối với đảng viên……
(Đánh dấu X vào ô tương ứng)`,

    [DocType.TC_16]: `MỤC LỤC VÀ CHỨNG TỪ KẾT THÚC hồ sơ giải quyết tố cáo`,

    // ═══════════════════════════════════════════════════════════════
    // DẤU HIỆU VI PHẠM — DH1 → DH18
    // ═══════════════════════════════════════════════════════════════

    [DocType.DH_1]: `KẾ HOẠCH kiểm tra khi có dấu hiệu vi phạm đối với……………
-----
Căn cứ Điều lệ Đảng; Căn cứ các quy định…
I. MỤC ĐÍCH, YÊU CẦU (1. Mục đích, 2. Yêu cầu)
II. NỘI DUNG THỰC HIỆN (1. Thành phần tổ KT, 2. Nhiệm vụ quyền hạn, 3. Nội dung, 4. Thời gian, 5. Phương pháp)
III. TỔ CHỨC THỰC HIỆN
T/M CHI BỘ - BÍ THƯ`,

    [DocType.DH_2]: `KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA
-----
I. ĐỀ CƯƠNG BÁO CÁO
II. PHÂN CÔNG THÀNH VIÊN TỔ KIỂM TRA
III. LỊCH LÀM VIỆC CỦA TỔ
TỔ TRƯỞNG`,

    [DocType.DH_3]: `ĐỀ CƯƠNG BÁO CÁO
-----
Kính gửi: Chi bộ…, Tổ kiểm tra.
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG
NGƯỜI BÁO CÁO`,

    [DocType.DH_4]: `BIÊN BẢN TRIỂN KHAI KẾ HOẠCH
-----
I. THÀNH PHẦN THAM DỰ
II. Nội dung
III. Diễn biến
Biên bản kết thúc…`,

    [DocType.DH_5]: `BIÊN BẢN LÀM VIỆC VỚI TỔ CHỨC, CÁ NHÂN CÓ LIÊN QUAN
-----
I. Thành phần tham dự
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…`,

    [DocType.DH_6]: `BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN
-----
I. Thành phần tham dự
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…`,

    [DocType.DH_7]: `BÁO CÁO KẾT QUẢ KIỂM TRA
-----
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG DẤU HIỆU VI PHẠM
III. KẾT QUẢ THẨM TRA, XÁC MINH
IV. NHẬN XÉT VÀ ĐỀ NGHỊ
TỔ TRƯỞNG`,

    [DocType.DH_8]: `TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ
-----
I. THÀNH PHẦN
II. NỘI DUNG
III. DIỄN BIẾN
GHI BIÊN BẢN                                                CHỦ TRÌ`,

    [DocType.DH_9]: `THÔNG BÁO KẾT LUẬN KIỂM TRA
-----
1. Ưu điểm / 2. Hạn chế, vi phạm / 3. Chi bộ yêu cầu
T/M CHI BỘ - BÍ THƯ`,

    [DocType.DH_10]: `BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN
-----
I. Thành phần
II. Nội dung
III. Diễn biến`,

    [DocType.DH_11]: `BIÊN BẢN TRIỂN KHAI QUY TRÌNH KỶ LUẬT`,
    [DocType.DH_12]: `BIÊN BẢN KIỂM PHIẾU THI HÀNH KỶ LUẬT`,
    [DocType.DH_13]: `QUYẾT ĐỊNH KỶ LUẬT`,
    [DocType.DH_14]: `BIÊN BẢN TRIỂN KHAI QUYẾT ĐỊNH KỶ LUẬT`,
    [DocType.DH_15]: `PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT`,
    [DocType.DH_16]: `BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT`,
    [DocType.DH_17]: `PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT`,
    [DocType.DH_18]: `MỤC LỤC VÀ CHỨNG TỪ KẾT THÚC HỒ SƠ`,

    // ═══════════════════════════════════════════════════════════════
    // THI HÀNH KỶ LUẬT — KL1 → KL16
    // ═══════════════════════════════════════════════════════════════

    [DocType.KL_1]: `KẾ HOẠCH thi hành kỷ luật đảng viên……………
-----
I. MỤC ĐÍCH, YÊU CẦU
II. NỘI DUNG (Thành phần Tổ KT, Nhiệm vụ quyền hạn, Nội dung, Thời gian, Phương pháp)
III. TỔ CHỨC THỰC HIỆN
T/M CHI BỘ - BÍ THƯ`,

    [DocType.KL_2]: `KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA
-----
I. ĐỀ CƯƠNG BÁO CÁO
II. PHÂN CÔNG THÀNH VIÊN TỔ KIỂM TRA
III. LỊCH LÀM VIỆC CỦA TỔ
TỔ TRƯỞNG`,

    [DocType.KL_3]: `ĐỀ CƯƠNG BÁO CÁO KIỂM ĐIỂM
-----
Kính gửi: Chi bộ…, Tổ kiểm tra.
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG
NGƯỜI BÁO CÁO`,

    [DocType.KL_4]: `BIÊN BẢN TRIỂN KHAI KẾ HOẠCH
-----
I. THÀNH PHẦN THAM DỰ
II. Nội dung
III. Diễn biến
Biên bản kết thúc…`,

    [DocType.KL_5]: `BÁO CÁO KIỂM ĐIỂM CỦA ĐẢNG VIÊN
-----
Kính gửi: Chi bộ…, Tổ kiểm tra.
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG KIỂM ĐIỂM
NGƯỜI BÁO CÁO`,

    [DocType.KL_6]: `BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN
-----
I. Thành phần tham dự
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…`,

    [DocType.KL_7]: `BIÊN BẢN THẨM TRA, XÁC MINH
-----
I. Thành phần tham dự
II. Nội dung và diễn biến cuộc làm việc
Biên bản kết thúc…`,

    [DocType.KL_8]: `BÁO CÁO ĐỀ NGHỊ THI HÀNH KỶ LUẬT
-----
I. SƠ LƯỢC LÝ LỊCH
II. NỘI DUNG VI PHẠM
III. KẾT QUẢ THẨM TRA
IV. ĐỀ NGHỊ HÌNH THỨC KỶ LUẬT
TỔ TRƯỞNG`,

    [DocType.KL_9]: `TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ
-----
I. THÀNH PHẦN
II. NỘI DUNG
III. DIỄN BIẾN
GHI BIÊN BẢN                                                CHỦ TRÌ`,

    [DocType.KL_10]: `PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT
(Đánh dấu X vào ô tương ứng: Không KL / Khiển trách / Cảnh cáo / Cách chức / Khai trừ)`,

    [DocType.KL_11]: `BIÊN BẢN KIỂM PHIẾU THI HÀNH KỶ LUẬT
-----
Tổng số phiếu / phiếu hợp lệ / Kết quả
Thư ký                                                Tổ trưởng`,

    [DocType.KL_12]: `QUYẾT ĐỊNH KỶ LUẬT đảng viên……
-----
Căn cứ / Điều 1: Hình thức / Điều 2: Hiệu lực / Điều 3: Thực hiện
T/M CHI BỘ - BÍ THƯ`,

    [DocType.KL_13]: `BIÊN BẢN CÔNG BỐ QUYẾT ĐỊNH KỶ LUẬT
-----
I. Thành phần
II. Nội dung
III. Diễn biến
Biên bản kết thúc…`,

    [DocType.KL_14]: `PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT
(Đánh dấu X vào ô tương ứng)`,

    [DocType.KL_15]: `BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT
-----
Tổng số phiếu / phiếu hợp lệ / Kết quả
Thư ký                                                Tổ trưởng`,

    [DocType.KL_16]: `MỤC LỤC VÀ CHỨNG TỪ KẾT THÚC HỒ SƠ
Hồ sơ thi hành kỷ luật đảng viên……`,
};

/**
 * Lấy template chuẩn cho loại văn bản KTGS (nếu có).
 */
export const getKtgsTemplate = (docType: DocType): string | undefined => {
    return KTGS_TEMPLATES[docType];
};
