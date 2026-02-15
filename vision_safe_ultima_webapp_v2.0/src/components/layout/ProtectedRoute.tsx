import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: ReactNode;
    requireProfile?: boolean;
}

const ProtectedRoute = ({ children, requireProfile = true }: ProtectedRouteProps) => {
    const { account, currentProfile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Verifying access...</p>
                </div>
            </div>
        );
    }

    // 1. If not logged in at all (no account), go to Login
    // 1. If not logged in at all (no account), go to Login
    if (!account) {
        return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }

    // 2. If logged in but checking for profile, and no profile selected
    if (requireProfile && !currentProfile) {
        return <Navigate to="/profiles" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
