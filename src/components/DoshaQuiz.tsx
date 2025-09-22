import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Brain, Utensils, Activity, CheckCircle } from 'lucide-react';

// Import dosha images
import vataImg from '@/assets/vata-dosha.jpg';
import pittaImg from '@/assets/pitta-dosha.jpg';
import kaphaImg from '@/assets/kapha-dosha.jpg';

interface QuizAnswers {
  height: string;
  weight: string;
  skin: string;
  digestion: string;
  personality: string;
  bodyFrame: string;
  energy: string;
  sleep: string;
  weather: string;
  appetite: string;
}

interface DoshaResult {
  vata: number;
  pitta: number;
  kapha: number;
  dominant: string;
}

const DoshaQuiz = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [result, setResult] = useState<DoshaResult | null>(null);

  const questions = [
    {
      id: 'bodyFrame',
      question: 'My body frame is...',
      options: [
        { value: 'thin', label: 'Thin, light, hard to gain weight', dosha: 'vata' },
        { value: 'medium', label: 'Medium build, moderate weight', dosha: 'pitta' },
        { value: 'large', label: 'Large frame, easy to gain weight', dosha: 'kapha' }
      ]
    },
    {
      id: 'skin',
      question: 'My skin is usually...',
      options: [
        { value: 'dry', label: 'Dry, rough, or cool', dosha: 'vata' },
        { value: 'warm', label: 'Warm, sensitive, oily, with freckles', dosha: 'pitta' },
        { value: 'oily', label: 'Oily, smooth, thick, or pale', dosha: 'kapha' }
      ]
    },
    {
      id: 'hair',
      question: 'My hair is typically...',
      options: [
        { value: 'dry', label: 'Dry, brittle, thin', dosha: 'vata' },
        { value: 'fine', label: 'Fine, soft, early graying/balding', dosha: 'pitta' },
        { value: 'thick', label: 'Thick, oily, wavy, lustrous', dosha: 'kapha' }
      ]
    },
    {
      id: 'eyes',
      question: 'My eyes are...',
      options: [
        { value: 'small', label: 'Small, dry, active, darting', dosha: 'vata' },
        { value: 'sharp', label: 'Sharp, bright, penetrating', dosha: 'pitta' },
        { value: 'large', label: 'Large, calm, loving', dosha: 'kapha' }
      ]
    },
    {
      id: 'digestion',
      question: 'My digestion is...',
      options: [
        { value: 'irregular', label: 'Irregular, gassy, variable', dosha: 'vata' },
        { value: 'strong', label: 'Strong, sharp, can eat anything', dosha: 'pitta' },
        { value: 'slow', label: 'Slow but steady', dosha: 'kapha' }
      ]
    },
    {
      id: 'appetite',
      question: 'My appetite is...',
      options: [
        { value: 'variable', label: 'Variable, often forget to eat', dosha: 'vata' },
        { value: 'strong', label: 'Strong, get irritable when hungry', dosha: 'pitta' },
        { value: 'low', label: 'Low, can skip meals easily', dosha: 'kapha' }
      ]
    },
    {
      id: 'thirst',
      question: 'My thirst is...',
      options: [
        { value: 'variable', label: 'Variable, often forget to drink', dosha: 'vata' },
        { value: 'excessive', label: 'Excessive, especially for cold drinks', dosha: 'pitta' },
        { value: 'minimal', label: 'Minimal, rarely feel thirsty', dosha: 'kapha' }
      ]
    },
    {
      id: 'personality',
      question: 'My personality is...',
      options: [
        { value: 'creative', label: 'Creative, fast, easily distracted', dosha: 'vata' },
        { value: 'ambitious', label: 'Ambitious, focused, intense', dosha: 'pitta' },
        { value: 'calm', label: 'Calm, steady, compassionate', dosha: 'kapha' }
      ]
    },
    {
      id: 'emotions',
      question: 'When stressed, I tend to...',
      options: [
        { value: 'anxious', label: 'Become anxious and worried', dosha: 'vata' },
        { value: 'angry', label: 'Become angry and irritable', dosha: 'pitta' },
        { value: 'withdrawn', label: 'Become withdrawn and depressed', dosha: 'kapha' }
      ]
    },
    {
      id: 'memory',
      question: 'My memory is...',
      options: [
        { value: 'quick', label: 'Quick to learn, quick to forget', dosha: 'vata' },
        { value: 'sharp', label: 'Sharp, clear, focused', dosha: 'pitta' },
        { value: 'slow', label: 'Slow to learn but never forget', dosha: 'kapha' }
      ]
    },
    {
      id: 'energy',
      question: 'My energy levels are...',
      options: [
        { value: 'variable', label: 'Variable, bursts of energy then fatigue', dosha: 'vata' },
        { value: 'consistent', label: 'Consistent, moderate-high', dosha: 'pitta' },
        { value: 'steady', label: 'Steady, long-lasting endurance', dosha: 'kapha' }
      ]
    },
    {
      id: 'sleep',
      question: 'My sleep pattern is...',
      options: [
        { value: 'light', label: 'Light sleeper, restless, wake easily', dosha: 'vata' },
        { value: 'moderate', label: 'Moderate, sound, need 6-8 hours', dosha: 'pitta' },
        { value: 'deep', label: 'Deep sleeper, hard to wake up, need 8+ hours', dosha: 'kapha' }
      ]
    },
    {
      id: 'weather',
      question: 'I prefer weather that is...',
      options: [
        { value: 'warm', label: 'Warm and humid', dosha: 'vata' },
        { value: 'cool', label: 'Cool and well-ventilated', dosha: 'pitta' },
        { value: 'warm-dry', label: 'Warm and dry', dosha: 'kapha' }
      ]
    },
    {
      id: 'exercise',
      question: 'My exercise preference is...',
      options: [
        { value: 'light', label: 'Light, gentle, yoga, walking', dosha: 'vata' },
        { value: 'moderate', label: 'Moderate, competitive sports', dosha: 'pitta' },
        { value: 'intense', label: 'Intense, weight training, aerobics', dosha: 'kapha' }
      ]
    },
    {
      id: 'speech',
      question: 'My speech pattern is...',
      options: [
        { value: 'fast', label: 'Fast, talkative, rambling', dosha: 'vata' },
        { value: 'sharp', label: 'Sharp, precise, argumentative', dosha: 'pitta' },
        { value: 'slow', label: 'Slow, methodical, thoughtful', dosha: 'kapha' }
      ]
    }
  ];

  const calculateDosha = () => {
    const scores = { vata: 0, pitta: 0, kapha: 0 };
    
    Object.entries(answers).forEach(([key, value]) => {
      if (key === 'height' || key === 'weight') return;
      
      const question = questions.find(q => q.id === key);
      const option = question?.options.find(opt => opt.value === value);
      
      if (option) {
        scores[option.dosha as keyof typeof scores]++;
      }
    });

    const total = scores.vata + scores.pitta + scores.kapha;
    const percentages = {
      vata: Math.round((scores.vata / total) * 100),
      pitta: Math.round((scores.pitta / total) * 100),
      kapha: Math.round((scores.kapha / total) * 100)
    };

    const dominant = Object.entries(percentages).reduce((a, b) => 
      percentages[a[0] as keyof typeof percentages] > percentages[b[0] as keyof typeof percentages] ? a : b
    )[0];

    setResult({ ...percentages, dominant });
  };

  const doshaInfo = {
    vata: {
      image: vataImg,
      characteristics: [
        'Creative, energetic, and quick-thinking',
        'Thin build, light bones, prominent joints',
        'Dry or rough skin, cool to touch',
        'Variable appetite and irregular digestion',
        'Light sleeper, active mind, vivid dreams',
        'Sensitive to cold and wind'
      ],
      recommendations: [
        'Maintain regular daily routines and meal times',
        'Stay warm and avoid cold, raw foods',
        'Practice calming activities like yoga and meditation',
        'Get adequate rest and sleep (7-8 hours)',
        'Use warm oils for daily self-massage',
        'Favor warm, moist, and grounding foods'
      ],
      foods: [
        'Warm, cooked, moist foods',
        'Sweet, sour, and salty tastes',
        'Ghee, nuts, and whole grains',
        'Warm milk with spices (ginger, cardamom)',
        'Root vegetables and nourishing soups',
        'Avoid cold, dry, and raw foods'
      ]
    },
    pitta: {
      image: pittaImg,
      characteristics: [
        'Ambitious, focused, and determined',
        'Medium build, good muscle development',
        'Warm, sensitive skin, prone to rashes',
        'Strong appetite and efficient digestion',
        'Moderate sleep needs, sound sleeper',
        'Sensitive to heat, tends to overheat'
      ],
      recommendations: [
        'Keep cool and avoid excessive heat exposure',
        'Practice moderation in all activities',
        'Engage in cooling, non-competitive exercise',
        'Manage stress and avoid overwork',
        'Use cooling oils like coconut or sunflower',
        'Favor cool, refreshing environments'
      ],
      foods: [
        'Cool, fresh, and slightly dry foods',
        'Sweet, bitter, and astringent tastes',
        'Leafy greens and fresh seasonal fruits',
        'Coconut water and cooling herbs (mint, cilantro)',
        'Cooling grains like rice and barley',
        'Avoid spicy, fried, salty, and sour foods'
      ]
    },
    kapha: {
      image: kaphaImg,
      characteristics: [
        'Calm, steady, and compassionate nature',
        'Strong endurance and natural stamina',
        'Solid, heavier bone structure, large frame',
        'Smooth, moist, cool, and thick skin',
        'Excellent long-term memory, slow to learn',
        'Deep sleeper, hard to wake up, needs motivation'
      ],
      recommendations: [
        'Stay active with regular vigorous exercise',
        'Wake up early and maintain active lifestyle',
        'Practice energizing yoga and breathing exercises',
        'Keep warm and dry, avoid dampness',
        'Use warming oils like sesame or mustard',
        'Seek variety and stimulation in daily routine'
      ],
      foods: [
        'Light, warm, spiced, and dry foods',
        'Pungent, bitter, and astringent tastes',
        'Light grains like quinoa, buckwheat, and millet',
        'Spiced teas and raw honey (in moderation)',
        'Fresh ginger, black pepper, and warming spices',
        'Avoid heavy, cold, oily, and sweet foods'
      ]
    }
  };

  const handleNext = () => {
    if (currentStep <= questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateDosha();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(1);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    const dominantDosha = result.dominant as keyof typeof doshaInfo;
    const info = doshaInfo[dominantDosha];

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary mr-2" />
              Dosha Analysis Results
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dominant Dosha Image and Title */}
            <Card className="border-none shadow-soft text-center">
              <CardContent className="pt-8">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-soft">
                  <img 
                    src={info.image} 
                    alt={`${dominantDosha} dosha`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-3xl font-bold text-primary mb-2">
                  Your Dominant Dosha: {dominantDosha.charAt(0).toUpperCase() + dominantDosha.slice(1)}
                </h3>
                <p className="text-muted-foreground">
                  Your constitution is {result[dominantDosha as keyof DoshaResult]}% {dominantDosha}
                </p>
              </CardContent>
            </Card>

            {/* Dosha Composition */}
            <Card className="border-none shadow-soft">
              <CardHeader>
                <CardTitle className="text-center">Your Dosha Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="w-64 h-8 bg-muted rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-400 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${result.vata}%` }}
                    >
                      {result.vata > 15 && `${result.vata}%`}
                    </div>
                    <div 
                      className="bg-orange-400 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${result.pitta}%` }}
                    >
                      {result.pitta > 15 && `${result.pitta}%`}
                    </div>
                    <div 
                      className="bg-green-400 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${result.kapha}%` }}
                    >
                      {result.kapha > 15 && `${result.kapha}%`}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Vata {result.vata}%
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    Pitta {result.pitta}%
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Kapha {result.kapha}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Dominant Dosha Characteristics */}
              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    {dominantDosha.charAt(0).toUpperCase() + dominantDosha.slice(1)} Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {info.characteristics.map((char, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span className="text-sm text-muted-foreground">{char}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommended Foods */}
              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Utensils className="h-5 w-5 text-primary mr-2" />
                    Recommended Foods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {info.foods.map((food, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span className="text-sm text-muted-foreground">{food}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Balancing Recommendations */}
            <Card className="border-none shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 text-primary mr-2" />
                  Balancing Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {info.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button onClick={resetQuiz} variant="outline">
                Take Quiz Again
              </Button>
              <Button onClick={onClose} className="bg-primary hover:bg-primary/90">
                Book Consultation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary mr-2" />
            Find Your Dosha
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Answer these quick questions for a personalized suggestion.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={answers.height || ''}
                    onChange={(e) => setAnswers({...answers, height: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="75"
                    value={answers.weight || ''}
                    onChange={(e) => setAnswers({...answers, weight: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep > 1 && currentStep <= questions.length + 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">
                {questions[currentStep - 2]?.question}
              </h3>
              <RadioGroup
                value={answers[questions[currentStep - 2]?.id as keyof QuizAnswers] || ''}
                onValueChange={(value) => setAnswers({
                  ...answers,
                  [questions[currentStep - 2]?.id]: value
                })}
              >
                {questions[currentStep - 2]?.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              {currentStep} of {questions.length + 1}
            </div>
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!answers.height || !answers.weight)) ||
                (currentStep > 1 && currentStep <= questions.length + 1 && 
                 !answers[questions[currentStep - 2]?.id as keyof QuizAnswers])
              }
            >
              {currentStep > questions.length ? 'Get Results' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoshaQuiz;