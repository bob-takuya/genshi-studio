import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Code2, Palette, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

export function HomePage() {
  const features = [
    {
      icon: Sparkles,
      title: 'Cultural Patterns',
      description: 'Explore and create with patterns from diverse cultures worldwide'
    },
    {
      icon: Code2,
      title: 'Hybrid Programming',
      description: 'Seamlessly switch between visual design and code-based creation'
    },
    {
      icon: Palette,
      title: 'Advanced Tools',
      description: 'Professional-grade drawing and design tools at your fingertips'
    },
    {
      icon: Globe,
      title: 'Web-First Design',
      description: 'Create graphics optimized for modern web experiences'
    }
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-6 py-20">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-accent" />
          <svg className="absolute inset-0 w-full h-full">
            <pattern
              id="hero-pattern"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="20" cy="20" r="1.5" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" className="pattern-animated" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Genshi Studio
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8"
          >
            Where cultural heritage meets modern design technology
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/studio"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Open Studio
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              View Gallery
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Create with Purpose
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Something Beautiful?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join a community of designers exploring the intersection of tradition and innovation
          </p>
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Creating
            <Sparkles className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}