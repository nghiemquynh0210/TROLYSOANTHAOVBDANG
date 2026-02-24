
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DocType,
  DocLevel,
  AuditTab,
  MemberProfile,
  LEVEL_PERMISSION_MAPPING,
  AUDIT_TABS_MAPPING
} from './types';
import { getDocPlaceholder } from './data/docPlaceholders';
import { generateDraftContent, DocMetadata } from './services/geminiService';
import { exportToDocx, formatFileName } from './services/wordService';
import { exportToPdf } from './services/pdfService';
import WorkflowModal from './components/WorkflowModal';
import ProfileManager from './components/ProfileManager';
import AdmissionDashboard from './components/AdmissionDashboard';
import CompliancePanel from './components/CompliancePanel';
import RegulationLibrary from './components/RegulationLibrary';
import MeetingAssistant from './components/MeetingAssistant';
import ScheduleReminder from './components/ScheduleReminder';
import PartyFeeAssistant from './components/PartyFeeAssistant';
import CommentAssistant from './components/CommentAssistant';
import DocumentDashboard from './components/DocumentDashboard';
import AuthPage from './components/AuthPage';
import PendingApproval from './components/PendingApproval';
import AdminApproval from './components/AdminApproval';
import { scheduleService } from './services/scheduleService';
import { saveDocument, generateTitle } from './services/documentService';
import { onAuthStateChange, signOut, getSession, type AuthUser } from './services/authService';
import { getMyProfile, type UserProfile } from './services/userProfileService';
import './styles/workflow.css';
import {
  ShieldCheck,
  Layers,
  Zap,
  Users,
  Briefcase,
  UserPlus,
  FileBadge,
  SearchCheck,
  History,
  FileText,
  FileDown,
  ChevronRight,
  Stamp,
  RefreshCw,
  UserCheck,
  Sparkles,
  Wand2,
  X,
  User,
  Award,
  Clock,
  FileCheck,
  Target,
  Gavel,
  Timer,
  BookOpenCheck,
  Scale,
  Search,
  CheckCircle2,
  AlertOctagon,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
  Fingerprint,
  HandMetal,
  Hammer,
  Eye,
  SearchCode,
  Files,
  Settings,
  Database,
  LayoutDashboard,
  PenTool,
  BookOpen,
  Mic,
  CalendarDays,
  Bell,
  Wallet,
  MessageSquareText,
  LogOut
} from 'lucide-react';

