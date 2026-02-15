import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground dark text-center p-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse">
                <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-6xl font-display font-bold gradient-text mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                The page you are looking for does not exist or has been moved.
                Please check the URL or return to the home page.
            </p>
            <Link to="/">
                <Button className="bg-gradient-to-r from-primary to-accent">
                    Return Home
                </Button>
            </Link>
        </div>
    );
};

export default NotFound;
