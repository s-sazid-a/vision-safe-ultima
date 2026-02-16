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
    getToken: () => Promise<string | null>;
    refreshAccount: () => Promise<void>; // Added to refresh subscription
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

    const getToken = async () => {
        if (clerk.session) {
            return await clerk.session.getToken();
        }
        return "";
    }

    // Fetch account details including profiles and subscription
    const fetchAccount = async (clerkId: string, email: string) => {
        try {
            const token = await getToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch User Details (Subscription removed)
            // const userRes = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, { headers });
            // kept comment for context but removing call to avoid unused var warning
            // actually we don't need to fetch user details if we only needed subscription_tier which is gone
            // and we have user id/email from clerk.
            // But strict mode might still want to check if user exists in DB? 
            // The profiles fetch will fail if user doesn't exist (401/404), so that's enough key.


            // 2. Fetch Profiles
            const profilesRes = await fetch(`${import.meta.env.VITE_API_URL}/profiles/`, { headers });
            let profiles: UserProfile[] = [];

            if (profilesRes.ok) {
                const rawProfiles = await profilesRes.json();
                profiles = rawProfiles.map((p: any) => ({
                    id: p.profile_id,
                    name: p.name,
                    avatar_url: p.avatar_url || "https://github.com/shadcn.png",
                    is_main: p.is_main
                }));
            }

            setAccount({
                id: clerkId,
                email: email,
                profiles
            });

            // Restore selected profile logic (simplified)
            if (!currentProfile) {
                const savedProfileId = localStorage.getItem("selectedProfileId");
                const saved = profiles.find(p => p.id === savedProfileId);
                setCurrentProfile(saved || profiles[0] || null);
            }

        } catch (e) {
            console.error("Error fetching account:", e);
        }
    };

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && user) {
            fetchAccount(user.id, user.primaryEmailAddress?.emailAddress || "");
        } else {
            setAccount(null);
            setCurrentProfile(null);
            localStorage.removeItem("selectedProfileId");
        }
        setLoading(false);
    }, [isLoaded, isSignedIn, user]);

    const refreshAccount = async () => {
        if (user) {
            await fetchAccount(user.id, user.primaryEmailAddress?.emailAddress || "");
        }
    };

    const signIn = () => {
        clerk.openSignIn();
    };

    const signUp = () => {
        clerk.openSignUp();
    };

    const signOut = async () => {
        localStorage.removeItem("selectedProfileId");
        await clerk.signOut();
    };

    const selectProfile = (profileId: string) => {
        if (!account) return;



        const profile = account.profiles.find(p => p.id === profileId);
        if (profile) {
            setCurrentProfile(profile);
            localStorage.setItem("selectedProfileId", profile.id);
        }
    };

    const addProfile = async (name: string) => {
        if (!user || !account) return { error: { message: "Not authenticated" } };



        try {
            const token = await getToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/profiles/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` })
            });

            if (!res.ok) {
                const err = await res.json();
                return { error: err };
            }

            await refreshAccount();
            return { error: null };

        } catch (e) {
            return { error: e };
        }
    };

    const updateProfile = async (_profileId: string, _updates: Partial<UserProfile>) => {
        // ... storage update logic if needed ...
        return { error: null }; // Implement backend update if needed
    };

    const deleteProfile = async (profileId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${profileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json();
                return { error: err };
            }

            await refreshAccount();
            return { error: null };
        } catch (e) {
            return { error: e };
        }
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
            deleteProfile,
            getToken,
            refreshAccount
        }}>
            {children}
        </AuthContext.Provider>
    );
};
