"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Heart, Target, Sparkles } from "lucide-react";

const missions = [
  {
    icon: <Heart className="w-8 h-8 text-primary" />,
    title: "Our Purpose",
    description:
      "To transform mental wellness accessibility through conversational AI and distributed ledger systems, creating therapeutic support that's both scalable and deeply personal for individuals worldwide.",
  },
  {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: "Our Aspiration",
    description:
      "Creating a future where emotional wellbeing is supported by intelligent systems that understand human complexity while maintaining absolute confidentiality and data sovereignty.",
  },
  {
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "Our Principles",
    description:
      "User sovereignty, technological integrity, compassionate design, and transparent operations guide every aspect of our platform's development and user experience.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20"
      >
        <h1 className="text-4xl font-bold mb-6 bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          The MindSage Approach
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We&apos;re redefining emotional support by merging sophisticated
          conversational intelligence with the reliability and privacy
          assurances of decentralized technology frameworks.
        </p>
      </motion.div>

      {/* Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {missions.map((mission, index) => (
          <motion.div
            key={mission.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6 text-center h-full bg-card/50 backdrop-blur supports-backdrop-filter:bg-background/60">
              <div className="mb-4 flex justify-center">{mission.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{mission.title}</h3>
              <p className="text-muted-foreground">{mission.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
