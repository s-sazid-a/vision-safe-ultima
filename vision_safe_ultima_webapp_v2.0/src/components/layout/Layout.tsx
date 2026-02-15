import { ReactNode, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "@/components/effects/ChatWidget";
import MouseFollower from "@/components/effects/MouseFollower";

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    // Initialize dark mode on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Grid background */}
            <div className="fixed inset-0 grid-background opacity-30 pointer-events-none" />

            {/* Gradient orbs */}
            <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
            <div className="fixed top-1/2 left-1/2 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <MouseFollower />
            <Navbar />

            <main className="flex-1 pt-20 relative z-10">
                {children}
            </main>

            <Footer />
            <ChatWidget />
        </div>
    );
};

export default Layout;
