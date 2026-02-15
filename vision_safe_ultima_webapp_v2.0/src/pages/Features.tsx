import { motion } from "framer-motion";
import {
    Activity,
    Flame,
    Shield,
    Bell,
    Eye,
    Brain,
    Cpu,
    Lock,
    Zap,
    Gauge,
    Layers,
    Radio
} from "lucide-react";
import Layout from "@/components/layout/Layout";

const features = [
    {
        category: "SAFE Pipeline",
        categoryColor: "text-green-400",
        description: "Monitor and analyze safe activities in real-time",
        items: [
            {
                icon: Activity,
                title: "Activity Detection",
                description: "Advanced motion tracking and activity classification using computer vision algorithms.",
                gradient: "from-green-500 to-emerald-500",
            },
            {
                icon: Eye,
                title: "Pose Analysis",
                description: "Skeleton-based pose estimation to detect unsafe postures and movements.",
                gradient: "from-emerald-500 to-teal-500",
            },
            {
                icon: Shield,
                title: "Fall Prediction",
                description: "AI-powered fall risk assessment and instant detection with 99.2% accuracy.",
                gradient: "from-teal-500 to-cyan-500",
            },
        ],
    },
    {
        category: "UNSAFE Pipeline",
        categoryColor: "text-red-400",
        description: "Detect and alert on hazardous conditions instantly",
        items: [
            {
                icon: Flame,
                title: "Fire & Smoke Detection",
                description: "Real-time flame and smoke recognition with multi-spectral analysis.",
                gradient: "from-red-500 to-orange-500",
            },
            {
                icon: Bell,
                title: "Intrusion Alerts",
                description: "Perimeter breach detection and unauthorized access monitoring.",
                gradient: "from-orange-500 to-amber-500",
            },
            {
                icon: Radio,
                title: "Environmental Hazards",
                description: "Detection of unusual environmental conditions that may pose risks.",
                gradient: "from-amber-500 to-yellow-500",
            },
        ],
    },
    {
        category: "Core Technology",
        categoryColor: "text-primary",
        description: "Powered by advanced AI and machine learning",
        items: [
            {
                icon: Brain,
                title: "Risk Fusion Engine",
                description: "Multi-modal AI that combines all inputs into unified risk scores.",
                gradient: "from-primary to-secondary",
            },
            {
                icon: Cpu,
                title: "Edge Computing",
                description: "Process video locally for faster response times and data privacy.",
                gradient: "from-secondary to-accent",
            },
            {
                icon: Lock,
                title: "End-to-End Encryption",
                description: "All data is encrypted in transit and at rest with AES-256.",
                gradient: "from-accent to-primary",
            },
        ],
    },
    {
        category: "Performance",
        categoryColor: "text-secondary",
        description: "Enterprise-grade reliability and speed",
        items: [
            {
                icon: Zap,
                title: "Sub-Second Response",
                description: "Alerts triggered within 100ms of threat detection.",
                gradient: "from-secondary to-cyan-500",
            },
            {
                icon: Gauge,
                title: "99.9% Uptime",
                description: "Redundant systems ensure continuous monitoring coverage.",
                gradient: "from-cyan-500 to-blue-500",
            },
            {
                icon: Layers,
                title: "Infinite Scalability",
                description: "From 1 camera to 10,000+ with consistent performance.",
                gradient: "from-blue-500 to-primary",
            },
        ],
    },
];

const Features = () => {
    return (
        <Layout>
            {/* Hero Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
                        >
                            <Layers className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Comprehensive Feature Set</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                            <span className="gradient-text">Powerful Features</span>
                            <br />
                            <span className="text-foreground">For Complete Safety</span>
                        </h1>

                        <p className="text-lg text-muted-foreground">
                            VISION SAFE combines multiple AI pipelines into one unified system
                            that monitors, analyzes, and protects your environment 24/7.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            {features.map((section) => (
                <section key={section.category} className="py-16 relative">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="mb-12"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <span className={`font-display font-bold text-sm tracking-wider ${section.categoryColor}`}>
                                    {section.category}
                                </span>
                                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                            </div>
                            <p className="text-muted-foreground max-w-lg">{section.description}</p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                    className="group"
                                >
                                    <div className="glass-card rounded-2xl p-8 h-full hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                                        {/* Hover gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                        <div className="relative">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                                <feature.icon className="w-7 h-7 text-white" />
                                            </div>

                                            <h3 className="font-display font-semibold text-xl mb-3 group-hover:text-primary transition-colors">
                                                {feature.title}
                                            </h3>

                                            <p className="text-muted-foreground leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            ))}

            {/* Risk Fusion Engine Highlight */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden"
                    >
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />

                        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                                    <Brain className="w-4 h-4" />
                                    <span className="text-sm font-semibold">Core Technology</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                                    <span className="gradient-text">Risk Fusion Engine</span>
                                </h2>

                                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                                    Our proprietary AI engine combines data from multiple detection pipelines
                                    to create a unified threat assessment. It analyzes patterns, cross-references
                                    incidents, and generates accurate risk scores in real-time.
                                </p>

                                <div className="space-y-4">
                                    {[
                                        "Multi-modal data fusion from all sensors",
                                        "Real-time pattern recognition and anomaly detection",
                                        "Adaptive learning from your environment",
                                        "Predictive analytics for proactive safety",
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-foreground">{item}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Visual representation */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                <div className="aspect-square relative">
                                    {/* Central brain */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center animate-glow-pulse">
                                        <Brain className="w-16 h-16 text-white" />
                                    </div>

                                    {/* Orbiting elements */}
                                    {[Activity, Eye, Flame, Bell, Shield, Zap].map((Icon, i) => {
                                        const angle = (i * 60) * (Math.PI / 180);
                                        const radius = 140;
                                        const x = Math.cos(angle) * radius;
                                        const y = Math.sin(angle) * radius;

                                        return (
                                            <motion.div
                                                key={i}
                                                className="absolute top-1/2 left-1/2 w-12 h-12 rounded-xl glass-card flex items-center justify-center"
                                                style={{
                                                    x: x - 24,
                                                    y: y - 24,
                                                }}
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    delay: i * 0.3,
                                                    repeat: Infinity,
                                                }}
                                            >
                                                <Icon className="w-6 h-6 text-primary" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
};

export default Features;
