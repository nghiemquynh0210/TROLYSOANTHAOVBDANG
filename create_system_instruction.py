"""
Script để phân tích chi tiết các file mẫu và tạo system instruction cho AI
"""
import json
from pathlib import Path

def load_extracted_data():
    """Load dữ liệu đã trích xuất"""
    json_path = Path(r"C:\Users\Admin\Downloads\TROLYSOANTHAOVBDANG\extracted_templates\all_documents.json")
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_document_structure(data):
    """Phân tích cấu trúc của từng loại văn bản"""
    analysis = {}
    
    for process_name, process_data in data.items():
        print(f"\n{'='*60}")
        print(f"Phân tích: {process_name}")
        print(f"{'='*60}")
        
        process_analysis = {
            "name": process_name,
            "total_files": len(process_data['files']),
            "documents": []
        }
        
        for file_data in process_data['files']:
            filename = file_data['filename']
            content = file_data['content']
            
            # Phân tích cấu trúc
            doc_analysis = {
                "filename": filename,
                "type": identify_document_type(filename),
                "has_header": "ĐẢNG CỘNG SẢN VIỆT NAM" in content,
                "has_signature": "BÍ THƯ" in content or "TỔ TRƯỞNG" in content,
                "has_date": "ngày" in content and "tháng" in content,
                "key_sections": extract_key_sections(content),
                "placeholders": extract_placeholders(content),
                "structure_notes": analyze_structure_notes(filename, content)
            }
            
            process_analysis["documents"].append(doc_analysis)
            
            print(f"\n{filename}:")
            print(f"  Loại: {doc_analysis['type']}")
            print(f"  Số placeholder: {len(doc_analysis['placeholders'])}")
            print(f"  Các phần chính: {', '.join(doc_analysis['key_sections'][:5])}")
        
        analysis[process_name] = process_analysis
    
    return analysis

def identify_document_type(filename):
    """Xác định loại văn bản"""
    filename_lower = filename.lower()
    
    if 'ke hoach' in filename_lower or 'kế hoạch' in filename_lower:
        if 'chi tiet' in filename_lower or 'to' in filename_lower:
            return "KẾ HOẠCH CHI TIẾT CỦA TỔ"
        return "KẾ HOẠCH"
    elif 'bien ban' in filename_lower or 'biên bản' in filename_lower:
        if 'trien khai' in filename_lower:
            return "BIÊN BẢN TRIỂN KHAI"
        elif 'lam viec' in filename_lower or 'làm việc' in filename_lower:
            return "BIÊN BẢN LÀM VIỆC"
        elif 'xac minh' in filename_lower or 'xác minh' in filename_lower:
            return "BIÊN BẢN XÁC MINH"
        elif 'hoi nghi' in filename_lower or 'hội nghị' in filename_lower:
            return "BIÊN BẢN HỘI NGHỊ"
        elif 'kiem phieu' in filename_lower or 'kiểm phiếu' in filename_lower:
            return "BIÊN BẢN KIỂM PHIẾU"
        return "BIÊN BẢN"
    elif 'bao cao' in filename_lower or 'báo cáo' in filename_lower:
        return "BÁO CÁO"
    elif 'thong bao' in filename_lower or 'thông báo' in filename_lower:
        return "THÔNG BÁO"
    elif 'de cuong' in filename_lower or 'đề cương' in filename_lower:
        return "ĐỀ CƯƠNG"
    elif 'phieu' in filename_lower or 'phiếu' in filename_lower:
        return "PHIẾU BIỂU QUYẾT"
    elif 'quyet dinh' in filename_lower or 'quyết định' in filename_lower:
        return "QUYẾT ĐỊNH"
    elif 'quy trinh' in filename_lower:
        return "QUY TRÌNH TỔNG QUAN"
    elif 'muc luc' in filename_lower or 'mục lục' in filename_lower:
        return "MỤC LỤC"
    return "KHÁC"

def extract_key_sections(content):
    """Trích xuất các phần chính"""
    sections = []
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        # Tìm các tiêu đề phần (thường là chữ in hoa hoặc có số La Mã/Ả Rập)
        if line and (
            line.isupper() or 
            line.startswith('I.') or line.startswith('II.') or line.startswith('III.') or
            line.startswith('1.') or line.startswith('2.') or line.startswith('3.')
        ):
            if len(line) < 100:  # Không phải đoạn văn dài
                sections.append(line)
    
    return sections[:10]  # Lấy 10 phần đầu

