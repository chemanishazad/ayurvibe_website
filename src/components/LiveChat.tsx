import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, User, Bot, Phone, Mail, Calendar, Clock, MapPin, Star, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick_reply' | 'booking_form' | 'appointment_card';
  data?: any;
}

interface BookingData {
  fullName: string;
  age: string;
  mobile: string;
  email: string;
  inquiryType: string;
  preferredDate: string;
  preferredTime: string;
  treatment: string;
  notes: string;
}

interface BookingStep {
  step: number;
  question: string;
  field: keyof BookingData;
  type: 'text' | 'select' | 'date' | 'time' | 'textarea';
  options?: string[];
  required: boolean;
  validation?: (value: string) => boolean;
}

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Namaste! Welcome to Sri Vinayaga Ayurvibe. I\'m here to help you with Ayurvedic treatments, appointments, and wellness guidance. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [currentBookingStep, setCurrentBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({
    fullName: '',
    age: '',
    mobile: '',
    email: '',
    inquiryType: 'Consultation',
    preferredDate: '',
    preferredTime: '',
    treatment: '',
    notes: ''
  });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Step-by-step booking configuration
  const bookingSteps: BookingStep[] = [
    {
      step: 1,
      question: "Great! Let's book your appointment. What's your full name?",
      field: 'fullName',
      type: 'text',
      required: true,
      validation: (value) => value.length >= 2
    },
    {
      step: 2,
      question: "Nice to meet you! What's your age?",
      field: 'age',
      type: 'text',
      required: true,
      validation: (value) => !isNaN(Number(value)) && Number(value) > 0 && Number(value) < 120
    },
    {
      step: 3,
      question: "Perfect! What's your mobile number? (We'll use this to confirm your appointment)",
      field: 'mobile',
      type: 'text',
      required: true,
      validation: (value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))
    },
    {
      step: 4,
      question: "Excellent! What's your email address?",
      field: 'email',
      type: 'text',
      required: true,
      validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    {
      step: 5,
      question: "What type of appointment would you like to book?",
      field: 'inquiryType',
      type: 'select',
      options: ['Consultation', 'Panchakarma Detox', 'Abhyanga Massage', 'Shirodhara Therapy', 'Follow-up', 'Emergency'],
      required: true
    },
    {
      step: 6,
      question: "Great choice! What specific treatment are you interested in?",
      field: 'treatment',
      type: 'select',
      options: ['General Consultation', 'Panchakarma (14 days)', 'Abhyanga Massage', 'Shirodhara Therapy', 'Detox Treatment', 'Stress Management', 'Digestive Issues', 'Skin Problems', 'Women Health', 'Chronic Disease Management'],
      required: false
    },
    {
      step: 7,
      question: "When would you prefer to visit us? (Please enter date in YYYY-MM-DD format)",
      field: 'preferredDate',
      type: 'date',
      required: true,
      validation: (value) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      }
    },
    {
      step: 8,
      question: "Perfect! What time would work best for you?",
      field: 'preferredTime',
      type: 'select',
      options: ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'],
      required: true
    },
    {
      step: 9,
      question: "Almost done! Any specific health concerns or notes you'd like to share with Dr. Vaitheeshwari?",
      field: 'notes',
      type: 'textarea',
      required: false
    }
  ];

  const quickReplies = [
    { text: 'Book Appointment', action: 'booking', icon: Calendar },
    { text: 'Panchakarma Treatment', action: 'panchakarma', icon: Star },
    { text: 'Abhyanga Massage', action: 'abhyanga', icon: CheckCircle },
    { text: 'Shirodhara Therapy', action: 'shirodhara', icon: Star },
    { text: 'Dr. Vaitheeshwari', action: 'doctor', icon: User },
    { text: 'Location & Hours', action: 'location', icon: MapPin },
    { text: 'Treatment Costs', action: 'pricing', icon: CheckCircle },
    { text: 'Emergency Contact', action: 'emergency', icon: Phone }
  ];

  const treatments = [
    'Panchakarma Detox',
    'Abhyanga Massage',
    'Shirodhara Therapy',
    'Consultation',
    'Follow-up',
    'Emergency'
  ];

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const botResponses = {
    'booking': 'I\'d be happy to help you book an appointment! Let me gather some information from you.',
    'panchakarma': 'Panchakarma is our signature detox treatment that includes 5 cleansing procedures. It\'s perfect for deep detoxification and rejuvenation. Would you like to book a consultation?',
    'abhyanga': 'Abhyanga is our therapeutic oil massage that promotes relaxation and healing. It\'s excellent for stress relief and improving circulation. Shall I help you schedule a session?',
    'shirodhara': 'Shirodhara involves warm oil being poured on your forehead in a continuous stream. It\'s highly effective for stress, insomnia, and mental wellness. Would you like to book this treatment?',
    'doctor': 'Dr. Vaitheeshwari is our Chief Ayurvedic Doctor with BAMS qualification and extensive experience in traditional medicine. She specializes in Panchakarma, women\'s health, and chronic disease management. Would you like to book a consultation with her?',
    'location': 'We\'re located at No: 12/597, Main Road, Nethaji Nagar, Perumbakkam (Nookampalayam), Chennai 600131. Our hours are Monday-Friday: 10:00-19:00, Saturday: 10:00-18:00, Sunday: 10:00-16:00. We serve all Chennai areas including OMR, Sholinganallur, Pallikaranai, Navalur, Kelambakkam, and Tambaram.',
    'pricing': 'Our treatment costs are: Consultation: ₹500, Abhyanga: ₹2,000, Shirodhara: ₹2,500, Panchakarma (14 days): ₹15,000. We offer package deals and accept insurance. Would you like to book any treatment?',
    'emergency': 'For emergency consultations, please call us immediately at +91 8122939197. We provide 24/7 emergency Ayurvedic care for urgent health issues.',
    'default': 'Thank you for your message! For immediate assistance, please call us at +91 8122939197 or email sv.ayurvibe@gmail.com. Our team will get back to you shortly!'
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startBookingProcess = () => {
    setIsBooking(true);
    setCurrentBookingStep(0);
    const firstStep = bookingSteps[0];
    
    const botMessage: Message = {
      id: Date.now().toString(),
      text: firstStep.question,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  const handleBookingStep = (userInput: string) => {
    const currentStep = bookingSteps[currentBookingStep];
    const field = currentStep.field;
    
    // Validate input if validation function exists
    if (currentStep.validation && !currentStep.validation(userInput)) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: getValidationErrorMessage(field, userInput),
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    
    // Update booking data
    setBookingData(prev => ({ ...prev, [field]: userInput }));
    
    // Move to next step
    const nextStep = currentBookingStep + 1;
    
    if (nextStep < bookingSteps.length) {
      // Ask next question
      setTimeout(() => {
        const nextStepQuestion = bookingSteps[nextStep];
        const botMessage: Message = {
          id: Date.now().toString(),
          text: nextStepQuestion.question,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, botMessage]);
        setCurrentBookingStep(nextStep);
      }, 500);
    } else {
      // Booking complete - show summary and confirm
      setTimeout(() => {
        showBookingSummary();
      }, 500);
    }
  };

  const getValidationErrorMessage = (field: keyof BookingData, value: string): string => {
    switch (field) {
      case 'fullName':
        return "Please enter a valid name (at least 2 characters).";
      case 'age':
        return "Please enter a valid age (between 1 and 120).";
      case 'mobile':
        return "Please enter a valid 10-digit mobile number starting with 6-9.";
      case 'email':
        return "Please enter a valid email address.";
      case 'preferredDate':
        return "Please enter a valid future date in YYYY-MM-DD format.";
      default:
        return "Please enter a valid value.";
    }
  };

  const showBookingSummary = () => {
    const summary = `Perfect! Let me confirm your appointment details:

👤 **Name:** ${bookingData.fullName}
🎂 **Age:** ${bookingData.age}
📱 **Mobile:** ${bookingData.mobile}
📧 **Email:** ${bookingData.email}
🏥 **Appointment Type:** ${bookingData.inquiryType}
💊 **Treatment:** ${bookingData.treatment || 'General Consultation'}
📅 **Date:** ${bookingData.preferredDate}
⏰ **Time:** ${bookingData.preferredTime}
📝 **Notes:** ${bookingData.notes || 'None'}

Is this information correct? Type 'YES' to confirm or 'NO' to start over.`;

    const summaryMessage: Message = {
      id: Date.now().toString(),
      text: summary,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, summaryMessage]);
  };

  const confirmBooking = () => {
    setIsSending(true);
    
    const serviceId = 'service_2xlslze';
    const templateId = 'template_lp82pgb';
    const userId = 'mV3vPOsrHmeOvjZRA';

    const templateParams = {
      name: bookingData.fullName,
      age: bookingData.age,
      mobile: bookingData.mobile,
      email: bookingData.email,
      to_email: bookingData.email,
      to_name: bookingData.fullName,
      from_name: 'Sri Vinayaga Ayurvibe',
      reply_to: bookingData.email,
      inquiry_type: bookingData.inquiryType,
      preferred_date: bookingData.preferredDate,
      preferred_time: bookingData.preferredTime,
      treatment: bookingData.treatment,
      message: bookingData.notes,
      time: new Date().toString(),
    } as Record<string, unknown>;

    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: userId,
        template_params: templateParams,
      }),
    })
    .then(response => {
      if (response.ok) {
        const successMessage: Message = {
          id: Date.now().toString(),
          text: `🎉 **Appointment Confirmed!**

Thank you ${bookingData.fullName}! Your appointment has been successfully booked.

**Appointment Details:**
📅 Date: ${bookingData.preferredDate}
⏰ Time: ${bookingData.preferredTime}
🏥 Type: ${bookingData.inquiryType}

Our team will contact you within 2 hours to confirm all details. If you have any questions, please call us at +91 8122939197.

Thank you for choosing Sri Vinayaga Ayurvibe! 🙏`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Reset booking state
        setIsBooking(false);
        setCurrentBookingStep(0);
        setBookingData({
          fullName: '',
          age: '',
          mobile: '',
          email: '',
          inquiryType: 'Consultation',
          preferredDate: '',
          preferredTime: '',
          treatment: '',
          notes: ''
        });
        
        toast({
          title: "Appointment Confirmed!",
          description: "We'll contact you soon to confirm your appointment.",
        });
      } else {
        throw new Error('Failed to send appointment request');
      }
    })
    .catch(error => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `Sorry, there was an error processing your appointment. Please try again or call us directly at +91 8122939197.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    })
    .finally(() => {
      setIsSending(false);
    });
  };


  const handleSendMessage = (text?: string, action?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Handle step-by-step booking
    if (isBooking) {
      const upperText = messageText.toUpperCase();
      
      // Handle confirmation responses
      if (upperText === 'YES' || upperText === 'Y' || upperText === 'CONFIRM') {
        setTimeout(() => {
          confirmBooking();
          setIsTyping(false);
        }, 500);
        return;
      }
      
      if (upperText === 'NO' || upperText === 'N' || upperText === 'RESTART') {
        setTimeout(() => {
          const restartMessage: Message = {
            id: Date.now().toString(),
            text: "No problem! Let's start over. What's your full name?",
            sender: 'bot',
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, restartMessage]);
          setCurrentBookingStep(0);
          setBookingData({
            fullName: '',
            age: '',
            mobile: '',
            email: '',
            inquiryType: 'Consultation',
            preferredDate: '',
            preferredTime: '',
            treatment: '',
            notes: ''
          });
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // Handle current booking step
      setTimeout(() => {
        handleBookingStep(messageText);
        setIsTyping(false);
      }, 500);
      return;
    }

    // Handle regular chat
    setTimeout(() => {
      const responseKey = action || messageText.toLowerCase();
      let response = botResponses.default;
      
      // Check for matching keywords
      Object.keys(botResponses).forEach(key => {
        if (key !== 'default' && responseKey.includes(key)) {
          response = botResponses[key as keyof typeof botResponses];
        }
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Start booking process if requested
      if (action === 'booking' || responseKey.includes('book')) {
        setTimeout(() => {
          startBookingProcess();
        }, 1000);
      }
      
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 xs:bottom-5 xs:right-5 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)]">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Badge className="absolute -top-2 -left-2 bg-green-500 text-white animate-pulse">
          Online
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 xs:bottom-3 xs:right-3 sm:bottom-4 sm:right-4 z-50 w-full pointer-events-none flex justify-end pr-2">
      <Card className="pointer-events-auto w-[90vw] max-w-[20rem] sm:max-w-[22rem] h-[26rem] sm:h-96 shadow-2xl border-none bg-card flex flex-col">
        <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Ayurvibe Support</CardTitle>
                <p className="text-xs opacity-90">Usually replies instantly</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

  <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-4'
                      : 'bg-muted text-foreground mr-4'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground p-3 rounded-2xl mr-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Quick replies:</p>
              <div className="grid grid-cols-2 gap-1">
                {quickReplies.map((reply) => {
                  const IconComponent = reply.icon;
                  return (
                    <Button
                      key={reply.text}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(reply.text, reply.action)}
                      className="text-xs h-8 px-2 flex items-center justify-start"
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {reply.text}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button onClick={() => handleSendMessage()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                8122939197
              </div>
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                sv.ayurvibe@gmail.com
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default LiveChat;