import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

import ScrollToTop from "./components/layout/ScrollToTop";
import { AuthProvider } from "@/store/AuthContext";
import { DetectionProvider } from "@/store/DetectionContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

import Home from "./pages/Home";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Testimonials from "./pages/Testimonials";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";

import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ProfileSelection from "./pages/ProfileSelection";
import LiveMonitor from "@/components/dashboard/LiveMonitor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DetectionProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/login" element={<SignInPage />} />

              {/* Protected Dashboard Routes */}
              <Route path="/profiles" element={
                <ProtectedRoute requireProfile={false}>
                  <ProfileSelection />
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={<Navigate to="/dashboard/live-monitor" replace />} />
              <Route path="/dashboard/live-monitor" element={
                <ProtectedRoute>
                  <LiveMonitor />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </DetectionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
