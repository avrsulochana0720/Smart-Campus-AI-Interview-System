import { Routes, Route } from "react-router-dom";

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
import CandidateDashboard from "./app/candidate-dashboard/page";

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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/thank" element={<Thank />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/job" element={<Job />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/placement-head" element={<PlacementHead />} />
          <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
          <Route path="*" element={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#fff' }}>
              <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
              <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>Page not found</p>
              <a href="/" style={{ marginTop: '1.5rem', color: '#DC2626', textDecoration: 'underline' }}>Go Home</a>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}