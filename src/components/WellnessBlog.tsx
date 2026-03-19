import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Search, Leaf, Heart, Sparkles } from 'lucide-react';

// Import blog images
import doshaGuideImg from '@/assets/dosha-guide-blog.jpg';
import springDetoxImg from '@/assets/spring-detox-blog.jpg';
import morningRitualsImg from '@/assets/morning-rituals-blog.jpg';
import meditationImg from '@/assets/meditation-blog.jpg';
import nutritionImg from '@/assets/nutrition-blog.jpg';
import abhyangaBlogImg from '@/assets/abhyanga-blog.jpg';

const WellnessBlog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts = [
    {
      id: 1,
      title: 'Understanding Your Dosha: A Complete Guide to Ayurvedic Body Types',
      excerpt: 'Discover how knowing your dosha can transform your health and help you make better lifestyle choices aligned with your natural constitution.',
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
      category: 'Self Care',
      author: 'Dr. Rajesh Kumar',
      date: '2023-12-25',
      readTime: '4 min read',
      image: abhyangaBlogImg
    }
  ];

  const categories = ['all', 'Dosha Guide', 'Detox', 'Lifestyle', 'Mental Health', 'Nutrition', 'Self Care'];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Wellness Wisdom</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover ancient wisdom for modern living through our expert insights on Ayurvedic health, 
          wellness practices, and holistic healing approaches.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All Articles' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Article */}
      {selectedCategory === 'all' && !searchTerm && (
        <Card className="border-none shadow-soft overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <div className="h-64 md:h-full overflow-hidden">
                <img 
                  src={blogPosts[0].image} 
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:w-1/2 p-8">
              <Badge className="mb-4 bg-gold text-earth">
                {getCategoryIcon(blogPosts[0].category)}
                <span className="ml-2">Featured</span>
              </Badge>
              <h3 className="text-2xl font-bold text-foreground mb-4">{blogPosts[0].title}</h3>
              <p className="text-muted-foreground mb-6">{blogPosts[0].excerpt}</p>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {blogPosts[0].author}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(blogPosts[0].date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {blogPosts[0].readTime}
                </div>
              </div>
              
              <Button onClick={() => window.location.href = `/blog/${blogPosts[0].id}`}>Read Full Article</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.slice(selectedCategory === 'all' && !searchTerm ? 1 : 0).map((post) => (
          <Card key={post.id} className="border-none shadow-soft hover:shadow-warm transition-all duration-300 overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <Badge className="absolute top-4 left-4 bg-white/90 text-foreground">
                {getCategoryIcon(post.category)}
                <span className="ml-1">{post.category}</span>
              </Badge>
            </div>
            
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {post.readTime}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => window.location.href = `/blog/${post.id}`}
              >
                Read More
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No articles found matching your search criteria.</p>
          <Button 
            variant="outline" 
            onClick={() => {setSearchTerm(''); setSelectedCategory('all');}}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Newsletter Signup (removed per request) */}
    </div>
  );
};

export default WellnessBlog;