type AppView = 'editor' | 'profiles' | 'dashboard' | 'compliance' | 'regulations' | 'meeting' | 'comments' | 'schedule' | 'partyfee' | 'docs' | 'admin';

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [docLevel, setDocLevel] = useState<DocLevel>(DocLevel.LEVEL_2);
  const [docType, setDocType] = useState<DocType>(DocType.MONTHLY_RESOLUTION);
  const [auditTab, setAuditTab] = useState<AuditTab>(AuditTab.GIAM_SAT);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('editor');
  const [scheduleBadge, setScheduleBadge] = useState(0);
  const [apiKey, setApiKey] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Load saved admin context from localStorage
  const savedCtx = (() => {
    try {
      const raw = localStorage.getItem('admin_context');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [metadata, setMetadata] = useState<DocMetadata & { auditTarget?: string; auditContent?: string }>({
    superiorParty: savedCtx?.superiorParty || '',
    branchName: savedCtx?.branchName || '',
    locationDate: savedCtx?.locationDate || '',
    level: DocLevel.LEVEL_2,
    meetingTime: '19 giờ 00 phút, ngày 03 tháng 02 năm 2026',
    meetingLocation: 'Văn phòng Khu phố 3, phường An Phú',
    totalMembers: '45',
    presentMembers: '42',
    absentMembers: '03',
    absentReasons: '02 có lý do, 01 đi làm ăn xa',
    chairpersonName: 'Nghiêm Xuân Quỳnh',
    chairpersonRole: 'Bí thư Chi bộ',
    secretaryName: 'Dương Tấn Đạt',
    auditTarget: '',
    auditContent: ''
  });

  const [rawInput, setRawInput] = useState<string>('');
  const [generatedDoc, setGeneratedDoc] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuditLevel = docLevel === DocLevel.LEVEL_AUDIT;

  const allowedDocTypes = useMemo(() => {
    if (isAuditLevel) {
      return AUDIT_TABS_MAPPING[auditTab];
    }
    return LEVEL_PERMISSION_MAPPING[docLevel];
  }, [docLevel, auditTab, isAuditLevel]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    getSession().then(session => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });
    try {
      const { data: { subscription } } = onAuthStateChange(user => {
        setAuthUser(user);
        setAuthLoading(false);
      });
      return () => subscription.unsubscribe();
    } catch {
      setAuthLoading(false);
    }
  }, []);

  // Load user profile for approval check
  useEffect(() => {
    if (authUser) {
      setProfileLoading(true);
      getMyProfile().then(p => {
        setUserProfile(p);
        setProfileLoading(false);
      }).catch(() => setProfileLoading(false));
    } else {
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [authUser]);

  const refreshProfile = () => {
    getMyProfile().then(p => setUserProfile(p));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSampleMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!allowedDocTypes.includes(docType)) {
      setDocType(allowedDocTypes[0]);
    }
    setMetadata(prev => ({ ...prev, level: docLevel }));
  }, [docLevel, auditTab, allowedDocTypes]);

  const gsLibrary = [
    { group: "1. QUY TRÌNH GIÁM SÁT", items: [{ title: "Lập bộ hồ sơ GS", icon: <Eye className="w-3 h-3 text-blue-500" />, content: "Lập hồ sơ giám sát đảng viên [Tên] về việc chấp hành Quy định 37-QĐ/TW. Quy trình gồm 11 bước từ Kế hoạch đến Lưu trữ." }] },
    { group: "2. QUY TRÌNH KIỂM TRA", items: [{ title: "Lập bộ hồ sơ KT", icon: <SearchCode className="w-3 h-3 text-red-500" />, content: "Lập bộ hồ sơ kiểm tra cho đảng viên [Tên] về việc thực hiện chức trách nhiệm vụ được giao. Quy trình 11 mẫu văn bản chuẩn." }] },
    { group: "3. GIẢI QUYẾT TỐ CÁO", items: [{ title: "Tiếp nhận đơn thư", icon: <AlertTriangle className="w-3 h-3 text-amber-500" />, content: "Quy trình giải quyết đơn tố cáo đối với đảng viên có dấu hiệu vi phạm nguyên tắc tập trung dân chủ." }] },
    { group: "4. DẤU HIỆU VI PHẠM", items: [{ title: "Kiểm tra DHVP", icon: <Fingerprint className="w-3 h-3 text-slate-800" />, content: "Kiểm tra đảng viên khi có dấu hiệu vi phạm trong việc quản lý tài chính, quỹ đảng viên." }] },
    { group: "5. THI HÀNH KỶ LUẬT", items: [{ title: "Xét kỷ luật", icon: <Gavel className="w-3 h-3 text-red-700" />, content: "Tiến hành quy trình xem xét, thi hành kỷ luật đối với đảng viên vi phạm chính sách dân số kế hoạch hóa gia đình." }] }
  ];

  const currentGroups = useMemo(() => {
    if (isAuditLevel) return gsLibrary;
    return [{ group: "GỢI Ý CHUNG", items: [{ title: "Nội dung nghiệp vụ", icon: <History className="w-3 h-3" />, content: "Nhập các tình tiết thực tế, AI sẽ tự triển khai thành văn bản hoàn chỉnh." }] }];
  }, [docLevel, isAuditLevel]);

  const handleSelectSample = (content: string) => {
    setRawInput(prev => prev ? prev + "\n" + content : content);
    setShowSampleMenu(false);
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setConnectionStatus('idle');
      alert('API Key đã được lưu thành công!');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      alert('Vui lòng nhập API Key trước khi test!');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      // Test with a simple prompt
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Test connection",
        config: {
          temperature: 0.1,
        },
      });

      setConnectionStatus('success');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');

      // Parse error message
      let errorMsg = 'Kết nối thất bại. Vui lòng kiểm tra lại API Key.';

      if (error?.message) {
        if (error.message.includes('API key not valid')) {
          errorMsg = 'API Key không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
          errorMsg = 'Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau hoặc sử dụng API key khác.';
        } else {
          errorMsg = `Lỗi: ${error.message.substring(0, 100)}`;
        }
      }

      setErrorMessage(errorMsg);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDraftContent(docType, rawInput, metadata);
      setGeneratedDoc(result);
      // Auto-save to document history
      saveDocument({
        title: generateTitle(docType, result),
        docType,
        docLevel: docLevel,
        content: result,
        rawInput,
        metadata: metadata as unknown as Record<string, string>
      });
    } catch (err) {
      setError("Lỗi kết nối AI hoặc nghiệp vụ.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPdf = async () => {
    if (!generatedDoc) return;
    setIsExportingPdf(true);
    try {
      const fileName = formatFileName(docType, metadata.branchName).replace('.docx', '.pdf');
      await exportToPdf('printable-document', fileName);
    } catch (err) {
      setError("Lỗi xuất PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportWord = async () => {
    if (!generatedDoc) return;
    setIsExportingWord(true);
    try {
      const fileName = formatFileName(docType, metadata.branchName);
      await exportToDocx(generatedDoc, fileName, metadata.superiorParty, docType);
    } catch (err) {
      setError("Lỗi xuất Word.");
    } finally {
      setIsExportingWord(false);
    }
  };

  const getLevelStyle = (level: DocLevel) => {
    switch (level) {
      case DocLevel.LEVEL_1: return { color: 'bg-indigo-700', icon: <Briefcase className="w-5 h-5 mb-1" /> };
      case DocLevel.LEVEL_2: return { color: 'bg-[#b91c1c]', icon: <Users className="w-5 h-5 mb-1" /> };
      case DocLevel.LEVEL_3: return { color: 'bg-orange-600', icon: <Zap className="w-5 h-5 mb-1" /> };
      case DocLevel.LEVEL_AUDIT: return { color: 'bg-slate-900', icon: <ShieldCheck className="w-5 h-5 mb-1" /> };
      case DocLevel.LEVEL_ADMISSION: return { color: 'bg-blue-700', icon: <UserPlus className="w-5 h-5 mb-1" /> };
      case DocLevel.LEVEL_DEV: return { color: 'bg-emerald-700', icon: <Stamp className="w-5 h-5 mb-1" /> };
      default: return { color: 'bg-gray-600', icon: <Layers className="w-5 h-5 mb-1" /> };
    }
  };

  const currentStyle = getLevelStyle(docLevel);

  const handleDraftFromProfile = (profile: MemberProfile, selectedDocType?: DocType, extraInfo?: string) => {
    const chosenDoc = selectedDocType || DocType.KN_MAU_3;
    // CT_MAU_10..16 → chuyển đảng chính thức, others → kết nạp
    const isCT = chosenDoc.startsWith('MẪU 1') && parseInt(chosenDoc.split('MẪU ')[1]) >= 10
      || chosenDoc.includes('KIỂM ĐIỂM DỰ BỊ')
      || chosenDoc.includes('CÔNG NHẬN CHÍNH THỨC')
      || chosenDoc.includes('HỒ SƠ CHÍNH THỨC')
      || chosenDoc.includes('NHẬN XÉT NGƯỜI GIÚP ĐỠ')
      || [DocType.CT_MAU_10, DocType.CT_MAU_11, DocType.CT_MAU_12, DocType.CT_MAU_13, DocType.CT_MAU_14, DocType.CT_MAU_15, DocType.CT_MAU_16].includes(chosenDoc);
    setActiveView('editor');
    setDocLevel(isCT ? DocLevel.LEVEL_DEV : DocLevel.LEVEL_ADMISSION);
    setDocType(chosenDoc);
    const prefill = `${extraInfo ? `BỐI CẢNH SOẠN THẢO: ${extraInfo}\n\n` : ''}HỒ SƠ ĐẢNG VIÊN/QUẦN CHÚNG (TỰ ĐỘNG TỪ KHO LƯU TRỮ):
- Họ và tên: ${profile.fullName}
- Giới tính: ${profile.gender}
- Ngày sinh: ${profile.birthDate}
- Nơi sinh: ${profile.birthPlace}
- Quê quán: ${profile.homeTown}
- Nơi ở hiện nay: ${profile.address}
- Dân tộc: ${profile.ethnicity}
- Tôn giáo: ${profile.religion}
- Thành phần gia đình: ${profile.familyBackground}
- Nghề nghiệp: ${profile.profession}
- Đơn vị công tác: ${profile.workplace}
- Trình độ văn hóa: ${profile.educationGeneral}
- Trình độ chuyên môn: ${profile.educationProfessional}
- Lý luận chính trị: ${profile.politicalTheory}
- Ngoại ngữ: ${profile.foreignLanguage}
- Ngày vào Đoàn: ${profile.unionAdmissionDate}
- Nơi vào Đoàn: ${profile.unionAdmissionPlace}
- Quá trình công tác: ${profile.workHistory}

Người dùng bổ sung nhận xét mới nhất tại đây: ...`;
    setRawInput(prefill);
  };

  const handleSendToEditor = (text: string) => {
    setActiveView('editor');
    setRawInput(text);
  };

  useEffect(() => {
    const count = scheduleService.getBadgeCount();
    setScheduleBadge(count);
    const interval = setInterval(() => setScheduleBadge(scheduleService.getBadgeCount()), 60000);
    return () => clearInterval(interval);
  }, [activeView]);

  return (
    authLoading || profileLoading ? (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
        <div className="text-white/50 text-sm font-bold animate-pulse">Đang tải...</div>
      </div>
    ) : !authUser ? (
      <AuthPage onAuthSuccess={() => { }} />
    ) : userProfile && !userProfile.approved ? (
      <PendingApproval email={authUser.email || ''} onRefresh={refreshProfile} />
    ) : (
      <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
        <header className={`${{
          editor: currentStyle.color, profiles: 'bg-blue-800', dashboard: 'bg-emerald-800',
          compliance: 'bg-slate-800', regulations: 'bg-purple-800', meeting: 'bg-rose-800',
          comments: 'bg-indigo-800', schedule: 'bg-teal-800',
          partyfee: 'bg-amber-800', docs: 'bg-cyan-800', admin: 'bg-violet-800'
        }[activeView]} text-white px-6 py-4 shadow-xl flex items-center justify-between border-b-4 border-yellow-500 sticky top-0 z-40 transition-all duration-500`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md shadow-inner">
              {{
                editor: currentStyle.icon, profiles: <Database className="w-5 h-5" />,
                dashboard: <LayoutDashboard className="w-5 h-5" />, compliance: <ShieldCheck className="w-5 h-5" />,
                regulations: <BookOpen className="w-5 h-5" />, meeting: <Mic className="w-5 h-5" />,
                comments: <MessageSquareText className="w-5 h-5" />,
                schedule: <CalendarDays className="w-5 h-5" />,
                partyfee: <Wallet className="w-5 h-5" />,
                docs: <Files className="w-5 h-5" />,
                admin: <Users className="w-5 h-5" />
              }[activeView]}
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none mb-1">
                Trợ lý Bí thư Chi bộ
              </h1>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                {{
                  editor: `Phân hệ: ${docLevel}`, profiles: 'Kho hồ sơ Đảng viên', dashboard: 'Lộ trình kết nạp',
                  compliance: 'Kiểm tra tuân thủ quy trình', regulations: 'Thư viện quy định Đảng',
                  meeting: 'Trợ lý biên bản cuộc họp', comments: 'Trợ lý gợi ý nhận xét chuẩn văn phong Đảng',
                  schedule: 'Nhắc lịch sinh hoạt',
                  partyfee: 'Trợ lý đảng phí — QĐ 01-QĐ/TW',
                  docs: 'Kho văn bản đã soạn thảo',
                  admin: 'Quản lý & Phê duyệt tài khoản'
                }[activeView]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation Tabs */}
            <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-md flex-wrap gap-0.5">
              {([
                { key: 'editor' as AppView, icon: <PenTool className="w-3.5 h-3.5" />, label: 'Soạn thảo' },
                { key: 'profiles' as AppView, icon: <Database className="w-3.5 h-3.5" />, label: 'Hồ sơ' },
                { key: 'dashboard' as AppView, icon: <LayoutDashboard className="w-3.5 h-3.5" />, label: 'Lộ trình' },
                { key: 'compliance' as AppView, icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Tuân thủ' },
                { key: 'regulations' as AppView, icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Quy định' },
                { key: 'meeting' as AppView, icon: <Mic className="w-3.5 h-3.5" />, label: 'Biên bản' },
                { key: 'comments' as AppView, icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Gợi ý' },
                { key: 'schedule' as AppView, icon: <CalendarDays className="w-3.5 h-3.5" />, label: 'Lịch' },
                { key: 'partyfee' as AppView, icon: <Wallet className="w-3.5 h-3.5" />, label: 'Đảng phí' },
                { key: 'docs' as AppView, icon: <Files className="w-3.5 h-3.5" />, label: 'Văn bản' },
                ...(userProfile?.role === 'admin' ? [{ key: 'admin' as AppView, icon: <Users className="w-3.5 h-3.5" />, label: 'Phê duyệt' }] : []),
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all relative ${activeView === tab.key ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white/90'
                    }`}
                >
                  {tab.icon} {tab.label}
                  {tab.key === 'schedule' && scheduleBadge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[7px] font-black text-white flex items-center justify-center border border-white/30 animate-pulse">{scheduleBadge > 9 ? '9+' : scheduleBadge}</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl backdrop-blur-md shadow-inner transition-all active:scale-95"
              title="Cài đặt API Key"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => { if (confirm('Đăng xuất?')) signOut(); }}
              className="bg-white/10 hover:bg-red-500/80 p-2.5 rounded-xl backdrop-blur-md shadow-inner transition-all active:scale-95"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 container mx-auto p-4 lg:p-8">
          {activeView === 'profiles' && <ProfileManager onDraftFromProfile={handleDraftFromProfile} onNavigateToDashboard={() => setActiveView('dashboard')} />}
          {activeView === 'dashboard' && <AdmissionDashboard onDraftFromProfile={handleDraftFromProfile} />}
          {activeView === 'compliance' && <CompliancePanel />}
          {activeView === 'regulations' && <RegulationLibrary />}
          {activeView === 'meeting' && <MeetingAssistant apiKey={apiKey} onSendToEditor={handleSendToEditor} />}
          {activeView === 'comments' && <CommentAssistant onInsertToEditor={handleSendToEditor} />}
          {activeView === 'schedule' && <ScheduleReminder />}
          {activeView === 'partyfee' && <PartyFeeAssistant />}
          {activeView === 'admin' && <AdminApproval onBack={() => setActiveView('editor')} />}
          {activeView === 'docs' && <DocumentDashboard onOpenInEditor={(content, docType) => {
            setGeneratedDoc(content);
            setActiveView('editor');
          }} />}
          {activeView === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-500" />
                      <h2 className="text-xs font-black uppercase text-gray-600 tracking-widest">Trung tâm Thiết lập</h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                      {[DocLevel.LEVEL_1, DocLevel.LEVEL_2, DocLevel.LEVEL_3, DocLevel.LEVEL_AUDIT, DocLevel.LEVEL_ADMISSION, DocLevel.LEVEL_DEV].map((lvl) => {
                        const style = getLevelStyle(lvl);
                        return (
                          <button
                            key={lvl}
                            onClick={() => setDocLevel(lvl)}
                            className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all group relative overflow-hidden h-28 ${docLevel === lvl ? `${style.color} border-transparent text-white shadow-lg` : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                          >
                            <div className={`transition-transform duration-300 group-hover:scale-110 ${docLevel === lvl ? 'text-white' : 'text-gray-300'}`}>
                              {style.icon}
                            </div>
                            <span className="text-[7px] font-black uppercase text-center leading-tight break-words max-w-full px-1 mt-1">
                              {lvl}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {isAuditLevel && (
                      <div className="space-y-3 pt-4 border-t border-gray-100 animate-in fade-in zoom-in-95 duration-500">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 ml-1">
                          <Target className="w-3 h-3" /> Quy trình kiểm tra - giám sát
                        </label>
                        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
                          {Object.values(AuditTab).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setAuditTab(tab)}
                              className={`px-2 py-2.5 rounded-lg text-[7px] font-black uppercase tracking-tight transition-all flex-1 text-center border-2 flex flex-col items-center gap-1 ${auditTab === tab ? 'bg-white border-slate-900 text-slate-900 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                              {tab === AuditTab.GIAM_SAT && <Eye className="w-3 h-3" />}
                              {tab === AuditTab.KIEM_TRA && <Search className="w-3 h-3" />}
                              {tab === AuditTab.TO_CAO && <AlertOctagon className="w-3 h-3" />}
                              {tab === AuditTab.DAU_HIEU_VP && <Fingerprint className="w-3 h-3" />}
                              {tab === AuditTab.KY_LUAT && <Hammer className="w-3 h-3" />}
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Workflow Reference Button */}
                        <button
                          onClick={() => setShowWorkflow(true)}
                          className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 border-2 border-blue-500"
                        >
                          <BookOpenCheck className="w-4 h-4" />
                          Xem quy trình {auditTab}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1 pt-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <Files className="w-3 h-3" /> Văn bản (Hệ thống 11 mẫu chuẩn)
                      </label>
                      <div className="relative group">
                        <select
                          className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold text-[11px] outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value as DocType)}
                        >
                          {allowedDocTypes.map((type) => (
                            <option key={type} value={type} className="font-semibold py-2">
                              {type}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 max-h-[280px] overflow-y-auto shadow-inner">
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-2 border-b border-gray-200 pb-2">
                          <BookOpenCheck className="w-4 h-4 text-blue-500" /> Bối cảnh hành chính
                        </h3>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-400 uppercase">Đảng bộ cấp trên</label>
                          <input type="text" placeholder="VD: ĐẢNG BỘ PHƯỜNG AN PHÚ" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-200 uppercase" value={metadata.superiorParty} onChange={e => { const v = e.target.value; setMetadata(prev => { const next = { ...prev, superiorParty: v }; try { localStorage.setItem('admin_context', JSON.stringify({ superiorParty: next.superiorParty, branchName: next.branchName, locationDate: next.locationDate })); } catch { } return next; }); }} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-400 uppercase">Chi bộ</label>
                          <input type="text" placeholder="VD: CHI BỘ KHU PHỐ 3" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-200 uppercase" value={metadata.branchName} onChange={e => { const v = e.target.value; setMetadata(prev => { const next = { ...prev, branchName: v }; try { localStorage.setItem('admin_context', JSON.stringify({ superiorParty: next.superiorParty, branchName: next.branchName, locationDate: next.locationDate })); } catch { } return next; }); }} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-400 uppercase">Ngày tháng, địa danh</label>
                          <input type="text" placeholder="VD: An Phú, ngày 03 tháng 02 năm 2026" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-200" value={metadata.locationDate} onChange={e => { const v = e.target.value; setMetadata(prev => { const next = { ...prev, locationDate: v }; try { localStorage.setItem('admin_context', JSON.stringify({ superiorParty: next.superiorParty, branchName: next.branchName, locationDate: next.locationDate })); } catch { } return next; }); }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col relative min-h-[350px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-black uppercase text-gray-600 tracking-widest flex items-center gap-2">
                      <span className={`w-6 h-6 ${currentStyle.color} text-white rounded flex items-center justify-center text-[10px]`}>03</span>
                      Dữ liệu thực tế vụ việc
                    </h2>
                    <div className="relative" ref={menuRef}>
                      <button onClick={() => setShowSampleMenu(!showSampleMenu)} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition-all text-[9px] font-black uppercase tracking-wider shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Thư viện nghiệp vụ
                      </button>
                      {showSampleMenu && (
                        <div className="absolute right-0 bottom-full mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Kịch bản soạn thảo nhanh</span>
                            <button onClick={() => setShowSampleMenu(false)}><X className="w-4 h-4 text-amber-400 hover:text-amber-600" /></button>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto p-3 space-y-4">
                            {currentGroups.map((group, idx) => (
                              <div key={idx} className="space-y-1.5">
                                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-tighter border-l-2 border-amber-400 pl-2">{group.group}</h4>
                                {group.items.map((item, iIdx) => (
                                  <button key={iIdx} onClick={() => handleSelectSample(item.content)} className="w-full text-left p-2.5 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 transition-all group/item">
                                    <div className="flex items-center gap-2 mb-1">
                                      {item.icon}
                                      <p className="text-[10px] font-bold text-gray-700 group-hover/item:text-amber-800">{item.title}</p>
                                    </div>
                                    <p className="text-[9px] text-gray-400 line-clamp-2 italic leading-relaxed group-hover/item:text-gray-600">"{item.content}"</p>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <textarea
                    className="flex-1 w-full p-5 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm leading-relaxed font-mono bg-gray-50/20 resize-none shadow-inner"
                    placeholder={getDocPlaceholder(docType)}
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                  />

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`mt-4 w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isGenerating ? 'bg-gray-400' : `${currentStyle.color} hover:opacity-90`}`}
                  >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    {isGenerating ? 'Đang soạn thảo hồ sơ...' : 'Bắt đầu biên soạn AI'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 no-print">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 ${currentStyle.color} text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md`}>04</span>
                    <h2 className="text-sm font-black uppercase text-gray-700 tracking-widest">Dự thảo hoàn chỉnh</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleExportPdf} disabled={!generatedDoc || isExportingPdf} className="px-3 py-2 text-[9px] font-black text-white bg-slate-800 hover:bg-slate-900 rounded-lg uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all">
                      {isExportingPdf ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />} PDF
                    </button>
                    <button onClick={handleExportWord} disabled={!generatedDoc || isExportingWord} className="px-3 py-2 text-[9px] font-black text-white bg-[#b91c1c] hover:bg-red-800 rounded-lg uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all">
                      {isExportingWord ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} WORD
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-100/30 p-4 md:p-12 flex justify-center print:bg-white print:p-0">
                  <div id="printable-document" className="w-full max-w-[21cm] bg-white shadow-2xl min-h-[29.7cm] p-[1.5cm_1.5cm_1.5cm_3cm] document-font whitespace-pre-wrap leading-[1.6] text-black relative print:shadow-none print:p-0 ring-1 ring-gray-100 flex flex-col transition-all duration-700">
                    {generatedDoc ? (
                      <div className="flex-1 text-[13pt] text-justify animate-in fade-in slide-in-from-bottom-4 duration-700">{generatedDoc}</div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-64 text-center">
                        <div className="p-8 bg-gray-50 rounded-full mb-4 shadow-inner">
                          <History className="w-12 h-12 text-gray-200" />
                        </div>
                        <p className="max-w-[300px] text-[10px] font-black uppercase tracking-widest leading-loose text-gray-400">Chọn Tab quy trình và loại văn bản để AI bắt đầu soạn thảo bộ hồ sơ.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div ref={settingsRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wide">Cài đặt API Key</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Google AI Studio API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Nhập API Key của bạn..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-mono"
                  />
                  <p className="text-[10px] text-gray-400 italic flex items-start gap-1">
                    <span className="text-blue-500 mt-0.5">ℹ️</span>
                    Lấy API key tại: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">aistudio.google.com/apikey</a>
                  </p>
                </div>

                {connectionStatus !== 'idle' && (
                  <div className={`p-3 rounded-lg border-2 text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${connectionStatus === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {connectionStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Kết nối thành công!
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="w-5 h-5 flex-shrink-0" />
                        <span>{errorMessage || 'Kết nối thất bại. Vui lòng kiểm tra lại API Key.'}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection || !apiKey.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang test...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Test kết nối
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKey.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    Lưu API Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Modal */}
        <WorkflowModal
          isOpen={showWorkflow}
          onClose={() => setShowWorkflow(false)}
          auditTab={auditTab}
        />

        <footer className="bg-white border-t border-gray-100 p-4 text-center no-print shadow-inner">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] italic">Hệ thống Trợ lý Kiểm tra Đảng | Trọn bộ 11 mẫu văn bản quy trình chuẩn</p>
        </footer>
      </div>
    )
  );
};

export default App;