def extract_placeholders(content):
    """Trích xuất các placeholder (chỗ cần điền)"""
    import re
    placeholders = []
    
    # Tìm các pattern như: …., ……, ………, [nội dung trong ngoặc]
    patterns = [
        r'\.{2,}',  # Dấu chấm liên tiếp
        r'\[.*?\]',  # Nội dung trong ngoặc vuông
        r'\(.*?\)',  # Nội dung trong ngoặc đơn có chứa "ghi", "nêu", etc
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content)
        placeholders.extend(matches)
    
    # Loại bỏ trùng lặp
    return list(set(placeholders))[:20]  # Lấy 20 placeholder đầu

def analyze_structure_notes(filename, content):
    """Phân tích ghi chú về cấu trúc"""
    notes = []
    
    # Kiểm tra có phần nơi nhận không
    if "Nơi nhận:" in content:
        notes.append("Có phần 'Nơi nhận'")
    
    # Kiểm tra có số văn bản không
    if "Số" in content and "-" in content:
        notes.append("Có số văn bản")
    
    # Kiểm tra có bảng không
    if "Stt" in content or "STT" in content:
        notes.append("Có bảng")
    
    # Kiểm tra có phần ký tên không
    if "Ký tên" in content or "(Ký tên)" in content:
        notes.append("Có chỗ ký tên")
    
    return notes

def create_system_instruction(analysis):
    """Tạo system instruction từ phân tích"""
    
    instruction = """# SYSTEM INSTRUCTION - TRỢ LÝ SOẠN THẢO VĂN BẢN ĐẢNG

## VAI TRÒ
Bạn là trợ lý AI chuyên nghiệp, hỗ trợ Bí thư Chi bộ soạn thảo văn bản Đảng theo đúng quy trình và quy định của Đảng Cộng sản Việt Nam.

## NGUYÊN TẮC SOẠN THẢO

### 1. Tuân thủ nghiêm ngặt
- Tuân thủ 100% quy trình 11 bước chuẩn
- Tuân thủ cấu trúc văn bản theo mẫu
- Tuân thủ văn phong hành chính Đảng

### 2. Văn phong
- Trang trọng, nghiêm túc
- Súc tích, rõ ràng, chính xác
- Khách quan, công tâm
- Không dùng từ ngữ cảm tính
- Sử dụng thuật ngữ Đảng chính xác

### 3. Cấu trúc chuẩn
Mỗi văn bản phải có đầy đủ:
- Tiêu đề (tên văn bản)
- Dấu gạch ngang (-----)
- Nội dung chính (có phân mục I, II, III...)
- Phần cuối: Đảng bộ, Chi bộ, Số văn bản, Ngày tháng
- Chữ ký: Bí thư/Tổ trưởng/Người báo cáo

## CÁC QUY TRÌNH CHUẨN

"""
    
    # Thêm chi tiết từng quy trình
    process_order = [
        "KIEM TRA HOAN CHINH",
        "GIAM SAT HOAN CHINH",
        "QUY TRINH GIAI QUYET TO CAO",
        "QUY TRINH KT DAU HIEU VI PHAM",
        "QUY TRINH THI HANH KY LUAT"
    ]
    
    for process_key in process_order:
        if process_key in analysis:
            process_data = analysis[process_key]
            instruction += f"\n### {process_data['name']}\n\n"
            instruction += f"**Tổng số văn bản:** {process_data['total_files']} files\n\n"
            instruction += "**Các văn bản theo thứ tự:**\n\n"
            
            # Sắp xếp theo tên file
            sorted_docs = sorted(process_data['documents'], key=lambda x: x['filename'])
            
            for i, doc in enumerate(sorted_docs, 1):
                if doc['type'] != "KHÁC" and doc['type'] != "MỤC LỤC":
                    instruction += f"{i}. **{doc['type']}** (`{doc['filename']}`)\n"
                    if doc['structure_notes']:
                        instruction += f"   - {', '.join(doc['structure_notes'])}\n"
    
    instruction += """

## QUY TẮC SOẠN THẢO CHI TIẾT

### Kế hoạch (KH)
- Phải có: Mục đích, yêu cầu; Nội dung; Tổ chức thực hiện
- Phải xác định rõ: Thành phần tổ, nhiệm vụ, quyền hạn, thời gian, địa điểm
- Số văn bản: …-KH/CB

### Biên bản (BB)
- Bắt đầu: "Vào lúc, ……giờ…..phút, ngày…../…./……"
- Phải có: I. Thành phần tham dự; II. Nội dung; III. Diễn biến
- Kết thúc: "Biên bản kết thúc vào lúc….giờ….phút, ngày …./…../….."
- Phải có chữ ký: Chủ trì, Ghi biên bản, và các bên liên quan

### Báo cáo (BC)
- Phải có: Họ tên, chức vụ người báo cáo
- Cấu trúc: I. Nội dung báo cáo; II. Tự nhận xét và kiến nghị
- Tự nhận xét gồm: Ưu điểm; Hạn chế, nguyên nhân
- Kết thúc: "Trên đây là báo cáo... Xin báo cáo Chi bộ xem xét."

### Thông báo (TB)
- Số văn bản: …-TB/CB
- Phải nêu rõ: Nội dung đã kiểm tra/giám sát, kết luận (ưu điểm, hạn chế), yêu cầu
- Có "Nơi nhận" ở cuối
- Chữ ký: T/M CHI BỘ - BÍ THƯ

### Phiếu biểu quyết
- Dùng khi cần biểu quyết kỷ luật
- Có các lựa chọn: Đồng ý, Không đồng ý, Không có ý kiến
- Phải ghi rõ họ tên người biểu quyết

## XỬ LÝ DỮ LIỆU NGƯỜI DÙNG

### Khi người dùng nhập dữ liệu thô:
1. Phân tích xác định loại văn bản cần soạn
2. Trích xuất thông tin: tên đảng viên, nội dung kiểm tra/giám sát, thời gian, địa điểm
3. Bổ sung thông tin từ metadata (đảng bộ, chi bộ, ngày tháng)
4. Triển khai thành văn bản đầy đủ theo mẫu chuẩn

### Nguyên tắc bổ sung nội dung:
- Nếu người dùng chỉ nêu ý chính → Triển khai thành đoạn văn đầy đủ
- Nếu thiếu chi tiết → Bổ sung hợp lý dựa trên ngữ cảnh
- Nếu có dấu ba chấm (...) → KHÔNG ĐƯỢC để nguyên, phải hoàn thiện
- Luôn đảm bảo văn bản hoàn chỉnh, không có chỗ trống

### Ví dụ xử lý:
**Input:** "Kiểm tra đ/c Nguyễn Văn A về đạo đức lối sống từ tháng 1 đến tháng 6/2026"

**Output:** Soạn đầy đủ Kế hoạch kiểm tra với:
- Mục đích: Đánh giá đúng ưu điểm, hạn chế của đảng viên trong việc thực hiện đạo đức lối sống...
- Nội dung: Kiểm tra việc thực hiện đạo đức lối sống của đồng chí Nguyễn Văn A...
- Thời gian: Mốc thời gian từ tháng 01/2026 đến tháng 06/2026
- Và tất cả các phần khác theo mẫu chuẩn

## LƯU Ý QUAN TRỌNG

1. **KHÔNG BAO GIỜ** để dấu ba chấm (...) trong văn bản
2. **LUÔN LUÔN** hoàn thiện đầy đủ mọi phần
3. **PHẢI** sử dụng đúng số văn bản (-KH/CB, -TB/CB, etc.)
4. **PHẢI** có đầy đủ chữ ký và ngày tháng
5. **PHẢI** tuân thủ cấu trúc mẫu 100%

## TRÍCH DẪN QUY ĐỊNH

Khi cần, trích dẫn:
- Quy định số 22-QĐ/TW (về kiểm tra, giám sát)
- Quy định số 37-QĐ/TW (về những điều đảng viên không được làm)
- Quy định số 102-QĐ/TW (về kỷ luật đảng)

---

Hãy soạn thảo văn bản chuyên nghiệp, chính xác, đầy đủ theo đúng quy trình và mẫu chuẩn!
"""
    
    return instruction

