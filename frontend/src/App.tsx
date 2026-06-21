import { Routes, Route } from "react-router-dom";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ToastProvider } from "./admin/ToastContext";

import Hero from "./app/components/Hero";
import Features from "./app/components/Features";
import CTA from "./app/components/CTA";
import FooterNew from "./app/components/FooterNew";

import Interview from "./app/interview/interview";
import Instructions from "./app/instructions/page";
import Thank from "./app/thank/page";
import Dashboard from "./app/dashboard/page";
import Job from "./app/job/page";
import Resume from "./app/resume/page";
import Login from "./app/login/page";
import Register from "./app/register/page";
import PlacementHead from "./app/placement-head/page";
import AdminLogin from "./AdminLogin";
import AdminPortal from "./AdminPortal";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <CTA />
      <FooterNew />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <WebSocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Student/Candidate Routes */}
              <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
              <Route path="/job" element={<ProtectedRoute><Job /></ProtectedRoute>} />
              <Route path="/instructions" element={<ProtectedRoute><Instructions /></ProtectedRoute>} />
              <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
              <Route path="/thank" element={<ProtectedRoute><Thank /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/placement-head" element={<ProtectedRoute><PlacementHead /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminPortal /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#fff' }}>
                  <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
                  <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>Page not found</p>
                  <a href="/" style={{ marginTop: '1.5rem', color: '#DC2626', textDecoration: 'underline' }}>Go Home</a>
                </div>
              } />
            </Routes>
          </WebSocketProvider>
        </div>
      </div>
    </ToastProvider>
  );
}