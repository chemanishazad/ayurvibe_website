import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type ConsultationsTopBarProps = {
  isListRoute: boolean;
  isNurseStaff: boolean;
  isViewRoute: boolean;
  isFormRoute: boolean;
  isClinicSelected: boolean;
  onOpenNew: () => void;
  onBackToRecords: () => void;
};

export default function ConsultationsTopBar({
  isListRoute,
  isNurseStaff,
  isViewRoute,
  isFormRoute,
  isClinicSelected,
  onOpenNew,
  onBackToRecords,
}: ConsultationsTopBarProps) {
  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {isListRoute && (
          <Button
            onClick={onOpenNew}
            disabled={!isClinicSelected}
            size="sm"
            className="shrink-0 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {isNurseStaff ? 'New OP' : 'New consult'}
          </Button>
        )}
        {(isViewRoute || isFormRoute) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToRecords}
            className="shrink-0 transition-all duration-200 hover:bg-muted/80 active:scale-[0.98]"
          >
            Back to records
          </Button>
        )}
      </div>
    </div>
  );
}
