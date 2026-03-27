import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';

const HospitalMap = () => {
  const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=12.87961085860525,80.20520937617553';

  return (
    <Card className="border-none shadow-soft h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          Hospital Location
        </CardTitle>
        <Button asChild size="sm" className="shrink-0">
          <a href={googleMapsUrl} target="_blank" rel="noreferrer">
            <Navigation className="h-4 w-4 mr-2" />
            Navigate
          </a>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="relative rounded-b-lg overflow-hidden h-full min-h-[420px]">
          <iframe
            src="https://maps.google.com/maps?q=12.87961085860525,80.20520937617553&hl=en&z=18&output=embed"
            className="h-full w-full"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
          <div className="absolute bottom-4 right-4">
            <Button asChild variant="secondary" size="sm" className="shadow-md">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                Open in Maps
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HospitalMap;