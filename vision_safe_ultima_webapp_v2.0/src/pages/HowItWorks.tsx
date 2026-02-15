import { motion } from "framer-motion";
import {
    Camera,
    Cpu,
    AlertTriangle,
    Bell,
    Play,
    ChevronRight,
    Workflow,
    Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const steps = [
    {
        icon: Camera,
        title: "Video Input",
        description: "Connect any IP camera or RTSP stream. Our system supports all major camera brands and protocols.",
        color: "from-cyan-500 to-blue-500",
        details: [
            "Supports IP, RTSP, ONVIF protocols",
            "Up to 4K resolution processing",
            "Edge and cloud deployment options",
        ],
    },
    {
        icon: Cpu,
        title: "AI Processing",
        description: "Advanced neural networks analyze every frame in real-time, identifying activities and potential risks.",
        color: "from-primary to-violet-500",
        details: [
            "Multi-model inference pipeline",
            "GPU-accelerated processing",
            "Adaptive frame rate optimization",
        ],
    },
    {
        icon: AlertTriangle,
        title: "Risk Detection",
        description: "Our Risk Fusion Engine combines all signals to calculate accurate threat levels and trigger appropriate responses.",
        color: "from-orange-500 to-red-500",
        details: [
            "Real-time risk scoring (0-100)",
            "Multi-factor threat analysis",
            "Customizable sensitivity thresholds",
        ],
    },
    {
        icon: Bell,
        title: "Instant Alerts",
        description: "Receive notifications via push, SMS, email, or integrate with your existing security systems.",
        color: "from-green-500 to-emerald-500",
        details: [
            "Sub-second alert delivery",
            "Customizable notification rules",
            "Integration with 50+ platforms",
        ],
    },
];

const HowItWorks = () => {
    return (
        <Layout>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                {/* Background Grid & ambient light */}
                <div className="absolute inset-0 grid-background opacity-20" />
                <div className="absolute top-0 center w-full h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
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
                            <Workflow className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium gradient-text">Simple Integration</span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
                            <span className="gradient-text">How VISION SAFE</span>
                            <br />
                            <span className="text-foreground">Works</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            From camera to alert in under a second. See how our AI-powered
                            system keeps you protected around the clock.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Steps Flow */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="relative">
                        {/* Connection line */}
                        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-secondary" />

                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className={`relative grid lg:grid-cols-2 gap-12 items-center mb-24 last:mb-0 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Content */}
                                <div className={index % 2 === 1 ? "lg:order-2 lg:text-right" : ""}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="glass-card rounded-2xl p-8 relative overflow-hidden group hover:border-primary/30 transition-all duration-300"
                                    >
                                        {/* Background gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                        <div className="relative">
                                            {/* Step number */}
                                            <div className={`flex items-center gap-4 mb-6 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                                                    <step.icon className="w-7 h-7 text-white" />
                                                </div>
                                                <div>
                                                    <span className="font-accent text-sm text-primary uppercase tracking-widest">STEP {index + 1}</span>
                                                    <h3 className="font-display font-bold text-2xl">{step.title}</h3>
                                                </div>
                                            </div>

                                            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                                                {step.description}
                                            </p>

                                            <ul className="space-y-3">
                                                {step.details.map((detail, i) => (
                                                    <li key={i} className={`flex items-center gap-3 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color}`} />
                                                        <span className="text-sm text-foreground/80">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Visual */}
                                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                        className="relative aspect-video rounded-2xl glass-card overflow-hidden border border-white/5"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5`} />

                                        {/* Animated visualization */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.5, 1],
                                                    opacity: [0.2, 0.4, 0.2],
                                                }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className={`w-32 h-32 rounded-full bg-gradient-to-r ${step.color} blur-2xl`}
                                            />
                                            <div className={`absolute w-20 h-20 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-2xl`}>
                                                <step.icon className="w-10 h-10 text-white" />
                                            </div>
                                        </div>

                                        {/* Connection indicator */}
                                        {index < steps.length - 1 && (
                                            <motion.div
                                                animate={{ x: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-muted-foreground"
                                            >
                                                <span>Processing</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Center node */}
                                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border-4 border-primary items-center justify-center z-10 shadow-glow-purple">
                                    <span className="font-display font-bold text-primary">{index + 1}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Demo Video Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                            <span className="gradient-text">See It In Action</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Watch how VISION SAFE detects and responds to real-world scenarios
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative max-w-5xl mx-auto"
                    >
                        {/* Video placeholder */}
                        <div className="relative aspect-video rounded-3xl overflow-hidden glass-card border-white/10 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />

                            {/* Play button */}
                            <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-2xl pulse-glow"
                                >
                                    <Play className="w-10 h-10 text-white ml-2" fill="white" />
                                </motion.button>
                            </div>

                            {/* Overlay info */}
                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                <div className="glass-card rounded-xl px-4 py-2 border-white/10">
                                    <span className="text-sm font-medium">Product Demo</span>
                                </div>
                                <div className="glass-card rounded-xl px-4 py-2 border-white/10">
                                    <span className="text-sm text-muted-foreground">3:45</span>
                                </div>
                            </div>
                        </div>

                        {/* Glow effect */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-3xl rounded-full scale-90" />
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden border-primary/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />

                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-glow-purple">
                                <Shield className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                                Ready to Get Started?
                            </h2>

                            <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-lg">
                                Join thousands of organizations already using VISION SAFE to protect their spaces with next-gen AI.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link to="/signup">
                                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 font-semibold px-10 py-6 text-lg rounded-xl shadow-glow-purple transition-all hover:scale-105">
                                        Start Free Trial
                                    </Button>
                                </Link>
                                <Link to="/pricing">
                                    <Button size="lg" variant="outline" className="glass-card px-10 py-6 text-lg rounded-xl hover:bg-white/5 transition-all hover:scale-105 border-white/10">
                                        View Pricing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
};

export default HowItWorks;
