"""
Script để tạo danh sách đầy đủ các DocType cho types.ts
"""
import json
from pathlib import Path

def load_analysis():
    """Load document analysis"""
    json_path = Path(r"C:\Users\Admin\Downloads\TROLYSOANTHAOVBDANG\document_analysis.json")
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_doc_types():
    """Tạo enum DocType đầy đủ"""
    analysis = load_analysis()
    
    output = []
    
    # KIỂM TRA
    output.append("\n  // QUY TRÌNH KIỂM TRA CHUYÊN ĐỀ (KT1-KT12)")
    kt_docs = analysis["KIEM TRA HOAN CHINH"]["documents"]
    kt_docs_sorted = sorted([d for d in kt_docs if d['type'] != 'QUY TRÌNH TỔNG QUAN' and d['type'] != 'MỤC LỤC'], 
                           key=lambda x: x['filename'])
    
    for i, doc in enumerate(kt_docs_sorted, 1):
        filename = doc['filename']
        doc_type = doc['type']
        
        # Tạo tên enum
        if '1kE HOACH KIEM TRA' in filename:
            output.append(f"  KT_1 = 'KT1. KẾ HOẠCH KIỂM TRA CHUYÊN ĐỀ',")
        elif '2.1KE HOACH CUA TO' in filename:
            output.append(f"  KT_2 = 'KT2. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',")
        elif '2.2GOI Y DE CUONG' in filename:
            output.append(f"  KT_3 = 'KT3. ĐỀ CƯƠNG YÊU CẦU BÁO CÁO TỰ KIỂM TRA',")
        elif '3BIEN BAN TRIEN KHAI' in filename:
            output.append(f"  KT_4 = 'KT4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',")
        elif '4BAO CAO CUA CUA DANG VIEN' in filename:
            output.append(f"  KT_5 = 'KT5. BÁO CÁO TỰ KIỂM TRA CỦA ĐẢNG VIÊN',")
        elif '5BIEN BAN  LAM VIEC VOI DANG VIEN' in filename:
            output.append(f"  KT_6 = 'KT6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',")
        elif '6BIEN BAN  XAC MINH' in filename:
            output.append(f"  KT_7 = 'KT7. BIÊN BẢN XÁC MINH CỦA TỔ KIỂM TRA',")
        elif '7 BAO CAO KET QUA KIEM TRA' in filename:
            output.append(f"  KT_8 = 'KT8. BÁO CÁO KẾT QUẢ KIỂM TRA (TỔ KT)',")
        elif '8BIEN BAN HOI NGHI CHI BO' in filename:
            output.append(f"  KT_9 = 'KT9. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ (KT)',")
        elif '9THONG BAO KET LUAN' in filename:
            output.append(f"  KT_10 = 'KT10. THÔNG BÁO KẾT LUẬN KIỂM TRA',")
        elif '10BIEN BAN TRIEN KHAI THONG BAO' in filename:
            output.append(f"  KT_11 = 'KT11. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',")
    
    output.append(f"  KT_12 = 'KT12. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',")
    
    # GIÁM SÁT
    output.append("\n  // QUY TRÌNH GIÁM SÁT CHUYÊN ĐỀ (GS1-GS12)")
    gs_docs = analysis["GIAM SAT HOAN CHINH"]["documents"]
    gs_docs_sorted = sorted([d for d in gs_docs if d['type'] != 'QUY TRÌNH TỔNG QUAN' and d['type'] != 'MỤC LỤC'], 
                           key=lambda x: x['filename'])
    
    for i, doc in enumerate(gs_docs_sorted, 1):
        filename = doc['filename']
        
        if '1KE HOACH GIAM SAT' in filename:
            output.append(f"  GS_1 = 'GS1. KẾ HOẠCH GIÁM SÁT CHUYÊN ĐỀ',")
        elif '2-1KE HOACH CUA TO' in filename:
            output.append(f"  GS_2 = 'GS2. KẾ HOẠCH CHI TIẾT CỦA TỔ GIÁM SÁT',")
        elif '2-2GOI Y DE CUONG' in filename:
            output.append(f"  GS_3 = 'GS3. ĐỀ CƯƠNG BÁO CÁO TỰ GIÁM SÁT',")
        elif '3BIEN BAN TRIEN KHAI' in filename:
            output.append(f"  GS_4 = 'GS4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',")
        elif '4BC CUA DANG VIEN DUOC GS' in filename:
            output.append(f"  GS_5 = 'GS5. BÁO CÁO TỰ GIÁM SÁT CỦA ĐẢNG VIÊN',")
        elif '5BIEN BAN  LAM VIEC VOI DANG VIEN' in filename:
            output.append(f"  GS_6 = 'GS6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',")
        elif '6BIEN BAN  XAC MINH' in filename:
            output.append(f"  GS_7 = 'GS7. BIÊN BẢN XÁC MINH CỦA TỔ GIÁM SÁT',")
        elif '7BAO CAO KET QUA GIAM SAT' in filename:
            output.append(f"  GS_8 = 'GS8. BÁO CÁO KẾT QUẢ GIÁM SÁT (TỔ GS)',")
        elif '8BIEN BAN HOI NGHI CHI BO' in filename:
            output.append(f"  GS_9 = 'GS9. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ (GS)',")
        elif '9THONG BAO KET LUAN' in filename:
            output.append(f"  GS_10 = 'GS10. THÔNG BÁO KẾT LUẬN GIÁM SÁT',")
        elif '10BIEN BAN TRIEN KHAI THONG BAO' in filename:
            output.append(f"  GS_11 = 'GS11. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',")
    
    output.append(f"  GS_12 = 'GS12. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',")
    
    # TỐ CÁO
    output.append("\n  // QUY TRÌNH GIẢI QUYẾT TỐ CÁO (TC1-TC16)")
    tc_docs = analysis["QUY TRINH GIAI QUYET TO CAO"]["documents"]
    tc_docs_sorted = sorted([d for d in tc_docs if d['type'] != 'QUY TRÌNH TỔNG QUAN' and d['type'] != 'MỤC LỤC'], 
                           key=lambda x: x['filename'])
    
    tc_mapping = {
        '1. BB LAM VIEC VOI NGUOI TO CAO': "TC_1 = 'TC1. BIÊN BẢN LÀM VIỆC VỚI NGƯỜI TỐ CÁO',",
        '2. KE HOACH CHI BO': "TC_2 = 'TC2. KẾ HOẠCH GIẢI QUYẾT TỐ CÁO (CHI BỘ)',",
        '2.1 KE HOACH TO KIEM TRA': "TC_3 = 'TC3. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',",
        '2.2 DE CUONG GOI Y': "TC_4 = 'TC4. ĐỀ CƯƠNG BÁO CÁO GIẢI TRÌNH',",
        '3. BB TRIEN KHAI KE HOACH': "TC_5 = 'TC5. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',",
        '4. BAO CAO GIAI TRINH CUA DANG VIEN': "TC_6 = 'TC6. BÁO CÁO GIẢI TRÌNH CỦA ĐẢNG VIÊN',",
        '5. BIEN BAN LAM VIEC VOI DANG VIEN': "TC_7 = 'TC7. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',",
        '5. BB XAC MINH': "TC_8 = 'TC8. BIÊN BẢN XÁC MINH',",
        '6. BAO CAO CUA TO KIEM TRA': "TC_9 = 'TC9. BÁO CÁO KẾT QUẢ CỦA TỔ KIỂM TRA',",
        '7. BB HOI NGHI CHI BO': "TC_10 = 'TC10. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ',",
        '8.THONG BAO KET LUAN': "TC_11 = 'TC11. THÔNG BÁO KẾT LUẬN GIẢI QUYẾT TỐ CÁO',",
        '9. BB TRIEN KHAI THONG BAO KET LUAN': "TC_12 = 'TC12. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',",
        'PHIEU BIEU QUYET DE NGHI KY LUAT': "TC_13 = 'TC13. PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT',",
        'BIEN BAN KIEM PHIEU THI HANH KY LUAT': "TC_14 = 'TC14. BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT',",
        'PHIEU BIEU QUYET THI HANH KY LUAT': "TC_15 = 'TC15. PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT',",
    }
    
    for doc in tc_docs_sorted:
        filename = doc['filename']
        for key, value in tc_mapping.items():
            if key in filename:
                output.append(f"  {value}")
                break
    
    output.append(f"  TC_16 = 'TC16. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',")
    
    # DẤU HIỆU VI PHẠM
    output.append("\n  // QUY TRÌNH KIỂM TRA DẤU HIỆU VI PHẠM (DH1-DH18)")
    dh_docs = analysis["QUY TRINH KT DAU HIEU VI PHAM"]["documents"]
    dh_docs_sorted = sorted([d for d in dh_docs if d['type'] != 'QUY TRÌNH TỔNG QUAN' and d['type'] != 'MỤC LỤC'], 
                           key=lambda x: x['filename'])
    
    dh_mapping = {
        '1. KE HOACH KIEM TRA': "DH_1 = 'DH1. KẾ HOẠCH KIỂM TRA DẤU HIỆU VI PHẠM',",
        '2.1 KE HOACH CHI TIET CUA TO KIEM TRA': "DH_2 = 'DH2. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',",
        '2.2 DE CUONG BAO CAO': "DH_3 = 'DH3. ĐỀ CƯƠNG BÁO CÁO',",
        '3. BIEN BAN TRIEN KHAI KE HOACH': "DH_4 = 'DH4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',",
        '4. BIEN BAN LAM VIEC TCD, CN CO LIEN QUAN': "DH_5 = 'DH5. BIÊN BẢN LÀM VIỆC VỚI TỔ CHỨC, CÁ NHÂN LIÊN QUAN',",
        '5. BIEN BAN LAM VIEC VOI DANG VIEN': "DH_6 = 'DH6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',",
        '6. BAO CAO KET QUA KIEM TRA': "DH_7 = 'DH7. BÁO CÁO KẾT QUẢ KIỂM TRA',",
        '7. BIEN BAN HOI NGHI': "DH_8 = 'DH8. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ',",
        '8. THONG BAO KET LUAN': "DH_9 = 'DH9. THÔNG BÁO KẾT LUẬN KIỂM TRA',",
        '9. BB TRIEN KHAI THONG BAO KET LUAN': "DH_10 = 'DH10. BIÊN BẢN TRIỂN KHAI THÔNG BÁO KẾT LUẬN',",
        '10. BB TRIEN KHAI QUY TRINH KY LUAT': "DH_11 = 'DH11. BIÊN BẢN TRIỂN KHAI QUY TRÌNH KỶ LUẬT',",
        '11. BIEN BAN KIEM PHIEU THI HANH KY LUAT': "DH_12 = 'DH12. BIÊN BẢN KIỂM PHIẾU THI HÀNH KỶ LUẬT',",
        '12. QUYET DINH KY LUAT': "DH_13 = 'DH13. QUYẾT ĐỊNH KỶ LUẬT',",
        '13. BB TRIEN KHAI QUYET DINH KY LUAT': "DH_14 = 'DH14. BIÊN BẢN TRIỂN KHAI QUYẾT ĐỊNH KỶ LUẬT',",
        'PHIEU BIEU QUYET DE NGHI KY LUAT.docx': "DH_15 = 'DH15. PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT',",
        'BB KIEM PHIEU DE NGHI THI HANH KY LUAT': "DH_16 = 'DH16. BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT',",
        'PHIEU BIEU QUYET THI HANH KY LUAT.docx': "DH_17 = 'DH17. PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT',",
    }
    
    for doc in dh_docs_sorted:
        filename = doc['filename']
        for key, value in dh_mapping.items():
            if key in filename:
                output.append(f"  {value}")
                break
    
    output.append(f"  DH_18 = 'DH18. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ',")
    
    # KỶ LUẬT
    output.append("\n  // QUY TRÌNH THI HÀNH KỶ LUẬT (KL1-KL16)")
    kl_docs = analysis["QUY TRINH THI HANH KY LUAT"]["documents"]
    kl_docs_sorted = sorted([d for d in kl_docs if d['type'] != 'QUY TRÌNH TỔNG QUAN' and d['type'] != 'MỤC LỤC'], 
                           key=lambda x: x['filename'])
    
    kl_mapping = {
        '1. KE HOACH CHI BO': "KL_1 = 'KL1. KẾ HOẠCH THI HÀNH KỶ LUẬT (CHI BỘ)',",
        '2.1 KE HOACH CUA TO KIEM TRA': "KL_2 = 'KL2. KẾ HOẠCH CHI TIẾT CỦA TỔ KIỂM TRA',",
        '2.2 DE CUONG BAO CAO': "KL_3 = 'KL3. ĐỀ CƯƠNG BÁO CÁO KIỂM ĐIỂM',",
        '3. BIEN BAN TRIEN KHAI': "KL_4 = 'KL4. BIÊN BẢN TRIỂN KHAI KẾ HOẠCH',",
        '4. BAO CAO KIEM DIEM DANG VIEN': "KL_5 = 'KL5. BÁO CÁO KIỂM ĐIỂM CỦA ĐẢNG VIÊN',",
        '5.1 BIEN BAN LAM VIEC VOI DANG VIEN': "KL_6 = 'KL6. BIÊN BẢN LÀM VIỆC VỚI ĐẢNG VIÊN',",
        '5.2 BIEN BAN THAM TRA, XAC MINH': "KL_7 = 'KL7. BIÊN BẢN THẨM TRA, XÁC MINH',",
        '6. BC DE NGHI THI HANH KY LUAT': "KL_8 = 'KL8. BÁO CÁO ĐỀ NGHỊ THI HÀNH KỶ LUẬT',",
        '7. BB HN CHI BO': "KL_9 = 'KL9. TRÍCH BIÊN BẢN HỘI NGHỊ CHI BỘ',",
        '9. PHIEU BIEU QUYET THI HANH KY LUAT': "KL_10 = 'KL10. PHIẾU BIỂU QUYẾT THI HÀNH KỶ LUẬT',",
        '10. BIEN BAN KIEM PHIEU THI HANH KY LUAT': "KL_11 = 'KL11. BIÊN BẢN KIỂM PHIẾU THI HÀNH KỶ LUẬT',",
        '11. QUYET DINH KY LUAT': "KL_12 = 'KL12. QUYẾT ĐỊNH KỶ LUẬT',",
        '12. BIEN BAN CONG BO QUYET DINH': "KL_13 = 'KL13. BIÊN BẢN CÔNG BỐ QUYẾT ĐỊNH KỶ LUẬT',",
        'PHIEU BIEU QUYET DE NGHI KY LUAT.docx': "KL_14 = 'KL14. PHIẾU BIỂU QUYẾT ĐỀ NGHỊ KỶ LUẬT',",
        '13.BB KIEM PHIEU DE NGHI THI HANH KY LUAT': "KL_15 = 'KL15. BIÊN BẢN KIỂM PHIẾU ĐỀ NGHỊ KỶ LUẬT',",
    }
    
    for doc in kl_docs_sorted:
        filename = doc['filename']
        for key, value in kl_mapping.items():
            if key in filename:
                output.append(f"  {value}")
                break
    
    output.append(f"  KL_16 = 'KL16. MỤC LỤC & CHỨNG TỪ KẾT THÚC HỒ SƠ'")
    
    return '\n'.join(output)

