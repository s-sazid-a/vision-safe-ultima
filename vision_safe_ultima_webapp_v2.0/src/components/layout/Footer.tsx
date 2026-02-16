import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Phone, MapPin, Github, Twitter, Linkedin, Youtube } from "lucide-react";

const footerLinks = {
    product: [
        { name: "Features", path: "/features" },
        { name: "How It Works", path: "/how-it-works" },
        { name: "Pricing", path: "/pricing" },
        { name: "Testimonials", path: "/testimonials" },
    ],
    company: [
        { name: "About Us", path: "#" },
        { name: "Careers", path: "#" },
        { name: "Blog", path: "#" },
        { name: "Press", path: "#" },
    ],
    legal: [
        { name: "Privacy Policy", path: "#" },
        { name: "Terms of Service", path: "#" },
        { name: "Cookie Policy", path: "#" },
        { name: "GDPR", path: "#" },
    ],
};

const socialLinks = [
    { icon: Twitter, href: "https://x.com/s_sazid_a", label: "Twitter" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/s-sazid/", label: "LinkedIn" },
    { icon: Github, href: "https://github.com/s-sazid-a", label: "GitHub" },
    { icon: Youtube, href: "https://www.youtube.com/@s.sazid.a", label: "YouTube" },
    { icon: Shield, href: "#", label: "Vision Safe" },
];

const Footer = () => {
    return (
        <footer className="relative border-t border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 py-16 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className="relative"
                            >
                                <Shield className="w-10 h-10 text-primary" />
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-xl leading-tight gradient-text">
                                    VISION SAFE
                                </span>
                                <span className="text-xs font-accent text-muted-foreground tracking-widest">
                                    ULTIMA SYSTEM
                                </span>
                            </div>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
                            AI-powered video safety monitoring that protects what matters most.
                            Real-time detection, instant alerts, and comprehensive risk analysis.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <a href="mailto:sksazid1605@gmail.com" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Mail className="w-4 h-4 text-primary" />
                                </div>
                                sksazid1605@gmail.com
                            </a>
                            <a href="tel:+919382744451" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                                    <Phone className="w-4 h-4 text-secondary" />
                                </div>
                                +91 9382744451
                            </a>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                    <MapPin className="w-4 h-4 text-accent" />
                                </div>
                                India, Asia
                            </div>
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div>
                        <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-6 text-foreground">
                            Product
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-6 text-foreground">
                            Company
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-6 text-foreground">
                            Legal
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} VISION SAFE. All rights reserved.
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                        {socialLinks.map((social, index) => (
                            <motion.a
                                key={index}
                                href={social.href}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/20 shadow-sm hover:shadow-glow-purple"
                                aria-label={social.label}
                            >
                                <social.icon className="w-4 h-4" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
