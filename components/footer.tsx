"use client";
import Link from "next/link";
import { 
  BrainCircuit, 
  Heart, 
  Github, 
  User, 
  Linkedin,
  Mail,
  Home,
  MessageSquare,
  BookOpen,
  Shield,
  Sparkles
} from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12 md:px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <BrainCircuit className="w-10 h-10 text-primary" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary 
                              text-transparent bg-clip-text">
                  MindSage AI
                </h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent Therapy
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your compassionate AI therapist companion. 
              Providing accessible, empathetic mental health support 
              through advanced AI technology.
            </p>
            
            <div className="text-sm text-muted-foreground">
  Made with <Heart className="inline w-4 h-4 mx-1 text-primary mb-0.5" /> by Vaibhav Patil
</div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Home className="w-4 h-4" />
              Navigation
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home", icon: Home },
                { href: "/therapy", label: "AI Therapy", icon: MessageSquare },
                { href: "/resources", label: "Resources", icon: BookOpen },
                { href: "/privacy", label: "Privacy & Safety", icon: Shield },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-muted-foreground 
                             hover:text-primary transition-colors group"
                  >
                    <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Resources
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/blog", label: "Mental Health Blog" },
                { href: "/techniques", label: "Therapy Techniques" },
                { href: "/research", label: "AI Research" },
                { href: "/faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary 
                             transition-colors hover:pl-2 duration-200 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Connect With Us
            </h4>
            
            <p className="text-sm text-muted-foreground">
              Follow our journey in revolutionizing mental health care with AI.
            </p>
            
            <div className="flex items-center gap-4 pt-2">
              {[
                { href: "https://github.com", icon: Github, label: "GitHub" },
                { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
                { href: "https://twitter.com", icon: User, label: "Twitter" },
                
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted text-muted-foreground 
                           hover:bg-primary hover:text-primary-foreground 
                           transition-all hover:scale-110 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
            
            <div className="pt-4">
              <a
                href="mailto:hello@mindsage.ai"
                className="inline-flex items-center gap-2 text-sm text-primary 
                         hover:text-primary/80 transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@mindsage.ai
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} MindSage AI. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Empowering mental wellness through ethical AI
              </p>
            </div>
            
            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              {[
                { href: "/", label: "Privacy Policy" },
                { href: "/", label: "Terms of Service" },
                { href: "/", label: "AI Ethics" },
                { href: "/", label: "Crisis Resources" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground 
                           transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Important Notice */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              <span className="font-semibold text-foreground">Important:</span>{" "}
              MindSage AI is an AI assistant and not a replacement for professional 
              medical advice, diagnosis, or treatment. Always seek the advice of 
              qualified health providers with any questions you may have.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}