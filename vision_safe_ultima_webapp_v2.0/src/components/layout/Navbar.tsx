import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Testimonials", path: "/testimonials" },
];

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { account, currentProfile, signOut } = useAuth();
    // Use currentProfile for display, fallback to account email if needed
    const displayUser = currentProfile ? {
        name: currentProfile.name,
        email: account?.email,
        avatar: currentProfile.avatar_url
    } : account ? {
        name: account.email.split('@')[0],
        email: account.email,
        avatar: null
    } : null;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "glass-card border-b py-3"
                    : "bg-transparent py-5"
                    }`}
            >
                <div className="container mx-auto px-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                        >
                            <Shield className="w-8 h-8 text-primary" />
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        </motion.div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-lg leading-tight gradient-text">
                                VISION SAFE
                            </span>
                            <span className="text-[10px] font-accent text-muted-foreground tracking-widest">
                                ULTIMA SYSTEM
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative px-4 py-2 font-medium text-sm transition-colors ${location.pathname === link.path
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {link.name}
                                {location.pathname === link.path && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
                                    />
                                )}
                            </Link>
                        ))}
                        <Link
                            to={displayUser ? "/dashboard" : "/signup"}
                            className={`relative px-4 py-2 font-medium text-sm transition-colors ${location.pathname.startsWith("/dashboard") || (!displayUser && location.pathname === "/signup")
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Dashboard
                            {(location.pathname.startsWith("/dashboard") || (!displayUser && location.pathname === "/signup")) && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
                                />
                            )}
                        </Link>
                    </div>

                    {/* Right Side Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        {displayUser ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden">
                                        <Avatar className="h-10 w-10 border border-primary/20">
                                            <AvatarImage src={displayUser.avatar || undefined} alt={displayUser.name} />
                                            <AvatarFallback className="bg-primary/10">
                                                {displayUser.name?.substring(0, 2).toUpperCase() || <User className="h-5 w-5 text-primary" />}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{displayUser.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {displayUser.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => signOut()} className="text-red-500 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link to="/signup">
                                <Button
                                    className="relative overflow-hidden bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold px-6"
                                >
                                    <span className="relative z-10">Get Started</span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-accent to-primary"
                                        initial={{ x: "100%" }}
                                        whileHover={{ x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex lg:hidden items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="relative"
                        >
                            <AnimatePresence mode="wait">
                                {isMobileMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <X className="w-6 h-6" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Menu className="w-6 h-6" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 lg:hidden pt-20"
                    >
                        <div
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative mx-4 mt-4 glass-card p-6 rounded-2xl"
                        >
                            <div className="flex flex-col gap-2">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.path}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            to={link.path}
                                            className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === link.path
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                }`}
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: navLinks.length * 0.05 }}
                                >
                                    <Link
                                        to={displayUser ? "/dashboard" : "/signup"}
                                        className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname.startsWith("/dashboard") || (!displayUser && location.pathname === "/signup")
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            }`}
                                    >
                                        Dashboard
                                    </Link>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: navLinks.length * 0.05 + 0.05 }}
                                    className="pt-4 border-t border-border mt-2"
                                >
                                    {displayUser ? (
                                        <Button
                                            onClick={() => signOut()}
                                            variant="destructive"
                                            className="w-full"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log Out
                                        </Button>
                                    ) : (
                                        <Link to="/signup" className="block">
                                            <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
                                                Get Started
                                            </Button>
                                        </Link>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
