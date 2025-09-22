import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MapPin } from 'lucide-react';

const HospitalMap = () => {
  return (
    <Card className="border-none shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          Hospital Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative rounded-b-lg overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            <iframe 
              src="https://maps.google.com/maps?q=12.87961085860525,80.20520937617553&hl=en&z=18&output=embed"
              className="h-full w-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </AspectRatio>
        </div>
      </CardContent>
    </Card>
  );
};

export default HospitalMap;