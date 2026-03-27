import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function ClinicSelectionNotice({ message }: { message: string }) {
  return (
    <Card className="mb-3 border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40">
      <CardContent className="py-3 text-sm text-amber-900 dark:text-amber-100">
        {message}
      </CardContent>
    </Card>
  );
}
