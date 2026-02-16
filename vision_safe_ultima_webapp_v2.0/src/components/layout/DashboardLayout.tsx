import { useState } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Settings,
    LogOut,
    Menu,
    LayoutDashboard,
    History,
    BarChart2,
    Bell,
    Search,
    User
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/store/AuthContext";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { account, currentProfile, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Live Monitor", path: "/dashboard/live-monitor" },
        { icon: History, label: "Event History", path: "/dashboard/history" },
        { icon: BarChart2, label: "Analytics", path: "/dashboard/analytics" },
        { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={{ width: 260 }}
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="glass-card m-4 mr-0 border-r border-border flex flex-col z-20 h-[calc(100vh-2rem)]"
            >
                <div className="p-6 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <Link to="/" className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-primary" />
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-lg gradient-text leading-none">VISION SAFE</span>
                                <span className="text-[10px] font-accent text-muted-foreground tracking-[0.2em] leading-none">ULTIMA</span>
                            </div>
                        </Link>
                    ) : (
                        <Shield className="w-8 h-8 text-primary mx-auto" />
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant={location.pathname === item.path ? "secondary" : "ghost"}
                                className={`w-full justify-start mb-2 ${!isSidebarOpen && "justify-center px-2"} ${location.pathname === item.path ? "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20" : "hover:bg-muted/50"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isSidebarOpen && "mr-3"}`} />
                                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 mt-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center hover:bg-muted/50"
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-20 px-8 flex items-center justify-between bg-background/50 backdrop-blur-md z-10">
                    {/* Breadcrumbs / Page Title */}
                    <div>
                        <h1 className="text-2xl font-display font-bold capitalize">
                            {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-64 hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search logs, cameras..." className="pl-9 bg-muted/30 border-none focus-visible:ring-1" />
                        </div>

                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                                    <Avatar className={`h-10 w-10 border-2 ${account?.subscription_tier !== 'trial'
                                        ? "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                        : "border-primary/20"
                                        }`}>
                                        <AvatarImage src={currentProfile?.avatar_url} />
                                        <AvatarFallback>{currentProfile?.name?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{currentProfile?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {account?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard/settings" className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/profiles" className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Switch Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-auto p-8 pt-4">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
