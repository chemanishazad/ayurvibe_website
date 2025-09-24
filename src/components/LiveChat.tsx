import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, User, Bot, Phone, Mail } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Welcome to Ayurveda Hospital. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    'Book an appointment',
    'Treatment information',
    'Doctor consultation',
    'Location & hours',
    'Insurance questions'
  ];

  const botResponses = {
    'book an appointment': 'I\'d be happy to help you book an appointment! Please call us at 8122939197 or fill out our online booking form. What type of treatment are you interested in?',
    'treatment information': 'We offer various Ayurvedic treatments including Panchakarma, Abhyanga, Shirodhara, and more. Would you like details about a specific treatment?',
    'doctor consultation': 'Our experienced Ayurvedic doctors are available for consultations. Dr. Priya Sharma specializes in Panchakarma, Dr. Rajesh Kumar in chronic diseases, and Dr. Anita Gupta in digestive disorders. Which would you prefer?',
    'location & hours': 'We\'re located at Old Mahabalipuram Road, Sholinganallur, Chennai 600119. Our hours are Monday-Sunday 8:00 AM - 7:00 PM. Emergency consultations are available 24/7.',
    'insurance questions': 'We accept most major insurance plans. Please bring your insurance card to your appointment. For specific coverage questions, please call our billing department at 8122939197.',
    'default': 'Thank you for your message. For immediate assistance, please call us at 8122939197 or email info@ayurvedahospital.com. One of our team members will get back to you shortly!'
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const responseKey = messageText.toLowerCase();
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
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
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
              <div className="flex flex-wrap gap-1">
                {quickReplies.map((reply) => (
                  <Button
                    key={reply}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(reply)}
                    className="text-xs h-6 px-2"
                  >
                    {reply}
                  </Button>
                ))}
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