"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BarChart3, MessageSquare, Droplets, Leaf, CloudSun, Mountain } from "lucide-react"
import { PlantGrowth } from "@/components/plant-growth"

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Create transform values directly from scrollYProgress
  const plantGrowthProgress = useTransform(scrollYProgress, [0, 0.8], [0, 1])
  const plantY = useTransform(scrollYProgress, [0, 1], [0, 2200])

  return (
    <div ref={containerRef} className="relative min-h-[300vh] overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* Modern gradient mesh background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10" />
          
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          {/* Mesh grid pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, gray 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          
          {/* Floating particles/orbs effect */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-primary/30"
                animate={{
                  x: ['0%', '100%', '0%'],
                  y: ['0%', '100%', '0%'],
                }}
                transition={{
                  duration: Math.random() * 10 + 20,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto z-10"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Smart Farming for a <span className="text-primary">Sustainable</span> Future
          </h1>
          <p className="text-lg md:text-xl mb-8 text-foreground/80">
            Revolutionize your agricultural practices with real-time sensor data, AI-powered insights, and sustainable
            farming solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard">
                <BarChart3 className="h-5 w-5" />
                View Sensor Data
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/chatbot">
                <MessageSquare className="h-5 w-5" />
                AI Chatbot
              </Link>
            </Button>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="animate-bounce"
          >
            <p className="text-sm text-foreground/60">Scroll to explore</p>
            <div className="w-6 h-10 border-2 border-foreground/30 rounded-full mx-auto mt-2 flex justify-center">
              <motion.div
                animate={{
                  y: [0, 12, 0],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1.5,
                }}
                className="w-2 h-2 bg-primary rounded-full mt-2"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Animated Farm Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Growing Plants - Left (Maize) */}
        <motion.div className="absolute left-[5%] top-0 w-24 h-[60vh]" style={{ y: plantY }}>
          <PlantGrowth progress={plantGrowthProgress} variant="maize" />
        </motion.div>

        {/* Growing Plants - Right (Wheat) */}
        <motion.div className="absolute right-[5%] top-0 w-24 h-[60vh]" style={{ y: plantY }}>
          <PlantGrowth progress={plantGrowthProgress} variant="wheat" />
        </motion.div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Butterflies */}
        </div>
      </div>

      {/* Features Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-5 relative">
        <div className="max-w-6xl mx-auto z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Revolutionize Your Farming</h2>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
              Our smart farming platform combines cutting-edge technology with agricultural expertise to help you
              maximize yields while minimizing resource usage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Sensor Data",
                description:
                  "Monitor soil moisture, temperature, humidity, and more with our advanced sensor network.",
                icon: <Droplets className="h-10 w-10 text-primary" />,
              },
              {
                title: "AI-Powered Insights",
                description: "Get personalized recommendations and predictions based on your farm's unique conditions.",
                icon: <MessageSquare className="h-10 w-10 text-primary" />,
              },
              {
                title: "Weather Integration",
                description: "Stay ahead of changing weather patterns with accurate forecasts and alerts.",
                icon: <CloudSun className="h-10 w-10 text-primary" />,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-foreground/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-5 relative">
        <div className="max-w-6xl mx-auto z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Solution</h2>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
              Provides the following features:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Soil-Health Monitoring",
                description:
                  "Monitor soil moisture, temperature, humidity, and more with our advanced sensor network.",
                icon: <Mountain className="h-8 w-8 text-primary" />,
              },
              {
                title: "Irrigation Management",
                description: "Optimize irrigation schedules to conserve water while ensuring optimal crop growth.",
                icon: <Droplets className="h-8 w-8 text-primary" />,
              },
              {
                title: "Plant Disease Detection",
                description: "Detect and manage plant diseases early with AI-powered analysis.",
                icon: <Leaf className="h-8 w-8 text-primary" />,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border"
              >
                <div className="mb-2">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                <p className="text-foreground/70 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-10 px-4">
        <div className="absolute inset-0 bg-primary/10 -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Farm?</h2>
            <p className="text-lg mb-8 text-foreground/80 max-w-2xl mx-auto">
              Join thousands of farmers who are already using our platform to increase yields, reduce costs, and farm
              more sustainably.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/dashboard">Explore Dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/chatbot">Try AI Assistant</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

