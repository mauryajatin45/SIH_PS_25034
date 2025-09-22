import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  completed: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: string;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-between px-4 py-6 bg-white border-b border-gray-200">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.completed;
        const isLast = index === steps.length - 1;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-600 text-white' 
                    : isActive 
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
                aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span 
                className={`text-xs text-center font-medium ${
                  isActive ? 'text-orange-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            
            {!isLast && (
              <div 
                className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-200'
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}