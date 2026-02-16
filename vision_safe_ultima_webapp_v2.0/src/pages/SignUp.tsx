import { SignUp } from "@clerk/clerk-react";
import MouseFollower from "@/components/effects/MouseFollower";

export default function SignUpPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background grid-background overflow-hidden">
            <MouseFollower />
            {/* Background Glow Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10">
                <SignUp
                    appearance={{
                        variables: {
                            colorPrimary: "#6E00FF",
                            colorBackground: "#0C121E",
                            colorText: "#F2F2F2",
                            colorInputBackground: "#050A14",
                            colorInputText: "#F2F2F2",
                            borderRadius: "1rem"
                        },
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-card/80 backdrop-blur-xl border border-primary/20 shadow-glow-purple ring-1 ring-white/5",
                            headerTitle: "text-white font-bold font-accent text-2xl tracking-wide",
                            headerSubtitle: "text-gray-400",
                            formButtonPrimary: "bg-gradient-primary border-0 hover:opacity-90 transition-opacity font-bold shadow-lg shadow-primary/25",
                            formFieldInput: "bg-black/40 border-white/10 focus:border-primary/50 transition-all duration-300",
                            footerActionLink: "text-primary hover:text-accent transition-colors font-medium"
                        }
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    forceRedirectUrl="/dashboard"
                />
            </div>
        </div>
    );
}
