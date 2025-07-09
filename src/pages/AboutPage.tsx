import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Users,
  Globe,
  Heart,
  Code,
  Palette,
  Layers,
  Zap,
  Github,
  Twitter,
  Mail,
  ArrowRight,
} from 'lucide-react'

export default function AboutPage() {
  const team = [
    {
      name: 'AI Creative Team',
      role: 'System Architecture',
      description: 'Multi-agent AI system powering the creative platform',
    },
    {
      name: 'DEVELOPER Agent',
      role: 'Frontend Development',
      description: 'React, TypeScript, and WebGL implementation',
    },
    {
      name: 'ARCHITECT Agent',
      role: 'System Design',
      description: 'Architecture and technical specifications',
    },
    {
      name: 'DEPLOYER Agent',
      role: 'Infrastructure',
      description: 'GitHub Pages deployment and CI/CD pipeline',
    },
  ]

  const values = [
    {
      icon: Heart,
      title: 'Cultural Respect',
      description: 'Honoring the origins and significance of traditional patterns',
    },
    {
      icon: Globe,
      title: 'Global Heritage',
      description: 'Preserving and sharing cultural art forms from around the world',
    },
    {
      icon: Users,
      title: 'Creative Community',
      description: 'Building bridges between traditional artisans and digital creators',
    },
    {
      icon: Code,
      title: 'Modern Innovation',
      description: 'Using advanced web technologies to make heritage accessible',
    },
  ]

  const stats = [
    { label: 'Active Users', value: '10K+' },
    { label: 'Designs Created', value: '50K+' },
    { label: 'Countries', value: '120+' },
    { label: 'Team Members', value: '7' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, var(--secondary) 0%, transparent 50%)`,
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About <span className="gradient-text">Genshi Studio</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto">
              源始 (Genshi) means "origin" in Japanese. Our studio honors the origins of cultural art patterns 
              while pioneering new digital creative tools that respect tradition and embrace innovation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Our <span className="gradient-text">Mission</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              To preserve and celebrate cultural heritage through digital innovation, creating tools that 
              make traditional art patterns accessible to modern creators while respecting their origins 
              and cultural significance.
            </p>
          </motion.div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <value.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-text-secondary">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Meet the <span className="gradient-text">Team</span>
            </h2>
            <p className="text-xl text-text-secondary">
              Powered by the AI Creative Team System's specialized agents
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {member.name[0]}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                <p className="text-primary text-sm mb-2">{member.role}</p>
                <p className="text-text-secondary text-sm">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cultural Context Section */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Cultural <span className="gradient-text">Heritage</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Traditional Japanese patterns carry deep cultural meaning and artistic wisdom passed down through generations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Seigaiha',
                japanese: '青海波',
                meaning: 'Blue Ocean Wave',
                description: 'Represents tranquility, strength, and good fortune. This pattern symbolizes the power of the ocean and the peaceful waves that bring prosperity.',
                origin: 'Heian Period (794-1185)',
                color: 'from-blue-400 to-blue-600'
              },
              {
                name: 'Ichimatsu',
                japanese: '市松',
                meaning: 'Market Board',
                description: 'A checkered pattern representing expansion and growth. Named after kabuki actor Sanogawa Ichimatsu, it symbolizes prosperity and development.',
                origin: 'Edo Period (1603-1868)',
                color: 'from-gray-400 to-gray-600'
              },
              {
                name: 'Asanoha',
                japanese: '麻の葉',
                meaning: 'Hemp Leaf',
                description: 'Symbolizes healthy growth and protection. Hemp grows quickly and straight, making this pattern popular for children\'s clothing as a wish for healthy development.',
                origin: 'Heian Period (794-1185)',
                color: 'from-green-400 to-green-600'
              }
            ].map((pattern, index) => (
              <motion.div
                key={pattern.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-lg p-6 text-center shadow-lg"
              >
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${pattern.color} flex items-center justify-center`}>
                  <div className="text-white text-2xl font-bold">{pattern.japanese}</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{pattern.name}</h3>
                <p className="text-primary text-sm mb-2">{pattern.meaning}</p>
                <p className="text-text-secondary text-sm mb-4">{pattern.description}</p>
                <div className="text-xs text-text-secondary opacity-75">
                  Origin: {pattern.origin}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Built with <span className="gradient-text">Excellence</span>
            </h2>
            <p className="text-xl text-text-secondary">
              Leveraging the best of modern web technologies
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Code, name: 'React 18', desc: 'UI Framework' },
              { icon: Code, name: 'TypeScript', desc: 'Type Safety' },
              { icon: Palette, name: 'WebGL 2.0', desc: 'Graphics Engine' },
              { icon: Layers, name: 'Three.js', desc: '3D Graphics' },
              { icon: Zap, name: 'Vite', desc: 'Build Tool' },
              { icon: Code, name: 'Fabric.js', desc: 'Canvas Library' },
              { icon: Github, name: 'GitHub Pages', desc: 'Hosting' },
              { icon: Sparkles, name: 'AI Agents', desc: 'Development' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-surface rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <tech.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold">{tech.name}</h4>
                <p className="text-sm text-text-secondary">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-surface">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Have questions, feedback, or want to contribute? We'd love to hear from you!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/genshi-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex items-center space-x-2"
            >
              <Github size={20} />
              <span>GitHub</span>
            </a>
            <a
              href="https://twitter.com/genshistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Twitter size={20} />
              <span>Twitter</span>
            </a>
            <a
              href="mailto:hello@genshistudio.com"
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Mail size={20} />
              <span>Email</span>
            </a>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-8">
            Ready to Start Your <span className="gradient-text">Creative Journey?</span>
          </h2>
          <Link
            to="/studio"
            className="btn btn-primary btn-lg inline-flex items-center space-x-2"
          >
            <Sparkles size={24} />
            <span className="text-lg">Open Studio</span>
            <ArrowRight size={24} />
          </Link>
        </motion.div>
      </section>
    </div>
  )
}