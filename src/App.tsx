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
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/thank" element={<Thank />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/job" element={<Job />} />
          <Route path="/resume" element={<Resume />} />
        </Routes>
      </div>
    </div>
  );
}