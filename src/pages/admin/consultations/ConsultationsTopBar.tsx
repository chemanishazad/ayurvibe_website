import React from 'react';
import { Button } from '@/components/ui/button';

type ConsultationsTopBarProps = {
  isListRoute: boolean;
  isViewRoute: boolean;
  isFormRoute: boolean;
  onBackToRecords: () => void;
};

export default function ConsultationsTopBar({
  isListRoute,
  isViewRoute,
  isFormRoute,
  onBackToRecords,
}: ConsultationsTopBarProps) {
  if (isListRoute) {
    return null;
  }
  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
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