def save_system_instruction(instruction):
    """Lưu system instruction"""
    output_path = Path(r"C:\Users\Admin\Downloads\TROLYSOANTHAOVBDANG\system_instruction_full.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(instruction)
    print(f"\n✓ Đã lưu system instruction: {output_path}")
    return str(output_path)

def main():
    print("="*60)
    print("PHÂN TÍCH VÀ TẠO SYSTEM INSTRUCTION")
    print("="*60)
    
    # Load dữ liệu
    print("\n1. Đang load dữ liệu đã trích xuất...")
    data = load_extracted_data()
    
    # Phân tích
    print("\n2. Đang phân tích cấu trúc văn bản...")
    analysis = analyze_document_structure(data)
    
    # Tạo system instruction
    print("\n3. Đang tạo system instruction...")
    instruction = create_system_instruction(analysis)
    
    # Lưu file
    print("\n4. Đang lưu file...")
    output_path = save_system_instruction(instruction)
    
    # Lưu analysis ra JSON
    analysis_path = Path(r"C:\Users\Admin\Downloads\TROLYSOANTHAOVBDANG\document_analysis.json")
    with open(analysis_path, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"✓ Đã lưu phân tích: {analysis_path}")
    
    print("\n" + "="*60)
    print("HOÀN THÀNH!")
    print("="*60)
    print(f"\nSystem instruction: {output_path}")
    print(f"Document analysis: {analysis_path}")
    print(f"\nĐộ dài instruction: {len(instruction):,} ký tự")

if __name__ == "__main__":
    main()
