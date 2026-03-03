
import React, { useState, useEffect } from 'react';
import { MemberProfile } from '../types';
import { X, Save, User } from 'lucide-react';
import { useConfirm } from './ConfirmProvider';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<MemberProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
    profile?: MemberProfile | null;
}

const EMPTY_FORM: Omit<MemberProfile, 'id' | 'createdAt' | 'updatedAt'> = {
    fullName: '', gender: 'Nam', birthDate: '', birthPlace: '', homeTown: '',
    address: '', ethnicity: 'Kinh', religion: 'Không', familyBackground: 'Nông dân',
    profession: '', workplace: '', educationGeneral: '12/12', educationProfessional: '',
    politicalTheory: '', foreignLanguage: '', unionAdmissionDate: '', unionAdmissionPlace: '',
    workHistory: '', notes: ''
};

const ProfileFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, profile }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const { showAlert } = useConfirm();

    useEffect(() => {
        if (profile) {
            const { id, createdAt, updatedAt, ...rest } = profile;
            setForm(rest);
        } else {
            setForm(EMPTY_FORM);
        }
    }, [profile, isOpen]);

    if (!isOpen) return null;

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName.trim()) {
            await showAlert('Vui lòng nhập Họ và tên!', 'Thiếu thông tin', 'warning');
            return;
        }
        onSave(form);
        onClose();
    };

    const fields: { key: string; label: string; type?: string; placeholder?: string; fullWidth?: boolean }[] = [
        { key: 'fullName', label: 'Họ và tên', placeholder: 'Nguyễn Văn A' },
        { key: 'gender', label: 'Giới tính' },
        { key: 'birthDate', label: 'Ngày sinh', placeholder: '01/01/1990' },
        { key: 'birthPlace', label: 'Nơi sinh', placeholder: 'Phường An Phú, Quận 2' },
        { key: 'homeTown', label: 'Quê quán', placeholder: 'Xã..., Huyện..., Tỉnh...' },
        { key: 'address', label: 'Nơi ở hiện nay', placeholder: 'Số nhà, Đường, Phường, Quận' },
        { key: 'ethnicity', label: 'Dân tộc' },
        { key: 'religion', label: 'Tôn giáo' },
        { key: 'familyBackground', label: 'Thành phần gia đình' },
        { key: 'profession', label: 'Nghề nghiệp', placeholder: 'Giáo viên / Công nhân / ...' },
        { key: 'workplace', label: 'Đơn vị công tác', placeholder: 'Trường THPT...' },
        { key: 'educationGeneral', label: 'Trình độ văn hóa' },
        { key: 'educationProfessional', label: 'Trình độ chuyên môn', placeholder: 'Đại học / Cao đẳng ...' },
        { key: 'politicalTheory', label: 'Lý luận chính trị', placeholder: 'Sơ cấp / Trung cấp / Cao cấp' },
        { key: 'foreignLanguage', label: 'Ngoại ngữ', placeholder: 'Anh B1 / ...' },
        { key: 'unionAdmissionDate', label: 'Ngày vào Đoàn', placeholder: '26/03/2008' },
        { key: 'unionAdmissionPlace', label: 'Nơi vào Đoàn', placeholder: 'Trường THPT...' },
        { key: 'workHistory', label: 'Quá trình công tác', fullWidth: true, placeholder: 'Từ 2010-2015: Giáo viên THPT...\nTừ 2015-nay: ...' },
        { key: 'notes', label: 'Ghi chú', fullWidth: true, placeholder: 'Đảng viên được kết nạp ngày...' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wide">
                            {profile ? 'Cập nhật Hồ sơ' : 'Thêm Hồ sơ mới'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(f => (
                            <div key={f.key} className={f.fullWidth ? 'md:col-span-2' : ''}>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                    {f.label} {f.key === 'fullName' && <span className="text-red-500">*</span>}
                                </label>
                                {f.fullWidth ? (
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
                                        rows={3}
                                        value={(form as any)[f.key]}
                                        onChange={e => handleChange(f.key, e.target.value)}
                                        placeholder={f.placeholder}
                                    />
                                ) : f.key === 'gender' ? (
                                    <select
                                        className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                                        value={(form as any)[f.key]}
                                        onChange={e => handleChange(f.key, e.target.value)}
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                                        value={(form as any)[f.key]}
                                        onChange={e => handleChange(f.key, e.target.value)}
                                        placeholder={f.placeholder}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </form>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {profile ? 'Cập nhật' : 'Lưu hồ sơ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileFormModal;
