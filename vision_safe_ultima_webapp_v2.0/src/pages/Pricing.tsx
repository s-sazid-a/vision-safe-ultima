import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Zap, Building2, Rocket, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/components/ui/use-toast";

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
    const { account, refreshAccount } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState("");
    const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

    // Load Razorpay Script handled via index.html

    const handleSubscribe = async (planName: string) => {
        if (!account) {
            navigate('/sign-up');
            return;
        }

        const tierMap: Record<string, string> = {
            'Starter': 'starter',
            'Professional': 'professional',
            'Enterprise': 'enterprise'
        };

        const targetTier = tierMap[planName];
        if (!targetTier) return;

        // If promo code is valid (100% off), bypass payment
        if (promoStatus === 'valid') {
            setProcessing(planName);
            try {
                const token = await import('@clerk/clerk-react').then(m => m.useClerk().session?.getToken());
                // Use the subscription update endpoint directly for 0 cost
                await fetch(`${import.meta.env.VITE_API_URL}/users/me/subscription`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ tier: targetTier })
                });
                await refreshAccount();
                toast({ title: "Success!", description: `Upgraded to ${planName} (100% Off)!` });
                setSelectedPlan(null);
                navigate('/dashboard');
            } catch (e) {
                toast({ title: "Error", description: "Promo redemption failed.", variant: "destructive" });
            } finally {
                setProcessing(null);
            }
            return;
        }

        // Standard Payment Flow
        setProcessing(planName);
        try {
            const token = await import('@clerk/clerk-react').then(m => m.useClerk().session?.getToken());

            // 1. Create Order
            const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    amount: plans.find(p => p.name === planName)?.monthlyPrice || 99, // default fallback
                    currency: "INR",
                    plan_id: targetTier
                })
            });

            if (!orderRes.ok) throw new Error("Failed to create order");
            const orderData = await orderRes.json();

            // 2. Open Razorpay
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Vision Safe Ultima",
                description: `${planName} Plan Subscription`,
                order_id: orderData.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/payments/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                plan_id: targetTier
                            })
                        });

                        if (verifyRes.ok) {
                            await refreshAccount();
                            toast({ title: "Payment Successful!", description: `Welcome to ${planName} Plan!` });
                            setSelectedPlan(null);
                            navigate('/dashboard');
                        } else {
                            toast({ title: "Verification Failed", description: "Please contact support.", variant: "destructive" });
                        }
                    } catch (err) {
                        console.error(err);
                        toast({ title: "Error", description: "Payment verification failed.", variant: "destructive" });
                    }
                },
                prefill: {
                    name: account.email.split('@')[0], // Fallback name from email
                    email: account.email
                },
                theme: {
                    color: "#6E00FF"
                }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
            });
            rzp1.open();

        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Could not initiate payment.", variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    };

    const currentTier = account?.subscription_tier || 'trial';

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

                        {/* Continue Free Button for Logged In Users */}
                        {account && currentTier === 'trial' && (
                            <div className="mb-8">
                                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                    Continue with Limited Access (Free)
                                </Button>
                            </div>
                        )}

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
                                        <Button
                                            className={`w-full h-12 font-semibold mb-8 ${plan.popular
                                                ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                                                : ""
                                                }`}
                                            variant={plan.popular ? "default" : "outline"}
                                            onClick={() => {
                                                if (plan.name === "Enterprise" || (account && currentTier === plan.name.toLowerCase())) return;
                                                setSelectedPlan(plan.name);
                                            }}
                                            disabled={!!(processing === plan.name || (account && currentTier === plan.name.toLowerCase()))}
                                        >
                                            {processing === plan.name ? "Processing..." : (
                                                account ? (currentTier === plan.name.toLowerCase() ? "Current Plan" : "Upgrade") : plan.cta
                                            )}
                                            {processing !== plan.name && <ArrowRight className="w-4 h-4 ml-2" />}
                                        </Button>

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

            {/* Payment Confirmation Dialog */}
            <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
                <DialogContent className="glass-card sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Subscription</DialogTitle>
                        <DialogDescription>
                            You are upgrading to the <span className="font-bold text-primary">{selectedPlan}</span> plan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="promo">Promo Code</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="promo"
                                    placeholder="ENTER CODE"
                                    value={promoCode}
                                    onChange={(e) => {
                                        setPromoCode(e.target.value.toUpperCase());
                                        setPromoStatus('idle'); // Reset status on edit
                                    }}
                                    className="uppercase tracking-wider font-mono"
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const SECRET_CODES = [
                                            "LAVANYA100", "DHANASHREE100", "MANIKANTA100", "PREKSHA100",
                                            "RASAGNA100", "ROHIT100", "YASASWINI100", "SESHAVENI100",
                                            "SATYAM100", "SAZID100", "YUG100"
                                        ];
                                        if (SECRET_CODES.includes(promoCode)) {
                                            setPromoStatus('valid');
                                            toast({ title: "Success!", description: "100% Discount Applied." });
                                        } else {
                                            setPromoStatus('invalid');
                                        }
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>

                            {/* Validation Messages */}
                            {promoStatus === 'valid' && (
                                <div className="flex items-center gap-2 text-green-500 text-sm font-bold animate-in fade-in slide-in-from-top-1">
                                    <Check className="w-4 h-4" />
                                    <span>Code Applied! (100% OFF)</span>
                                </div>
                            )}
                            {promoStatus === 'invalid' && (
                                <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                                    Invalid Code. Please try again.
                                </p>
                            )}

                            {/* Price Display */}
                            <div className="mt-4 p-4 bg-muted/20 rounded-lg flex justify-between items-center">
                                <span className="text-muted-foreground">Total to pay:</span>
                                <div className="text-right">
                                    {promoStatus === 'valid' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm line-through text-muted-foreground">$29.00</span>
                                            <span className="text-xl font-bold text-green-500">$0.00</span>
                                        </div>
                                    ) : (
                                        <span className="text-xl font-bold">
                                            {selectedPlan === 'Starter' ? '$29.00' : selectedPlan === 'Professional' ? '$99.00' : 'Custom'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                        <Button
                            className={`min-w-[140px] ${promoStatus === 'valid' ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-primary to-accent'}`}
                            onClick={() => selectedPlan && handleSubscribe(selectedPlan)}
                            disabled={!!processing}
                        >
                            {processing ? "Processing..." : (promoStatus === 'valid' ? "Confirm Free Upgrade" : "Proceed to Payment")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
