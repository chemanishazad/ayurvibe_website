import React from 'react';
import { useParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Clock, Star, CheckCircle, Leaf, Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocationData {
  name: string;
  displayName: string;
  description: string;
  distance: string;
  travelTime: string;
  services: string[];
  testimonials: Array<{
    name: string;
    text: string;
    rating: number;
  }>;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

const locationData: Record<string, LocationData> = {
  'perumbakkam': {
    name: 'Perumbakkam',
    displayName: 'Perumbakkam',
    description: 'Located in the heart of Perumbakkam, our Ayurveda hospital serves the local community with authentic traditional treatments.',
    distance: '0.5 km',
    travelTime: '2 minutes',
    services: ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Detox', 'Consultation'],
    testimonials: [
      {
        name: 'Rajesh Kumar',
        text: 'Living in Perumbakkam, this hospital is so convenient. Dr. Vaitheeshwari\'s treatments cured my chronic back pain.',
        rating: 5
      },
      {
        name: 'Priya Menon',
        text: 'Best Ayurveda hospital near Perumbakkam. The Panchakarma treatment was life-changing.',
        rating: 5
      }
    ],
    seoTitle: 'Best Ayurveda Hospital in Perumbakkam Chennai | Sri Vinayaga Ayurvibe',
    seoDescription: '🏆 #1 Ayurveda Hospital in Perumbakkam Chennai! Expert Panchakarma, Abhyanga, Shirodhara treatments by Dr. Vaitheeshwari BAMS. Government certified. Book now!',
    keywords: ['Ayurveda hospital Perumbakkam', 'Perumbakkam Ayurveda clinic', 'best Ayurveda Perumbakkam', 'Panchakarma Perumbakkam', 'Abhyanga Perumbakkam', 'Shirodhara Perumbakkam', 'Dr Vaitheeshwari Perumbakkam']
  },
  'omr': {
    name: 'OMR',
    displayName: 'OMR Chennai',
    description: 'Conveniently located near OMR, our Ayurveda hospital provides easy access to authentic Ayurvedic treatments for IT professionals and residents.',
    distance: '3.2 km',
    travelTime: '8 minutes',
    services: ['Stress Management', 'Panchakarma', 'Abhyanga', 'Shirodhara', 'Corporate Wellness'],
    testimonials: [
      {
        name: 'Arun Sharma',
        text: 'Working in OMR, this hospital is perfect for my stress management needs. The Shirodhara therapy is amazing.',
        rating: 5
      },
      {
        name: 'Deepa Nair',
        text: 'Easy to reach from OMR. The detox treatment helped me overcome work-related health issues.',
        rating: 5
      }
    ],
    seoTitle: 'Best Ayurveda Hospital near OMR Chennai | Sri Vinayaga Ayurvibe',
    seoDescription: '🏆 #1 Ayurveda Hospital near OMR Chennai! Expert stress management, Panchakarma, Abhyanga treatments by Dr. Vaitheeshwari BAMS. Perfect for IT professionals. Book now!',
    keywords: ['Ayurveda hospital OMR', 'OMR Ayurveda clinic', 'best Ayurveda OMR', 'Panchakarma OMR', 'stress management OMR', 'corporate wellness OMR', 'Dr Vaitheeshwari OMR']
  },
  'sholinganallur': {
    name: 'Sholinganallur',
    displayName: 'Sholinganallur',
    description: 'Serving Sholinganallur and surrounding areas with comprehensive Ayurvedic treatments and holistic wellness programs.',
    distance: '4.1 km',
    travelTime: '10 minutes',
    services: ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Women Health', 'Digestive Disorders'],
    testimonials: [
      {
        name: 'Meera Patel',
        text: 'Coming from Sholinganallur, the journey is worth it. The women health treatments are excellent.',
        rating: 5
      },
      {
        name: 'Vikram Singh',
        text: 'Best Ayurveda treatment near Sholinganallur. The digestive disorder treatment worked wonders.',
        rating: 5
      }
    ],
    seoTitle: 'Best Ayurveda Hospital in Sholinganallur Chennai | Sri Vinayaga Ayurvibe',
    seoDescription: '🏆 #1 Ayurveda Hospital in Sholinganallur Chennai! Expert Panchakarma, Abhyanga, women health treatments by Dr. Vaitheeshwari BAMS. Government certified. Book now!',
    keywords: ['Ayurveda hospital Sholinganallur', 'Sholinganallur Ayurveda clinic', 'best Ayurveda Sholinganallur', 'Panchakarma Sholinganallur', 'women health Sholinganallur', 'digestive disorders Sholinganallur', 'Dr Vaitheeshwari Sholinganallur']
  },
  'pallikaranai': {
    name: 'Pallikaranai',
    displayName: 'Pallikaranai',
    description: 'Providing authentic Ayurvedic treatments to Pallikaranai residents with personalized care and traditional healing methods.',
    distance: '2.8 km',
    travelTime: '7 minutes',
    services: ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Skin Health', 'Mental Health'],
    testimonials: [
      {
        name: 'Suresh Reddy',
        text: 'From Pallikaranai, this hospital is easily accessible. The skin health treatment cured my condition naturally.',
        rating: 5
      },
      {
        name: 'Lakshmi Devi',
        text: 'Best Ayurveda hospital near Pallikaranai. The mental health treatments are very effective.',
        rating: 5
      }
    ],
    seoTitle: 'Best Ayurveda Hospital in Pallikaranai Chennai | Sri Vinayaga Ayurvibe',
    seoDescription: '🏆 #1 Ayurveda Hospital in Pallikaranai Chennai! Expert Panchakarma, Abhyanga, skin health treatments by Dr. Vaitheeshwari BAMS. Government certified. Book now!',
    keywords: ['Ayurveda hospital Pallikaranai', 'Pallikaranai Ayurveda clinic', 'best Ayurveda Pallikaranai', 'Panchakarma Pallikaranai', 'skin health Pallikaranai', 'mental health Pallikaranai', 'Dr Vaitheeshwari Pallikaranai']
  },
  'navalur': {
    name: 'Navalur',
    displayName: 'Navalur',
    description: 'Conveniently located for Navalur residents, offering comprehensive Ayurvedic treatments and wellness programs.',
    distance: '5.2 km',
    travelTime: '12 minutes',
    services: ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Chronic Disease Management', 'Rejuvenation'],
    testimonials: [
      {
        name: 'Anita Rao',
        text: 'Traveling from Navalur is worth it. The chronic disease management program improved my quality of life.',
        rating: 5
      },
      {
        name: 'Manoj Kumar',
        text: 'Best rejuvenation therapy near Navalur. The Panchakarma treatment was transformative.',
        rating: 5
      }
    ],
    seoTitle: 'Best Ayurveda Hospital in Navalur Chennai | Sri Vinayaga Ayurvibe',
    seoDescription: '🏆 #1 Ayurveda Hospital in Navalur Chennai! Expert Panchakarma, Abhyanga, chronic disease management by Dr. Vaitheeshwari BAMS. Government certified. Book now!',
    keywords: ['Ayurveda hospital Navalur', 'Navalur Ayurveda clinic', 'best Ayurveda Navalur', 'Panchakarma Navalur', 'chronic disease Navalur', 'rejuvenation Navalur', 'Dr Vaitheeshwari Navalur']
  },
  'kelambakkam': {
    name: 'Kelambakkam',
    displayName: 'Kelambakkam',
    description: 'Serving Kelambakkam and nearby areas with authentic Ayurvedic treatments and personalized healthcare solutions.',
    distance: '6.5 km',
    travelTime: '15 minutes',
    services: ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Herbal Medicine', 'Wellness Consultation'],
    testimonials: [
      {
        name: 'Ravi Chandran',
        text: 'From Kelambakkam, this hospital provides the best herbal medicine treatments in Chennai.',
        rating: 5
      },
      {
        name: 'Sunita Krishnan',
        text: 'Best wellness consultation near Kelambakkam. Dr. Vaitheeshwari\'s approach is holistic and effective.',
        rating: 5
      }
    ],
    seoTitle: 'Best Ayurveda Hospital in Kelambakkam Chennai | Sri Vinayaga Ayurvibe',
    seoDescription: '🏆 #1 Ayurveda Hospital in Kelambakkam Chennai! Expert Panchakarma, Abhyanga, herbal medicine by Dr. Vaitheeshwari BAMS. Government certified. Book now!',
    keywords: ['Ayurveda hospital Kelambakkam', 'Kelambakkam Ayurveda clinic', 'best Ayurveda Kelambakkam', 'Panchakarma Kelambakkam', 'herbal medicine Kelambakkam', 'wellness consultation Kelambakkam', 'Dr Vaitheeshwari Kelambakkam']
  },
  'tambaram': {
    name: 'Tambaram',
    displayName: 'Tambaram',
    description: 'Providing comprehensive Ayurvedic healthcare to Tambaram residents with traditional treatments and modern facilities.',
    distance: '8.3 km',
    travelTime: '18 minutes',
    services: ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Traditional Medicine', 'Alternative Medicine'],
    testimonials: [
      {
        name: 'Geetha Raman',
        text: 'Coming from Tambaram, this hospital offers the most authentic traditional medicine treatments.',
        rating: 5
      },
      {
        name: 'Krishna Murthy',
        text: 'Best alternative medicine near Tambaram. The treatments are natural and effective.',
        rating: 5
      }
    ],
    seoTitle: 'Best Ayurveda Hospital in Tambaram Chennai | Sri Vinayaga Ayurvibe',
    seoDescription: '🏆 #1 Ayurveda Hospital in Tambaram Chennai! Expert Panchakarma, Abhyanga, traditional medicine by Dr. Vaitheeshwari BAMS. Government certified. Book now!',
    keywords: ['Ayurveda hospital Tambaram', 'Tambaram Ayurveda clinic', 'best Ayurveda Tambaram', 'Panchakarma Tambaram', 'traditional medicine Tambaram', 'alternative medicine Tambaram', 'Dr Vaitheeshwari Tambaram']
  }
};

const LocationPage: React.FC = () => {
  const { location } = useParams<{ location: string }>();
  

  // Map URL paths to location data
  const locationMap: Record<string, string> = {
    'ayurveda-hospital-perumbakkam-chennai': 'perumbakkam',
    'ayurveda-clinic-omr-chennai': 'omr',
    'ayurveda-treatment-sholinganallur-chennai': 'sholinganallur',
    'panchakarma-pallikaranai-chennai': 'pallikaranai',
    'abhyanga-massage-navalur-chennai': 'navalur',
    'shirodhara-therapy-kelambakkam-chennai': 'kelambakkam',
    'ayurveda-doctor-tambaram-chennai': 'tambaram'
  };
  
  const locationKey = locationMap[location || ''] || location;
  
  if (!locationKey || !locationData[locationKey]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Location Not Found</h1>
          <p className="text-gray-600 mt-2">The requested location page does not exist.</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const data = locationData[locationKey];

  return (
    <div className="min-h-screen bg-gradient-healing">
      <SEO
        title={data.seoTitle}
        description={data.seoDescription}
        canonical={`https://svayurvibe.com/ayurveda-hospital-${location}-chennai`}
        locationKeywords={data.keywords}
        jsonLd={[
          {
            "@type": "MedicalBusiness",
            "name": `Sri Vinayaga Ayurvibe - ${data.displayName}`,
            "description": data.description,
            "areaServed": {
              "@type": "City",
              "name": data.displayName,
              "containedInPlace": {
                "@type": "City",
                "name": "Chennai"
              }
            },
            "medicalSpecialty": data.services,
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "50+"
            }
          }
        ]}
      />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            Serving {data.displayName}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            Best Ayurveda Hospital in {data.displayName}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {data.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm">
              <MapPin className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium">{data.distance} from {data.displayName}</span>
            </div>
            <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium">{data.travelTime} travel time</span>
            </div>
            <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-sm font-medium">4.9/5 Rating</span>
            </div>
          </div>
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            <Phone className="w-5 h-5 mr-2" />
            Book Appointment Now
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Ayurvedic Services Available for {data.displayName} Residents
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">{service}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Expert {service.toLowerCase()} treatment available for {data.displayName} residents
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            What {data.displayName} Residents Say
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {data.testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-500">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{testimonial.name}</span>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-green-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Experience Authentic Ayurveda in {data.displayName}?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Book your consultation with Dr. Vaitheeshwari BAMS today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Phone className="w-5 h-5 mr-2" />
              Call +91 8122939197
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
              <Heart className="w-5 h-5 mr-2" />
              Book Online
            </Button>
          </div>
        </div>
      </section>

      {/* Location Info */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Conveniently Located for {data.displayName} Residents
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Access</h3>
              <p className="text-gray-600">Just {data.distance} from {data.displayName}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Travel</h3>
              <p className="text-gray-600">Only {data.travelTime} travel time</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Community</h3>
              <p className="text-gray-600">Serving {data.displayName} residents</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocationPage;
