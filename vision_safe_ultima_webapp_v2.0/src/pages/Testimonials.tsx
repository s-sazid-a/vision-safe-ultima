import { motion } from "framer-motion";
import { Quote, Star, Building2, Users, GraduationCap, Stethoscope, Factory, Home } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext
} from "@/components/ui/carousel";
import Layout from "@/components/layout/Layout";

const testimonials = [
    {
        quote: "VISION SAFE has transformed how we monitor our manufacturing floor. The fall detection alone has prevented several serious incidents. The ROI was visible within the first month.",
        author: "Rohit Banik",
        role: "Safety Director",
        company: "Precision Manufacturing Inc.",
        avatar: "RB",
        rating: 5,
    },
    {
        quote: "As a hospital administrator, patient safety is our top priority. VISION SAFE's AI monitoring gives us peace of mind knowing that our elderly patients are being watched 24/7.",
        author: "Dhanashree N",
        role: "Hospital Administrator",
        company: "Riverside Medical Center",
        avatar: "DN",
        rating: 5,
    },
    {
        quote: "The fire and smoke detection is incredibly fast. During a small kitchen incident, we received alerts within seconds, allowing us to evacuate students before any harm occurred.",
        author: "Yug Jain",
        role: "Principal",
        company: "Westfield Academy",
        avatar: "YJ",
        rating: 5,
    },
    {
        quote: "Implementation was seamless. The team at VISION SAFE integrated with our existing camera system in just one day. The dashboard is intuitive and our security team loves it.",
        author: "Lavanya Rangisetti",
        role: "Security Manager",
        company: "Grand Plaza Hotel",
        avatar: "LR",
        rating: 5,
    },
    {
        quote: "We've reduced our incident response time by 80% since implementing VISION SAFE. The real-time alerts and accurate detection have been game-changers for our warehouse operations.",
        author: "Satyam Puitandy",
        role: "Operations Director",
        company: "Swift Logistics",
        avatar: "SP",
        rating: 5,
    },
];

const industries = [
    { icon: Factory, name: "Manufacturing", count: "500+" },
    { icon: Stethoscope, name: "Healthcare", count: "300+" },
    { icon: GraduationCap, name: "Education", count: "400+" },
    { icon: Building2, name: "Commercial", count: "1,000+" },
    { icon: Home, name: "Residential", count: "2,000+" },
    { icon: Users, name: "Retail", count: "800+" },
];

const stats = [
    { value: "99.8%", label: "Detection Accuracy" },
    { value: "50M+", label: "Hours Monitored" },
    { value: "10K+", label: "Active Installations" },
    { value: "1,200+", label: "Incidents Prevented" },
];

const Testimonials = () => {
    return (
        <Layout>
            {/* Hero */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
                        >
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Trusted by Thousands</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                            <span className="gradient-text">What Our</span>
                            <br />
                            <span className="text-foreground">Customers Say</span>
                        </h1>

                        <p className="text-lg text-muted-foreground">
                            Join thousands of organizations that trust VISION SAFE
                            to protect their people and property.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-10 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card rounded-2xl p-6 text-center"
                            >
                                <div className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">
                                    {stat.value}
                                </div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Carousel */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full max-w-5xl mx-auto"
                    >
                        <CarouselContent className="-ml-4">
                            {testimonials.map((testimonial, index) => (
                                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/2">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="h-full"
                                    >
                                        <div className="glass-card rounded-2xl p-8 h-full flex flex-col relative overflow-hidden group hover:border-primary/30 transition-colors">
                                            {/* Quote icon */}
                                            <Quote className="w-10 h-10 text-primary/20 mb-4" />

                                            {/* Rating */}
                                            <div className="flex gap-1 mb-4">
                                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                ))}
                                            </div>

                                            {/* Quote */}
                                            <blockquote className="text-foreground leading-relaxed mb-6 flex-1">
                                                "{testimonial.quote}"
                                            </blockquote>

                                            {/* Author */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                                                    {testimonial.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                                    <p className="text-xs text-primary">{testimonial.company}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex -left-12" />
                        <CarouselNext className="hidden md:flex -right-12" />
                    </Carousel>
                </div>
            </section>

            {/* Industries Served */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                            <span className="gradient-text">Industries We Serve</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            From hospitals to warehouses, VISION SAFE adapts to any environment
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {industries.map((industry, index) => (
                            <motion.div
                                key={industry.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-all cursor-pointer"
                            >
                                <industry.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                                <h3 className="font-semibold text-sm mb-1">{industry.name}</h3>
                                <p className="text-xs text-muted-foreground">{industry.count} clients</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Testimonials Placeholder */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                            <span className="gradient-text">Video Testimonials</span>
                        </h2>
                        <p className="text-muted-foreground">
                            Hear directly from our customers about their experience
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="aspect-video glass-card rounded-2xl relative overflow-hidden group cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <div className="glass-card rounded-lg px-3 py-2">
                                        <p className="text-xs font-medium truncate">Customer Story {i}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Testimonials;
