import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

// Types
export type UserProfile = {
    id: string;
    name: string;
    avatar_url: string;
    is_main: boolean;
    pin?: string;
};

export type Account = {
    id: string;
    email: string;
    profiles: UserProfile[];
};

type AuthContextType = {
    account: Account | null;
    currentProfile: UserProfile | null;
    loading: boolean;
    signIn: () => void;
    signUp: () => void;
    signOut: () => Promise<void>;
    selectProfile: (profileId: string) => void;
    addProfile: (name: string) => Promise<{ error: any }>;
    updateProfile: (profileId: string, updates: Partial<UserProfile>) => Promise<{ error: any }>;
    deleteProfile: (profileId: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { user, isLoaded, isSignedIn } = useUser();
    const clerk = useClerk();

    const [account, setAccount] = useState<Account | null>(null);
    const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && user) {
            // Map Clerk User to legacy Account/Profile structure
            const mainProfile: UserProfile = {
                id: user.id,
                name: user.fullName || user.username || "User",
                avatar_url: user.imageUrl,
                is_main: true
            };

            setAccount({
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress || "",
                profiles: [mainProfile]
            });

            // Auto-select main profile
            setCurrentProfile(mainProfile);
        } else {
            setAccount(null);
            setCurrentProfile(null);
        }
        setLoading(false);
    }, [isLoaded, isSignedIn, user]);

    const signIn = () => {
        clerk.openSignIn();
    };

    const signUp = () => {
        clerk.openSignUp();
    };

    const signOut = async () => {
        await clerk.signOut();
    };

    const selectProfile = (profileId: string) => {
        // Single profile support for now
        if (user && profileId === user.id) {
            setCurrentProfile(account?.profiles[0] || null);
        }
    };

    const addProfile = async (_name: string) => {
        return { error: { message: "Multi-profile support coming soon with Clerk Organizations" } };
    };

    const updateProfile = async (profileId: string, updates: Partial<UserProfile>) => {
        if (!user || profileId !== user.id) return { error: { message: "Unauthorized" } };

        try {
            await user.update({
                firstName: updates.name?.split(' ')[0],
                lastName: updates.name?.split(' ').slice(1).join(' '),
            });
            return { error: null };
        } catch (e) {
            return { error: e };
        }
    };

    const deleteProfile = async (_profileId: string) => {
        return { error: { message: "Cannot delete main profile" } };
    };

    return (
        <AuthContext.Provider value={{
            account,
            currentProfile,
            loading: !isLoaded || loading,
            signIn,
            signUp,
            signOut,
            selectProfile,
            addProfile,
            updateProfile,
            deleteProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};
