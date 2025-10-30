import { FC, ElementType } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Truck,
  Clock,
  ShieldCheck,
  DollarSign,
  Globe2,
  Laptop,
  Package,
  Tag,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';

// ---------- Types ----------
interface Feature {
  icon: ElementType;
  title: string;
  text: string;
}

interface Category {
  name: string;
  icon: ElementType;
  gradient: string;
}

// ---------- Data ----------
const features: Feature[] = [
  {
    icon: DollarSign,
    title: 'Best Price Guarantee',
    text: 'Always the lowest verified price.',
  },
  {
    icon: ShieldCheck,
    title: 'Warranty & Trust',
    text: 'Every product is verified and warrantied.',
  },
  {
    icon: Truck,
    title: 'Doorstep Delivery',
    text: 'Islandwide delivery coverage.',
  },
  {
    icon: Clock,
    title: 'Fast Shipping',
    text: '1–3 Days 🚚 | 10–14 Days ✈️ | 30–45 Days 🚢',
  },
];

const categories: Category[] = [
  {
    name: 'Electronics',
    icon: Laptop,
    gradient: 'from-red-500/10 via-red-100 to-white',
  },
  {
    name: 'Home & Kitchen',
    icon: Package,
    gradient: 'from-orange-500/10 via-orange-100 to-white',
  },
  {
    name: 'Fashion',
    icon: Tag,
    gradient: 'from-pink-500/10 via-pink-100 to-white',
  },
];

// ---------- Animations ----------
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

