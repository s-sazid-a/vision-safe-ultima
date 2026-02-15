import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Zap, Building2, Rocket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Layout from "@/components/layout/Layout";

const plans = [
    {
        name: "Starter",
        description: "Perfect for small businesses and single locations",
        monthlyPrice: 99,
        yearlyPrice: 79,
        icon: Zap,
        color: "from-cyan-500 to-blue-500",
        features: [
            { name: "Up to 4 cameras", included: true },
            { name: "Real-time monitoring", included: true },
            { name: "Fall detection", included: true },
            { name: "Email alerts", included: true },
            { name: "7-day video storage", included: true },
            { name: "Basic analytics", included: true },
            { name: "Fire & smoke detection", included: false },
            { name: "API access", included: false },
            { name: "Custom integrations", included: false },
            { name: "Dedicated support", included: false },
        ],
        cta: "Start Free Trial",
        popular: false,
    },
    {
        name: "Professional",
        description: "For growing organizations with multiple locations",
        monthlyPrice: 249,
        yearlyPrice: 199,
        icon: Building2,
        color: "from-primary to-accent",
        features: [
            { name: "Up to 25 cameras", included: true },
            { name: "Real-time monitoring", included: true },
            { name: "Fall detection", included: true },
            { name: "Email & SMS alerts", included: true },
            { name: "30-day video storage", included: true },
            { name: "Advanced analytics", included: true },
            { name: "Fire & smoke detection", included: true },
            { name: "API access", included: true },
            { name: "Custom integrations", included: false },
            { name: "Dedicated support", included: false },
        ],
        cta: "Start Free Trial",
        popular: true,
    },
    {
        name: "Enterprise",
        description: "Custom solutions for large-scale deployments",
        monthlyPrice: null,
        yearlyPrice: null,
        icon: Rocket,
        color: "from-accent to-pink-500",
        features: [
            { name: "Unlimited cameras", included: true },
            { name: "Real-time monitoring", included: true },
            { name: "All detection features", included: true },
            { name: "All alert channels", included: true },
            { name: "Custom retention", included: true },
            { name: "Enterprise analytics", included: true },
            { name: "Fire & smoke detection", included: true },
            { name: "Full API access", included: true },
            { name: "Custom integrations", included: true },
            { name: "24/7 dedicated support", included: true },
        ],
        cta: "Contact Sales",
        popular: false,
    },
];

const Pricing = () => {
    const [isYearly, setIsYearly] = useState(true);

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
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Simple, Transparent Pricing</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                            <span className="gradient-text">Choose Your</span>
                            <br />
                            <span className="text-foreground">Protection Plan</span>
                        </h1>

                        <p className="text-lg text-muted-foreground mb-8">
                            Start with a 14-day free trial. No credit card required.
                        </p>

                        {/* Billing toggle */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-4 glass-card rounded-full px-6 py-3"
                        >
                            <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                                Monthly
                            </span>
                            <Switch
                                checked={isYearly}
                                onCheckedChange={setIsYearly}
                                className="data-[state=checked]:bg-primary"
                            />
                            <span className={`text-sm font-medium transition-colors ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                                Yearly
                            </span>
                            <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                Save 20%
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-10 relative">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className={`relative ${plan.popular ? "lg:-mt-4 lg:mb-4" : ""}`}
                            >
                                {/* Popular badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                        <div className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
                                            MOST POPULAR
                                        </div>
                                    </div>
                                )}

                                <motion.div
                                    whileHover={{ y: -8 }}
                                    className={`h-full glass-card rounded-3xl p-8 relative overflow-hidden ${plan.popular ? "border-primary/50" : ""
                                        }`}
                                >
                                    {/* Background gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5`} />

                                    <div className="relative">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                                                <plan.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-6">
                                            {plan.description}
                                        </p>

                                        {/* Price */}
                                        <div className="mb-8">
                                            <AnimatePresence mode="wait">
                                                {plan.monthlyPrice ? (
                                                    <motion.div
                                                        key={isYearly ? "yearly" : "monthly"}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <span className="text-4xl font-display font-bold">
                                                            ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                                        </span>
                                                        <span className="text-muted-foreground">/month</span>
                                                        {isYearly && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Billed annually (${(plan.yearlyPrice || 0) * 12}/year)
                                                            </p>
                                                        )}
                                                    </motion.div>
                                                ) : (
                                                    <div>
                                                        <span className="text-3xl font-display font-bold">Custom</span>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Tailored to your needs
                                                        </p>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* CTA */}
                                        <Link to={plan.name === "Enterprise" ? "#" : "/signup"}>
                                            <Button
                                                className={`w-full h-12 font-semibold mb-8 ${plan.popular
                                                        ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                                                        : ""
                                                    }`}
                                                variant={plan.popular ? "default" : "outline"}
                                            >
                                                {plan.cta}
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>

                                        {/* Features */}
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    {feature.included ? (
                                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-green-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                                            <X className="w-3 h-3 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground"}`}>
                                                        {feature.name}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Teaser */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto"
                    >
                        <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                            Have Questions?
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Our team is here to help you choose the right plan for your needs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="outline" className="glass-card">
                                View FAQ
                            </Button>
                            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                                Contact Sales
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
};

export default Pricing;
