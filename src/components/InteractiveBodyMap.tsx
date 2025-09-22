import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Heart, Brain, Activity, Zap } from 'lucide-react';

const InteractiveBodyMap = () => {
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const bodyAreas = {
    head: {
      name: 'Head & Mind',
      icon: Brain,
      treatments: ['Shirodhara', 'Shirobasti', 'Nasya'],
      conditions: ['Stress', 'Anxiety', 'Headaches', 'Insomnia'],
      description: 'Ancient therapies for mental clarity and nervous system balance',
      color: 'from-blue-400 to-purple-400'
    },
    heart: {
      name: 'Heart & Circulation',
      icon: Heart,
      treatments: ['Hridayabasti', 'Oil Massage', 'Yoga Therapy'],
      conditions: ['High BP', 'Heart Issues', 'Circulation Problems'],
      description: 'Cardiovascular wellness through holistic Ayurvedic approaches',
      color: 'from-red-400 to-pink-400'
    },
    digestive: {
      name: 'Digestive System',
      icon: Activity,
      treatments: ['Abhyanga', 'Kativasti', 'Herbal Medicine'],
      conditions: ['IBS', 'Acid Reflux', 'Digestive Issues', 'Bloating'],
      description: 'Restore digestive fire and gut health naturally',
      color: 'from-yellow-400 to-orange-400'
    },
    energy: {
      name: 'Energy & Vitality',
      icon: Zap,
      treatments: ['Panchakarma', 'Rejuvenation Therapy', 'Meditation'],
      conditions: ['Fatigue', 'Low Energy', 'Chronic Illness'],
      description: 'Revitalize your life force and natural energy',
      color: 'from-green-400 to-emerald-400'
    }
  };

  const handleAreaClick = (areaKey: string) => {
    setActiveArea(areaKey);
    setShowModal(true);
  };

  const activeAreaData = activeArea ? bodyAreas[activeArea as keyof typeof bodyAreas] : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-none shadow-soft bg-gradient-to-br from-background to-cream">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary mr-2" />
            Interactive Treatment Map
          </CardTitle>
          <p className="text-muted-foreground">
            Click on different body areas to discover targeted Ayurvedic treatments
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mx-auto">
            {/* Simple body diagram with clickable areas */}
            <div className="relative bg-gradient-to-b from-background to-muted rounded-3xl p-8 min-h-96">
              
              {/* Head area */}
              <button
                onClick={() => handleAreaClick('head')}
                className={`absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full 
                  bg-gradient-to-br ${bodyAreas.head.color} hover:scale-110 transition-all duration-300 
                  shadow-lg hover:shadow-xl flex items-center justify-center group`}
              >
                <Brain className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Heart area */}
              <button
                onClick={() => handleAreaClick('heart')}
                className={`absolute top-20 left-1/2 transform -translate-x-1/2 translate-x-2 w-14 h-14 rounded-full 
                  bg-gradient-to-br ${bodyAreas.heart.color} hover:scale-110 transition-all duration-300 
                  shadow-lg hover:shadow-xl flex items-center justify-center group`}
              >
                <Heart className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Digestive area */}
              <button
                onClick={() => handleAreaClick('digestive')}
                className={`absolute top-32 left-1/2 transform -translate-x-1/2 w-20 h-16 rounded-2xl 
                  bg-gradient-to-br ${bodyAreas.digestive.color} hover:scale-110 transition-all duration-300 
                  shadow-lg hover:shadow-xl flex items-center justify-center group`}
              >
                <Activity className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Energy area */}
              <button
                onClick={() => handleAreaClick('energy')}
                className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 h-20 rounded-2xl 
                  bg-gradient-to-br ${bodyAreas.energy.color} hover:scale-110 transition-all duration-300 
                  shadow-lg hover:shadow-xl flex items-center justify-center group`}
              >
                <Zap className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Instructions */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center">
                <p className="text-sm text-muted-foreground">Tap areas to explore treatments</p>
              </div>
            </div>
          </div>

          {/* Quick overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {Object.entries(bodyAreas).map(([key, area]) => {
              const IconComponent = area.icon;
              return (
                <button
                  key={key}
                  onClick={() => handleAreaClick(key)}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary/50 
                    hover:shadow-md transition-all duration-300 text-left group"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${area.color} 
                    flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-medium text-sm text-foreground mb-1">{area.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {area.treatments.length} treatments
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Treatment Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          {activeAreaData && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeAreaData.color} 
                    flex items-center justify-center mr-3`}>
                    <activeAreaData.icon className="h-4 w-4 text-white" />
                  </div>
                  {activeAreaData.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">{activeAreaData.description}</p>
                
                <div>
                  <h4 className="font-medium mb-2">Recommended Treatments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeAreaData.treatments.map((treatment) => (
                      <Badge key={treatment} variant="secondary">
                        {treatment}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Common Conditions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeAreaData.conditions.map((condition) => (
                      <Badge key={condition} className="bg-primary/10 text-primary border-primary/20">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button className="w-full mt-4">
                  Book Consultation for {activeAreaData.name}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteractiveBodyMap;