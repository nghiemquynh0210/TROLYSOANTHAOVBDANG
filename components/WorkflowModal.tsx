import React from 'react';
import { X, BookOpenCheck } from 'lucide-react';
import { WORKFLOWS, WorkflowStep } from '../data/workflows';
import { AuditTab } from '../types';
import StepCard from './StepCard';

interface WorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    auditTab: AuditTab;
}

const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose, auditTab }) => {
    if (!isOpen) return null;

    const workflowKey = auditTab as string;
    const workflow = WORKFLOWS[workflowKey];

    if (!workflow) return null;

    const phaseSteps = {
        'CHUẨN BỊ': workflow.steps.filter(s => s.phase === 'CHUẨN BỊ'),
        'TIẾN HÀNH': workflow.steps.filter(s => s.phase === 'TIẾN HÀNH'),
        'KẾT THÚC': workflow.steps.filter(s => s.phase === 'KẾT THÚC')
    };

    return (
        <div className="workflow-modal-overlay" onClick={onClose}>
            <div className="workflow-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="workflow-modal-header">
                    <div className="workflow-modal-title-section">
                        <BookOpenCheck size={24} className="workflow-icon" />
                        <div>
                            <h2 className="workflow-modal-title">{workflow.title}</h2>
                            <p className="workflow-modal-description">{workflow.description}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="workflow-modal-close">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="workflow-modal-body">
                    {/* Phase I: CHUẨN BỊ */}
                    <div className="workflow-phase">
                        <h3 className="workflow-phase-title">
                            <span className="phase-number">I</span>
                            BƯỚC CHUẨN BỊ
                        </h3>
                        <div className="workflow-steps">
                            {phaseSteps['CHUẨN BỊ'].map((step, index) => (
                                <StepCard
                                    key={step.number}
                                    step={step}
                                    isLast={index === phaseSteps['CHUẨN BỊ'].length - 1 && phaseSteps['TIẾN HÀNH'].length === 0 && phaseSteps['KẾT THÚC'].length === 0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Phase II: TIẾN HÀNH */}
                    {phaseSteps['TIẾN HÀNH'].length > 0 && (
                        <div className="workflow-phase">
                            <h3 className="workflow-phase-title">
                                <span className="phase-number">II</span>
                                BƯỚC TIẾN HÀNH
                            </h3>
                            <div className="workflow-steps">
                                {phaseSteps['TIẾN HÀNH'].map((step, index) => (
                                    <StepCard
                                        key={step.number}
                                        step={step}
                                        isLast={index === phaseSteps['TIẾN HÀNH'].length - 1 && phaseSteps['KẾT THÚC'].length === 0}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Phase III: KẾT THÚC */}
                    {phaseSteps['KẾT THÚC'].length > 0 && (
                        <div className="workflow-phase">
                            <h3 className="workflow-phase-title">
                                <span className="phase-number">III</span>
                                BƯỚC KẾT THÚC
                            </h3>
                            <div className="workflow-steps">
                                {phaseSteps['KẾT THÚC'].map((step, index) => (
                                    <StepCard
                                        key={step.number}
                                        step={step}
                                        isLast={index === phaseSteps['KẾT THÚC'].length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="workflow-modal-footer">
                    <p className="workflow-footer-note">
                        📌 <strong>Lưu ý:</strong> Tất cả {workflow.steps.length} bước phải được thực hiện đầy đủ và đúng thứ tự theo quy định của Đảng.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WorkflowModal;
