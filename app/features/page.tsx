"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Brain,
  Shield,
  Fingerprint,
  Activity,
  Bot,
  LineChart,
  Wifi,
  Heart,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: <Bot className="w-10 h-10 text-primary" />,
    title: "Intelligent Conversation Partners",
    description:
      "Our AI companions are specifically designed to engage in meaningful dialogue, offering supportive conversations that adapt to your emotional needs throughout the day.",
  },
  {
    icon: <Shield className="w-10 h-10 text-primary" />,
    title: "Immutable Session Records",
    description:
      "Every interaction is permanently recorded on a distributed ledger, creating tamper-proof documentation of your therapeutic progress and insights.",
  },
  {
    icon: <Brain className="w-10 h-10 text-primary" />,
    title: "Contextual Understanding",
    description:
      "Our system analyzes conversation patterns and emotional cues to provide responses that reflect deep comprehension of your current state and history.",
  },
  {
    icon: <Activity className="w-10 h-10 text-primary" />,
    title: "Wellness Monitoring System",
    description:
      "Continuous assessment of behavioral patterns allows for timely interventions and support when signs of emotional distress are detected.",
  },
  {
    icon: <Wifi className="w-10 h-10 text-primary" />,
    title: "Connected Environment Support",
    description:
      "Synchronize with compatible devices in your living space to create personalized atmospheres that promote calmness and focus during sessions.",
  },
  {
    icon: <LineChart className="w-10 h-10 text-primary" />,
    title: "Growth Visualization",
    description:
      "Interactive dashboards display your emotional development over time, highlighting patterns, breakthroughs, and areas for continued focus.",
  },
  {
    icon: <Fingerprint className="w-10 h-10 text-primary" />,
    title: "Confidentiality Assurance",
    description:
      "Multi-layered encryption protocols and privacy-preserving technologies ensure that your personal journey remains accessible only to you.",
  },
  {
    icon: <Heart className="w-10 h-10 text-primary" />,
    title: "Integrated Wellness Approach",
    description:
      "Connect with health monitoring tools and professional networks to create a comprehensive picture of your mental and physical wellbeing.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Platform Features
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore how our platform combines advanced technology with human-centric 
          design to support your mental wellness journey with unprecedented depth and privacy.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-center mt-20"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">
            Begin Your Personalized Journey
          </h2>
          <p className="text-muted-foreground mb-8">
            Join a community where technology empowers human connection, 
            and every step forward is celebrated and secured.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Sparkles className="mr-3 w-5 h-5" />
            Discover Your Pathway
            <TrendingUp className="ml-3 w-5 h-5" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}