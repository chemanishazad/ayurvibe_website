import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Share2, Leaf, Heart, Sparkles } from 'lucide-react';

// Import blog images
import doshaGuideImg from '@/assets/dosha-guide-blog.jpg';
import springDetoxImg from '@/assets/spring-detox-blog.jpg';
import morningRitualsImg from '@/assets/morning-rituals-blog.jpg';
import meditationImg from '@/assets/meditation-blog.jpg';
import nutritionImg from '@/assets/nutrition-blog.jpg';
import abhyangaBlogImg from '@/assets/abhyanga-blog.jpg';
import logo from '@/assets/logo.png';

const BlogPost = () => {
  const { id } = useParams();
  
  const blogPosts = [
    {
      id: 1,
      title: 'Understanding Your Dosha: A Complete Guide to Ayurvedic Body Types',
      excerpt: 'Discover how knowing your dosha can transform your health and help you make better lifestyle choices aligned with your natural constitution.',
      content: `
        <h2>Introduction to Doshas</h2>
        <p>In Ayurveda, the ancient science of life, your dosha represents your unique constitutional blueprint. Understanding your dominant dosha - Vata, Pitta, or Kapha - is like discovering your body's operating manual.</p>
        
        <h3>The Three Doshas Explained</h3>
        <p><strong>Vata (Air + Space):</strong> Governs movement, circulation, and nervous system function. Vata types are typically creative, energetic, and quick-thinking but may struggle with anxiety and irregular routines.</p>
        
        <p><strong>Pitta (Fire + Water):</strong> Controls metabolism, digestion, and transformation. Pitta individuals are usually focused, ambitious, and have strong digestive fire but may be prone to anger and inflammation.</p>
        
        <p><strong>Kapha (Earth + Water):</strong> Manages structure, immunity, and stability. Kapha types are generally calm, stable, and have good stamina but may experience sluggishness and weight gain.</p>
        
        <h3>Identifying Your Dosha</h3>
        <p>Your dosha influences everything from your physical appearance to your emotional tendencies and ideal daily routine. While most people have a combination of all three doshas, one or two usually predominate.</p>
        
        <h3>Living According to Your Dosha</h3>
        <p>Once you understand your dosha, you can make informed choices about diet, exercise, sleep patterns, and lifestyle practices that support your natural constitution and promote optimal health.</p>
      `,
      category: 'Dosha Guide',
      author: 'Dr. Priya Sharma',
      date: '2024-01-15',
      readTime: '8 min read',
      image: doshaGuideImg,
      featured: true
    },
    {
      id: 2,
      title: 'Seasonal Detox: Spring Cleanse with Ayurvedic Principles',
      excerpt: 'Learn how to cleanse your body naturally this spring using time-tested Ayurvedic detoxification methods and seasonal foods.',
      content: `
        <h2>Why Spring Detox is Essential</h2>
        <p>Spring is nature's time for renewal and cleansing. According to Ayurveda, this is the ideal season to eliminate accumulated toxins (ama) from winter and prepare your body for the warmer months ahead.</p>
        
        <h3>Ayurvedic Spring Cleanse Principles</h3>
        <p>Unlike harsh modern detox programs, Ayurvedic cleansing is gentle and sustainable. It focuses on supporting your body's natural detoxification processes through proper diet, lifestyle practices, and herbal support.</p>
        
        <h3>Foods for Spring Detox</h3>
        <p>Emphasize light, easily digestible foods like leafy greens, bitter vegetables, and warming spices. Reduce heavy, oily, and sweet foods that can increase Kapha dosha during this season.</p>
        
        <h3>Daily Practices</h3>
        <p>Start your day with warm lemon water, practice gentle yoga, and ensure adequate rest. These simple practices support your liver and digestive system in their natural cleansing work.</p>
      `,
      category: 'Detox',
      author: 'Dr. Rajesh Kumar',
      date: '2024-01-10',
      readTime: '6 min read',
      image: springDetoxImg
    },
    {
      id: 3,
      title: '10 Morning Rituals for Better Digestion According to Ayurveda',
      excerpt: 'Start your day right with these simple Ayurvedic practices that will improve your digestive fire and overall energy levels.',
      content: `
        <h2>The Importance of Morning Routine in Ayurveda</h2>
        <p>How you start your morning sets the tone for your entire day. Ayurveda emphasizes the importance of establishing consistent morning rituals to support your digestive fire (agni) and overall well-being.</p>
        
        <h3>10 Essential Morning Practices</h3>
        <p><strong>1. Wake up before sunrise:</strong> Align with natural rhythms for better energy.</p>
        <p><strong>2. Drink warm water:</strong> Kickstart your digestive system gently.</p>
        <p><strong>3. Tongue scraping:</strong> Remove toxins and improve taste perception.</p>
        <p><strong>4. Oil pulling:</strong> Swish sesame or coconut oil for oral health.</p>
        <p><strong>5. Gentle stretching:</strong> Activate circulation and flexibility.</p>
        <p><strong>6. Deep breathing:</strong> Oxygenate your system and calm the mind.</p>
        <p><strong>7. Meditation:</strong> Center yourself for the day ahead.</p>
        <p><strong>8. Abhyanga (self-massage):</strong> Nourish your skin and nervous system.</p>
        <p><strong>9. Warm shower:</strong> Complete the cleansing process.</p>
        <p><strong>10. Nutritious breakfast:</strong> Fuel your body with appropriate foods for your dosha.</p>
        
        <h3>Adapting to Your Dosha</h3>
        <p>Customize these practices based on your dominant dosha for maximum benefit and sustainability.</p>
      `,
      category: 'Lifestyle',
      author: 'Dr. Anita Gupta',
      date: '2024-01-05',
      readTime: '5 min read',
      image: morningRitualsImg
    },
    {
      id: 4,
      title: 'Stress Management Through Meditation and Pranayama',
      excerpt: 'Explore ancient breathing techniques and meditation practices that can help you manage stress and anxiety naturally.',
      content: `
        <h2>Understanding Stress from an Ayurvedic Perspective</h2>
        <p>Stress disrupts the delicate balance of your doshas, particularly increasing Vata dosha. This can lead to anxiety, insomnia, digestive issues, and weakened immunity.</p>
        
        <h3>The Power of Pranayama</h3>
        <p>Pranayama, or controlled breathing, is one of the most effective tools for managing stress. These techniques help regulate your nervous system and bring immediate calm to mind and body.</p>
        
        <h3>Essential Breathing Techniques</h3>
        <p><strong>Nadi Shodhana (Alternate Nostril Breathing):</strong> Balances the nervous system and calms the mind.</p>
        <p><strong>Ujjayi Breath:</strong> Creates internal heat and focus, perfect for meditation.</p>
        <p><strong>Bhramari (Bee Breath):</strong> Soothes the nervous system and reduces anxiety.</p>
        
        <h3>Meditation for Daily Peace</h3>
        <p>Regular meditation practice helps you develop resilience to stress and maintains emotional balance. Start with just 5-10 minutes daily and gradually increase as the practice becomes natural.</p>
        
        <h3>Creating Your Stress Management Routine</h3>
        <p>Combine these practices with lifestyle adjustments like regular sleep schedule, nourishing diet, and gentle exercise for comprehensive stress management.</p>
      `,
      category: 'Mental Health',
      author: 'Dr. Priya Sharma',
      date: '2024-01-01',
      readTime: '7 min read',
      image: meditationImg
    },
    {
      id: 5,
      title: 'Ayurvedic Nutrition: Eating for Your Body Type',
      excerpt: 'Discover how to choose the right foods for your dosha and create meal plans that support your unique constitution.',
      content: `
        <h2>Food as Medicine</h2>
        <p>In Ayurveda, food is considered medicine when chosen and prepared correctly for your constitution. Understanding how different foods affect your dosha helps you make choices that support optimal health.</p>
        
        <h3>Nutrition for Each Dosha</h3>
        <p><strong>Vata Nutrition:</strong> Favor warm, moist, grounding foods. Include healthy fats, cooked grains, and sweet fruits. Avoid raw, cold, and dry foods.</p>
        
        <p><strong>Pitta Nutrition:</strong> Choose cooling, moderate foods. Include sweet fruits, leafy greens, and dairy. Limit spicy, sour, and salty foods.</p>
        
        <p><strong>Kapha Nutrition:</strong> Opt for light, warming, and stimulating foods. Include spices, bitter vegetables, and legumes. Reduce heavy, sweet, and oily foods.</p>
        
        <h3>The Six Tastes</h3>
        <p>Ayurveda recognizes six tastes - sweet, sour, salty, pungent, bitter, and astringent. Including all tastes in appropriate proportions helps balance your doshas and satisfies your body's nutritional needs.</p>
        
        <h3>Mindful Eating Practices</h3>
        <p>How you eat is as important as what you eat. Practice eating in a calm environment, chewing thoroughly, and expressing gratitude for your food.</p>
      `,
      category: 'Nutrition',
      author: 'Dr. Anita Gupta',
      date: '2023-12-28',
      readTime: '9 min read',
      image: nutritionImg
    },
    {
      id: 6,
      title: 'The Power of Abhyanga: Self-Massage for Daily Wellness',
      excerpt: 'Learn the art of self-massage with herbal oils and its incredible benefits for skin, circulation, and mental wellbeing.',
      content: `
        <h2>What is Abhyanga?</h2>
        <p>Abhyanga is the ancient Ayurvedic practice of self-massage with warm oil. This daily ritual nourishes your skin, calms your nervous system, and promotes overall well-being.</p>
        
        <h3>Benefits of Daily Oil Massage</h3>
        <p>Regular abhyanga improves circulation, enhances skin texture, reduces signs of aging, promotes better sleep, and helps manage stress and anxiety.</p>
        
        <h3>Choosing the Right Oil</h3>
        <p><strong>For Vata:</strong> Sesame oil or specialized Vata-balancing oil blends</p>
        <p><strong>For Pitta:</strong> Coconut oil or cooling herbal oils</p>
        <p><strong>For Kapha:</strong> Mustard oil or warming, stimulating oil blends</p>
        
        <h3>How to Practice Abhyanga</h3>
        <p>Warm the oil slightly, start with circular motions on joints and long strokes on limbs. Begin with your head and work downward, spending extra time on areas that need attention.</p>
        
        <h3>Making it a Daily Ritual</h3>
        <p>Start with just 5-10 minutes daily, preferably before your morning shower. As you experience the benefits, you may naturally want to extend the practice.</p>
      `,
      category: 'Self Care',
      author: 'Dr. Rajesh Kumar',
      date: '2023-12-25',
      readTime: '4 min read',
      image: abhyangaBlogImg
    }
  ];

  const currentPost = blogPosts.find(post => post.id === parseInt(id || '1'));
  
  if (!currentPost) {
    return (
      <div className="min-h-screen bg-gradient-healing flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">Sorry, the article you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Dosha Guide': return <User className="h-4 w-4" />;
      case 'Detox': return <Sparkles className="h-4 w-4" />;
      case 'Lifestyle': return <Leaf className="h-4 w-4" />;
      case 'Mental Health': return <Heart className="h-4 w-4" />;
      case 'Nutrition': return <Leaf className="h-4 w-4" />;
      case 'Self Care': return <Heart className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-healing">
      {/* Header with Logo and Navigation */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <img src={logo} alt="Sri Vinayaga Ayurvibe Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-primary">Sri Vinayaga Ayurvibe</h1>
                <p className="text-sm text-muted-foreground">Dr. Vaitheeshwari BAMS</p>
              </div>
            </Link>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Article Header */}
        <div className="mb-8">
          <Badge className="mb-4 bg-gold text-earth">
            {getCategoryIcon(currentPost.category)}
            <span className="ml-2">{currentPost.category}</span>
          </Badge>
          
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {currentPost.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              {currentPost.author}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(currentPost.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {currentPost.readTime}
            </div>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-12 rounded-2xl overflow-hidden shadow-warm">
          <img 
            src={currentPost.image} 
            alt={currentPost.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>

        {/* Article Body */}
        <Card className="border-none shadow-soft mb-12">
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: currentPost.content }}
              style={{
                color: 'hsl(var(--foreground))',
              }}
            />
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-none shadow-soft bg-gradient-gold text-earth">
          <CardContent className="p-8 text-center">
            <Leaf className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Experience Personalized Ayurvedic Care</h3>
            <p className="mb-6 opacity-90">
              Ready to start your healing journey? Book a consultation with our expert practitioners 
              and discover personalized treatments for your unique constitution.
            </p>
            <Button asChild className="bg-earth text-gold hover:bg-earth/90">
              <Link to="/#booking">Book Consultation</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BlogPost;