import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Shield,
    Zap,
    Eye,
    Bell,
    Activity,
    Flame,
    Users,
    TrendingUp,
    Play,
    ChevronRight,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

// Animated counter component
const AnimatedCounter = ({ target, suffix = "", duration = 2 }: { target: number; suffix?: string; duration?: number }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const end = target;
            const increment = end / (duration * 60);

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 1000 / 60);

            return () => clearInterval(timer);
        }
    }, [isInView, target, duration]);

    return (
        <span ref={ref} className="tabular-nums">
            {count.toLocaleString()}{suffix}
        </span>
    );
};

// Stats data
const stats = [
    { value: 99.9, suffix: "%", label: "Uptime Guaranteed", icon: Shield },
    { value: 1, suffix: "s", label: "Response Time", prefix: "<", icon: Zap },
    { value: 24, suffix: "/7", label: "Monitoring", icon: Eye },
    { value: 10000, suffix: "+", label: "Active Users", icon: Users },
];

// Feature highlights
const features = [
    {
        icon: Activity,
        title: "Activity Detection",
        description: "AI-powered pose analysis and movement tracking",
        color: "from-primary to-secondary",
    },
    {
        icon: Flame,
        title: "Fire & Smoke Detection",
        description: "Instant alerts for fire hazards and smoke presence",
        color: "from-accent to-primary",
    },
    {
        icon: Bell,
        title: "Instant Alerts",
        description: "Real-time notifications across all devices",
        color: "from-secondary to-accent",
    },
];

const Home = () => {
    const heroRef = useRef(null);
    const isHeroInView = useInView(heroRef, { once: true });

    return (
        <Layout>
            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                        className="absolute top-20 right-20 w-96 h-96 border border-primary/10 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-20 left-20 w-72 h-72 border border-accent/10 rounded-full"
                    />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-center lg:text-left"
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
                            >
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium">AI-Powered Safety System</span>
                            </motion.div>

                            {/* Main headline */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight mb-6"
                            >
                                <span className="gradient-text">AI-Powered</span>
                                <br />
                                <span className="text-foreground">Safety.</span>
                                <br />
                                <span className="gradient-text-cyan">Real-Time</span>
                                <br />
                                <span className="text-foreground">Protection.</span>
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0"
                            >
                                Advanced video monitoring system that detects risks, prevents incidents,
                                and keeps your environment safe with cutting-edge AI technology.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            >
                                <Link to="/signup">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold px-8 h-14 text-lg animate-glow-pulse"
                                    >
                                        Start Free Trial
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link to="/how-it-works">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full sm:w-auto h-14 text-lg px-8 glass-card border-border hover:border-primary/50"
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        Watch Demo
                                    </Button>
                                </Link>
                            </motion.div>

                            {/* Trust badges */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={isHeroInView ? { opacity: 1 } : {}}
                                transition={{ delay: 0.7 }}
                                className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>14-day free trial</span>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right - Dashboard Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="relative"
                        >
                            <div className="relative">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/20 to-accent/30 blur-3xl rounded-full scale-110" />

                                {/* Dashboard card */}
                                <div className="relative glass-card rounded-3xl p-6 border border-border/50">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="font-display font-semibold text-sm">Live Monitoring</h4>
                                                <p className="text-xs text-muted-foreground">All systems operational</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs text-green-500 font-medium">ACTIVE</span>
                                        </div>
                                    </div>

                                    {/* Video feed grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {[1, 2, 3, 4].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                                className="aspect-video rounded-xl bg-muted/50 relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                                                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    <span className="text-[10px] font-accent text-muted-foreground">CAM {i}</span>
                                                </div>
                                                {i === 3 && (
                                                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-accent/20 text-accent text-[10px] font-semibold">
                                                        MOTION DETECTED
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Status bar */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Risk Level</p>
                                                <p className="font-display font-bold text-green-500">LOW</p>
                                            </div>
                                            <div className="w-px h-8 bg-border" />
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Cameras</p>
                                                <p className="font-display font-bold text-foreground">4/4</p>
                                            </div>
                                            <div className="w-px h-8 bg-border" />
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Alerts</p>
                                                <p className="font-display font-bold text-secondary">0</p>
                                            </div>
                                        </div>
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                </div>

                                {/* Floating notification */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20, y: -20 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="absolute -top-4 -right-4 glass-card rounded-xl p-3 border border-green-500/30 shadow-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">All Clear</p>
                                            <p className="text-[10px] text-muted-foreground">No threats detected</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors"
                            >
                                <stat.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
                                <div className="font-display text-3xl md:text-4xl font-bold mb-2">
                                    {stat.prefix && <span>{stat.prefix}</span>}
                                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                </div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                            <span className="gradient-text">Powerful Features</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Comprehensive safety monitoring powered by cutting-edge AI technology
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                className="glass-card rounded-2xl p-8 group cursor-pointer hover:border-primary/30 transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                                </div>
                                <h3 className="font-display font-semibold text-xl mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <Link to="/features">
                            <Button variant="outline" size="lg" className="glass-card">
                                Explore All Features
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative rounded-3xl overflow-hidden"
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary opacity-90" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

                        <div className="relative px-8 py-16 md:py-20 text-center">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-3xl md:text-5xl font-display font-bold text-white mb-6"
                            >
                                Ready to Secure Your Space?
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-lg text-white/80 mb-8 max-w-2xl mx-auto"
                            >
                                Join thousands of organizations that trust VISION SAFE for their safety monitoring needs.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                            >
                                <Link to="/signup">
                                    <Button
                                        size="lg"
                                        className="bg-white text-primary hover:bg-white/90 font-semibold px-8 h-14 text-lg"
                                    >
                                        Start Free Trial
                                    </Button>
                                </Link>
                                <Link to="/pricing">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-white/30 text-white hover:bg-white/10 px-8 h-14 text-lg"
                                    >
                                        View Pricing
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
};

export default Home;
