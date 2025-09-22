import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Clock, DollarSign, User } from 'lucide-react';

const TreatmentComparison = () => {
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>(['panchakarma', 'abhyanga']);

  const treatments = {
    panchakarma: {
      name: 'Panchakarma Program',
      duration: '7-21 days',
      price: 'From $1,200',
      intensity: 'High',
      benefits: [
        'Complete detoxification',
        'Deep tissue cleansing',
        'Mental clarity',
        'Improved immunity',
        'Weight management',
        'Stress relief'
      ],
      bestFor: ['Chronic conditions', 'Complete wellness reset', 'Preventive care'],
      includes: [
        'Daily consultations',
        'Customized treatments',
        'Ayurvedic meals',
        'Yoga sessions',
        'Meditation guidance'
      ]
    },
    abhyanga: {
      name: 'Abhyanga Massage',
      duration: '60-90 mins',
      price: 'From $150',
      intensity: 'Low',
      benefits: [
        'Improved circulation',
        'Stress relief',
        'Better sleep',
        'Skin nourishment',
        'Joint flexibility',
        'Relaxation'
      ],
      bestFor: ['Stress management', 'Skin health', 'Regular maintenance'],
      includes: [
        'Full body massage',
        'Herbal oils',
        'Steam therapy',
        'Relaxation time'
      ]
    },
    shirodhara: {
      name: 'Shirodhara Therapy',
      duration: '45-60 mins',
      price: 'From $120',
      intensity: 'Medium',
      benefits: [
        'Deep relaxation',
        'Anxiety relief',
        'Better sleep',
        'Mental clarity',
        'Nervous system balance',
        'Headache relief'
      ],
      bestFor: ['Mental stress', 'Sleep disorders', 'Anxiety'],
      includes: [
        'Oil pouring therapy',
        'Scalp massage',
        'Meditation session',
        'Herbal tea'
      ]
    },
    detox: {
      name: 'Detox Program',
      duration: '3-14 days',
      price: 'From $800',
      intensity: 'Medium',
      benefits: [
        'Toxin elimination',
        'Weight management',
        'Energy boost',
        'Digestive health',
        'Cellular renewal',
        'Mental clarity'
      ],
      bestFor: ['Weight loss', 'Digestive issues', 'Energy improvement'],
      includes: [
        'Herbal medicines',
        'Detox meals',
        'Colon therapy',
        'Steam treatments',
        'Lifestyle counseling'
      ]
    }
  };

  const handleTreatmentToggle = (treatmentId: string) => {
    setSelectedTreatments(prev => {
      if (prev.includes(treatmentId)) {
        return prev.filter(id => id !== treatmentId);
      } else if (prev.length < 3) {
        return [...prev, treatmentId];
      }
      return prev;
    });
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-soft">
        <CardHeader>
          <CardTitle className="text-center">Compare Treatments</CardTitle>
          <p className="text-center text-muted-foreground">
            Select up to 3 treatments to compare side by side
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {Object.entries(treatments).map(([id, treatment]) => (
              <div key={id} className="flex items-center space-x-2">
                <Checkbox
                  id={id}
                  checked={selectedTreatments.includes(id)}
                  onCheckedChange={() => handleTreatmentToggle(id)}
                  disabled={!selectedTreatments.includes(id) && selectedTreatments.length >= 3}
                />
                <label htmlFor={id} className="text-sm font-medium cursor-pointer">
                  {treatment.name}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTreatments.length > 0 && (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(selectedTreatments.length, 3)}, 1fr)` }}>
          {selectedTreatments.map(treatmentId => {
            const treatment = treatments[treatmentId as keyof typeof treatments];
            return (
              <Card key={treatmentId} className="border-none shadow-soft hover:shadow-warm transition-shadow">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{treatment.name}</CardTitle>
                  <div className="flex justify-center items-center space-x-4 mt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {treatment.duration}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {treatment.price}
                    </div>
                  </div>
                  <Badge className={`mt-2 ${getIntensityColor(treatment.intensity)}`}>
                    {treatment.intensity} Intensity
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Key Benefits
                    </h4>
                    <ul className="space-y-1">
                      {treatment.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <User className="h-4 w-4 text-primary mr-2" />
                      Best For
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {treatment.bestFor.map((condition, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">What's Included</h4>
                    <ul className="space-y-1">
                      {treatment.includes.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full mt-4">
                    Book {treatment.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TreatmentComparison;