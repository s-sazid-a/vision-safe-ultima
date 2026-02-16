import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-xl border border-border bg-card",
                    }
                }}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                forceRedirectUrl="/pricing"
            />
        </div>
    );
}
