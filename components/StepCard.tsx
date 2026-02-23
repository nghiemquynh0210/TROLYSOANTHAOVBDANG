import React from 'react';
import { X } from 'lucide-react';
import { WorkflowStep } from '../data/workflows';

interface StepCardProps {
    step: WorkflowStep;
    isLast: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ step, isLast }) => {
    return (
        <div className="step-card-container">
            <div className="step-card">
                <div className="step-header">
                    <span className="step-number">Bước {step.number}</span>
                    <span className="step-doc-type">{step.docType}</span>
                </div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-responsible">👤 {step.responsible}</p>
                <p className="step-description">{step.description}</p>
            </div>
            {!isLast && <div className="step-arrow">↓</div>}
        </div>
    );
};

export default StepCard;
