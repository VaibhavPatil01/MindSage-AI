"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, Calendar, MapPin } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    location: "San Francisco, CA",
    joinDate: "Member for 8 months",
    avatar: "/avatars/alex.jpg",
    initials: "AC",
    rating: 5,
    content: "The conversational AI has been transformative for my daily stress management. It understands context in ways I didn't think possible for a digital assistant.",
    color: "from-blue-500/20 to-cyan-500/20",
    delay: 0.1,
  },
  {
    name: "Dr. Maya Rodriguez",
    role: "Clinical Psychologist",
    location: "Boston, MA",
    joinDate: "Member for 1 year",
    avatar: "/avatars/maya.jpg",
    initials: "MR",
    rating: 5,
    content: "As a mental health professional, I appreciate the research-backed methodologies. The platform demonstrates sophisticated understanding of therapeutic principles.",
    color: "from-purple-500/20 to-pink-500/20",
    delay: 0.2,
  },
  {
    name: "James Wilson",
    role: "University Student",
    location: "Austin, TX",
    joinDate: "Member for 5 months",
    avatar: "/avatars/james.jpg",
    initials: "JW",
    rating: 4,
    content: "The privacy-first approach gave me confidence to be completely open. The progress tracking has helped me see tangible improvements in my wellbeing.",
    color: "from-emerald-500/20 to-teal-500/20",
    delay: 0.3,
  },
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    location: "New York, NY",
    joinDate: "Member for 10 months",
    avatar: "/avatars/sarah.jpg",
    initials: "SJ",
    rating: 5,
    content: "Integrating with my smart home creates such a supportive environment. The ambient adjustments during sessions make a noticeable difference.",
    color: "from-amber-500/20 to-orange-500/20",
    delay: 0.4,
  },
  {
    name: "David Kim",
    role: "Startup Founder",
    location: "Seattle, WA",
    joinDate: "Member for 1.5 years",
    avatar: "/avatars/david.jpg",
    initials: "DK",
    rating: 5,
    content: "The blockchain verification gives me peace of mind about my data. It's rare to find technology that balances innovation with such strong privacy protection.",
    color: "from-indigo-500/20 to-violet-500/20",
    delay: 0.5,
  },
  {
    name: "Priya Sharma",
    role: "Teacher",
    location: "Chicago, IL",
    joinDate: "Member for 7 months",
    avatar: "/avatars/priya.jpg",
    initials: "PS",
    rating: 5,
    content: "The personalized goal pathways have helped me make consistent progress. The system adapts to my schedule and energy levels remarkably well.",
    color: "from-rose-500/20 to-red-500/20",
    delay: 0.6,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background/60" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
            <Quote className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">User Experiences</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-primary/90 to-primary bg-clip-text text-transparent dark:text-primary/90">
            Voices from Our Community
          </h2>
          <p className="text-foreground/80 dark:text-foreground/70 max-w-2xl mx-auto font-medium text-lg">
            Discover how individuals are transforming their mental wellness journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: testimonial.delay, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="group relative overflow-hidden h-full border border-border/50 hover:border-primary/20 transition-all duration-300 bg-card/30 dark:bg-card/80 backdrop-blur-sm">
                {/* Gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${testimonial.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />
                
                {/* Top decorative line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="p-6 h-full flex flex-col">
                  {/* Quote icon */}
                  <div className="mb-4">
                    <Quote className="w-8 h-8 text-primary/30" />
                  </div>

                  {/* Review content */}
                  <p className="text-foreground/90 dark:text-foreground/80 mb-6 flex-grow italic">
                  &quot;{testimonial.content}&quot;
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {testimonial.rating}.0
                    </span>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <Avatar className="h-10 w-10 border border-primary/10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                          <h4 className="font-semibold text-foreground truncate">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{testimonial.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{testimonial.joinDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Card className="inline-block px-6 py-4 border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 backdrop-blur-sm">
            <p className="text-foreground/80 dark:text-foreground/70 font-medium">
              Join <span className="text-primary font-semibold">2,500+</span> members in their wellness journey
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}