import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <SignUp
                appearance={{
                    variables: {
                        colorPrimary: "#6E00FF",
                        colorBackground: "#0C121E", // Card Background
                        colorText: "#F2F2F2",
                        colorInputBackground: "#050A14", // Darker input
                        colorInputText: "#F2F2F2",
                        borderRadius: "0.5rem"
                    },
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-glow-purple border border-border bg-card",
                        formButtonPrimary: "bg-primary hover:bg-primary/90",
                        footerActionLink: "text-primary hover:text-primary/90"
                    }
                }}
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                forceRedirectUrl="/pricing"
            />
        </div>
    );
}
