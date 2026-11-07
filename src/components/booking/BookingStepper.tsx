'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  MapPin,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface BookingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const BOOKING_STEPS: BookingStep[] = [
  {
    id: 'vehicle',
    label: 'Select Vehicle',
    description: 'Choose your preferred vehicle',
    icon: Car,
  },
  {
    id: 'details',
    label: 'Pickup & Return',
    description: 'Set locations, dates and times',
    icon: MapPin,
  },
  {
    id: 'customer',
    label: 'Customer Info',
    description: 'Provide your contact details',
    icon: User,
  },
  {
    id: 'summary',
    label: 'Booking Summary',
    description: 'Review and confirm your booking',
    icon: CheckCircle2,
  },
];

interface BookingStepperProps {
  currentStep?: string;
  onStepChange?: (stepId: string) => void;
  onComplete?: () => void;
  className?: string;
}

export function BookingStepper({
  currentStep: initialStep,
  onStepChange,
  onComplete,
  className,
}: BookingStepperProps) {
  const [activeStep, setActiveStep] = useState<string>(
    initialStep || BOOKING_STEPS[0].id
  );

  const currentIndex = BOOKING_STEPS.findIndex((s) => s.id === activeStep);
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex >= BOOKING_STEPS.length - 1;

  const goToStep = useCallback(
    (stepId: string) => {
      setActiveStep(stepId);
      onStepChange?.(stepId);
    },
    [onStepChange]
  );

  const goToNext = useCallback(() => {
    if (!isLastStep) {
      const nextStep = BOOKING_STEPS[currentIndex + 1];
      setActiveStep(nextStep.id);
      onStepChange?.(nextStep.id);
    } else {
      onComplete?.();
    }
  }, [isLastStep, currentIndex, onStepChange, onComplete]);

  const goToPrev = useCallback(() => {
    if (!isFirstStep) {
      const prevStep = BOOKING_STEPS[currentIndex - 1];
      setActiveStep(prevStep.id);
      onStepChange?.(prevStep.id);
    }
  }, [isFirstStep, currentIndex, onStepChange]);

  const isCompleted = (stepId: string) => {
    return BOOKING_STEPS.findIndex((s) => s.id === stepId) < currentIndex;
  };

  const isActive = (stepId: string) => stepId === activeStep;

  return (
    <div className={cn('w-full', className)}>
      {/* Step Progress Line */}
      <div className="relative mx-auto max-w-[600px]">
        <div
          className="absolute top-1/2 left-0 right-0 h-1 -z-10 bg-border/50"
          aria-hidden="true"
        />
        {BOOKING_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'absolute top-0 flex items-center justify-center w-2 h-2 rounded-full',
              index < currentIndex ? 'bg-primary' : '',
              index === currentIndex ? 'bg-accent ring-2 ring-background ring-offset-2' : 'bg-border',
              index === 0 ? 'left-0' : '',
              index === BOOKING_STEPS.length - 1 ? 'right-0' : '',
              index > 0 && index < BOOKING_STEPS.length - 1
                ? `left-[calc(${((index) / (BOOKING_STEPS.length - 1)) * 100}%)]`
                : ''
            )}
            aria-hidden="true"
          />
        ))}
        {BOOKING_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 transition-all duration-300',
              index < currentIndex
                ? 'bg-primary border-primary text-primary-foreground'
                : index === currentIndex
                ? 'bg-accent border-accent text-accent-foreground'
                : 'bg-background border-border text-muted-foreground',
              index === 0 ? 'left-0' : '',
              index === BOOKING_STEPS.length - 1 ? 'right-0' : '',
              index > 0 && index < BOOKING_STEPS.length - 1
                ? `left-[calc(${((index) / (BOOKING_STEPS.length - 1)) * 100}%)]`
                : ''
            )}
          >
            {index < currentIndex ? (
              <CheckCircle2 className="w-5 h-5 fill-current" />
            ) : index === currentIndex ? (
              <step.icon className="w-5 h-5 fill-current" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="mt-8 flex justify-between text-xs uppercase tracking-wider font-medium text-muted-foreground">
        {BOOKING_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'text-center',
              index < currentIndex ? 'text-primary font-semibold' : '',
              index === currentIndex ? 'text-primary font-bold' : ''
            )}
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MobileBookingStepperProps {
  currentStep?: string;
  onStepChange?: (stepId: string) => void;
}

export function MobileBookingStepper({
  currentStep: initialStep,
  onStepChange,
}: MobileBookingStepperProps) {
  const [activeStep, setActiveStep] = useState<string>(
    initialStep || BOOKING_STEPS[0].id
  );

  const currentIndex = BOOKING_STEPS.findIndex((s) => s.id === activeStep);
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex >= BOOKING_STEPS.length - 1;

  const goToStep = useCallback(
    (stepId: string) => {
      setActiveStep(stepId);
      onStepChange?.(stepId);
    },
    [onStepChange]
  );

  const goToNext = useCallback(() => {
    if (!isLastStep) {
      const nextStep = BOOKING_STEPS[currentIndex + 1];
      setActiveStep(nextStep.id);
      onStepChange?.(nextStep.id);
    }
  }, [isLastStep, currentIndex, onStepChange]);

  const goToPrev = useCallback(() => {
    if (!isFirstStep) {
      const prevStep = BOOKING_STEPS[currentIndex - 1];
      setActiveStep(prevStep.id);
      onStepChange?.(prevStep.id);
    }
  }, [isFirstStep, currentIndex, onStepChange]);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPrev}
        disabled={isFirstStep}
        className="px-2 py-1.5 text-xs"
      >
        <ArrowLeft className="w-3 h-3 mr-1" aria-hidden="true" />
        Back
      </Button>
      <div className="text-center flex-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">
          Step {currentIndex + 1} of {BOOKING_STEPS.length}
        </span>
        <span className="text-sm font-medium text-foreground">
          {BOOKING_STEPS[currentIndex]?.label}
        </span>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={goToNext}
        disabled={isLastStep}
        className="px-2 py-1.5 text-xs"
      >
        Next <ChevronRight className="w-3 h-3 ml-1" aria-hidden="true" />
      </Button>
    </div>
  );
}