// ---------- Component ----------
const LandingPage: FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col text-gray-900'>
      {/* Navbar */}
      <nav className='fixed top-0 left-0 right-0 backdrop-blur-md bg-white/80 border-b border-gray-200 z-50 py-4 px-8 flex justify-between items-center'>
        <h1 className='text-2xl font-extrabold tracking-tight text-red-700'>
          Made-in-China.lk
        </h1>
        <ul className='hidden md:flex gap-8 font-medium'>
          {['Home', 'About', 'Categories', 'Contact'].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className='relative group transition-colors'
              >
                {item}
                <span className='absolute left-0 bottom-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full' />
              </a>
            </li>
          ))}
        </ul>
        <a
          href='https://www.facebook.com/share/19vTwzDMzp/'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center justify-center bg-red-600 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg hover:bg-red-700 transition-all'
        >
          Get Started
        </a>
      </nav>

      {/* Hero */}
      <section
        id='home'
        className='relative bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white py-40 px-6 text-center mt-20 overflow-hidden'
      >
        <motion.div
          initial='hidden'
          animate='visible'
          variants={fadeUp}
          className='max-w-3xl mx-auto'
        >
          <h1 className='text-6xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg'>
            Import Smart. Save More. 🇱🇰
          </h1>
          <p className='text-lg md:text-2xl mb-10 opacity-90 leading-relaxed'>
            Sri Lanka’s trusted platform for importing directly from China 🇨🇳
            with warranty, tracking, and doorstep delivery.
          </p>
          <div className='flex justify-center gap-4'>
            <Button
              size='lg'
              className='bg-white text-red-700 font-semibold px-8 py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-all'
              variant='solid'
            >
              Explore Products
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='border-white text-white px-8 py-3 rounded-xl hover:bg-white hover:text-red-700 transition-all'
            >
              Learn More
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className='bg-gray-50 py-20 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center'>
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            initial='hidden'
            whileInView='visible'
            custom={i}
            viewport={{ once: true }}
          >
            <Card className='shadow-md border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all'>
              <CardContent className='p-8 flex flex-col items-center'>
                <f.icon
                  size={48}
                  className='text-red-600 mb-4'
                />
                <h3 className='text-xl font-bold mb-2'>{f.title}</h3>
                <p className='text-gray-600 text-sm'>{f.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Categories */}
      <section
        id='categories'
        className=' py-20 bg-white px-6 text-center overflow-hidden'
      >
        <motion.h2
          variants={fadeUp}
          initial='hidden'
          whileInView='visible'
          className='text-4xl md:text-5xl font-extrabold mb-12'
        >
          Top Categories
        </motion.h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto'>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              variants={fadeUp}
              initial='hidden'
              whileInView='visible'
              custom={i}
              whileHover={{ scale: 1.06, rotateX: 5, rotateY: -5 }}
              transition={{ type: 'spring', stiffness: 180 }}
            >
              <Card
                className={`rounded-2xl shadow-lg hover:shadow-2xl bg-gradient-to-br ${cat.gradient} transition-all duration-500`}
              >
                <CardContent className='p-10 flex flex-col items-center justify-center space-y-4'>
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className='p-4 rounded-full bg-white/70 backdrop-blur-sm shadow-md'
                  >
                    <cat.icon
                      size={48}
                      className='text-red-600'
                    />
                  </motion.div>
                  <p className='text-2xl font-semibold'>{cat.name}</p>
                  <p className='text-gray-500 text-sm'>
                    Explore trending {cat.name.toLowerCase()} collections now.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className='absolute -top-40 left-1/2 w-[400px] h-[400px] bg-red-500/20 blur-3xl rounded-full -translate-x-1/2 pointer-events-none' />
      </section>

      {/* About */}
      <section
        id='about'
        className='py-24 bg-gray-50 px-6 text-center max-w-5xl mx-auto'
      >
        <Globe2
          size={60}
          className='text-red-600 mx-auto mb-6'
        />
        <h2 className='text-4xl font-bold mb-4'>Why Choose Us?</h2>
        <p className='text-gray-600 text-lg leading-relaxed mb-10'>
          Direct access to verified Chinese suppliers. Genuine products,
          transparent transactions, warranty protection, and real-time tracking
          — all in one platform.
        </p>
        <div className='grid md:grid-cols-3 gap-8'>
          {['Authentic Suppliers', 'Secure Payments', 'Real-time Tracking'].map(
            (benefit, i) => (
              <Card
                key={i}
                className='bg-white border border-gray-200 shadow-md rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all'
              >
                <h3 className='text-xl font-semibold mb-2'>{benefit}</h3>
                <p className='text-gray-600 text-sm'>
                  Verified and transparent services for confidence in every
                  order.
                </p>
              </Card>
            )
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className='bg-gradient-to-r from-red-700 to-red-800 text-white py-24 px-6 text-center'>
        <h2 className='text-4xl font-bold mb-10'>What Our Customers Say</h2>
        <div className='grid md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
          {[
            {
              name: 'Amila Samarasinghe',
              text: 'Excellent quality and on-time delivery! The best import experience I’ve had.',
            },
            {
              name: 'Dinesh Fernando',
              text: 'I was amazed by the quality of the products and the customer service. Made in China truly delivers.',
            },
            {
              name: 'Thilini Perera',
              text: 'I was hesitant to import at first, but the team at Made in China was super helpful and made the process so smooth.',
            },
          ].map((testimonial) => (
            <Card
              key={testimonial.name}
              className='bg-white/10 backdrop-blur-sm border border-white/20 p-8 text-left rounded-2xl shadow-lg'
            >
              <p className='text-sm mb-4 italic opacity-90'>
                {testimonial.text}
              </p>
              <h4 className='font-bold'>{testimonial.name}</h4>
              <p className='text-xs opacity-75'>Colombo, Sri Lanka</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className='bg-gradient-to-r from-gray-900 to-gray-800 text-white py-24 px-6 text-center'>
        <h2 className='text-4xl font-bold mb-4'>
          Start Importing with Confidence
        </h2>
        <p className='mb-8 text-lg max-w-2xl mx-auto opacity-90'>
          Join thousands of Sri Lankans saving big and importing smart with
          trusted delivery.
        </p>
        <Button
          size='lg'
          className='bg-red-600 text-white font-semibold hover:bg-red-700 px-8 py-3 rounded-xl shadow-lg transition-all'
          variant={undefined}
        >
          <a
            href='https://www.facebook.com/share/19vTwzDMzp/'
            target='_blank'
            rel='noopener noreferrer'
          >
            Share on Facebook
          </a>
        </Button>
      </section>

      {/* Footer */}
      <footer
        id='contact'
        className='bg-gray-950 text-gray-400 py-16 px-6 text-center text-sm border-t border-gray-800'
      >
        <div className='mb-8'>
          <p className='mb-2 text-white text-lg font-semibold'>Contact Us</p>
          <p>Email: support@made-in-china.lk | Hotline: +94 71 123 4567</p>
        </div>
        <div className='flex justify-center gap-6 mb-8'>
          {[Facebook, Instagram, Youtube].map((Icon, i) => (
            <a
              key={i}
              href='#'
              className='text-gray-400 hover:text-white transition-all'
            >
              <Icon size={22} />
            </a>
          ))}
        </div>
        <p className='text-gray-500'>
          Developed by{' '}
          <a
            href='https://www.kalanex.com/'
            target='_blank'
            rel='noopener noreferrer'
          >
            Kala.Nex
          </a>
          <br />© {new Date().getFullYear()} Made-in-China.lk — All Rights
          Reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