def create_audit_tabs_mapping():
    """Tạo AUDIT_TABS_MAPPING"""
    output = []
    
    output.append("export const AUDIT_TABS_MAPPING: Record<AuditTab, DocType[]> = {")
    output.append("  [AuditTab.KIEM_TRA]: [")
    for i in range(1, 13):
        output.append(f"    DocType.KT_{i},")
    output.append("  ],")
    
    output.append("  [AuditTab.GIAM_SAT]: [")
    for i in range(1, 13):
        output.append(f"    DocType.GS_{i},")
    output.append("  ],")
    
    output.append("  [AuditTab.TO_CAO]: [")
    for i in range(1, 17):
        output.append(f"    DocType.TC_{i},")
    output.append("  ],")
    
    output.append("  [AuditTab.DAU_HIEU_VP]: [")
    for i in range(1, 19):
        output.append(f"    DocType.DH_{i},")
    output.append("  ],")
    
    output.append("  [AuditTab.KY_LUAT]: [")
    for i in range(1, 17):
        output.append(f"    DocType.KL_{i},")
    output.append("  ]")
    
    output.append("};")
    
    return '\n'.join(output)

def main():
    print("Tạo danh sách DocType đầy đủ...")
    
    doc_types = create_doc_types()
    audit_mapping = create_audit_tabs_mapping()
    
    output_path = Path(r"C:\Users\Admin\Downloads\TROLYSOANTHAOVBDANG\new_doc_types.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("// ===== ENUM DOC_TYPE =====\n\n")
        f.write(doc_types)
        f.write("\n\n// ===== AUDIT_TABS_MAPPING =====\n\n")
        f.write(audit_mapping)
    
    print(f"\n✓ Đã tạo file: {output_path}")
    print("\nTổng số văn bản:")
    print("- KIỂM TRA: 12")
    print("- GIÁM SÁT: 12")
    print("- TỐ CÁO: 16")
    print("- DẤU HIỆU VI PHẠM: 18")
    print("- KỶ LUẬT: 16")
    print("TỔNG: 74 văn bản")

if __name__ == "__main__":
    main()
