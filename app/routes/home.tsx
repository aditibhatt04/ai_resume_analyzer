import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Load resumes only if authenticated
  useEffect(() => {
    if(!auth.isAuthenticated) return;

    const loadResumes = async () => {
      setLoadingResumes(true);

      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes?.map((resume) => (
          JSON.parse(resume.value) as Resume
      )).filter((resume) => resume && resume.feedback)

      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    }

    loadResumes()
  }, [auth.isAuthenticated]);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      {!auth.isAuthenticated ? (
        // Not logged in - Show both options
        <div className="page-heading py-16 text-center">
          <h1>Get Instant Resume Feedback</h1>
          <p className="text-gray-600 mt-4 text-lg">Choose how you want to analyze your resume</p>
        </div>
      ) : (
        // Logged in - Show normal view
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes?.length === 0 ? (
              <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ): (
            <h2>Review your submissions and check AI-powered feedback.</h2>
          )}
        </div>
      )}

      {/* Quick Analysis Section (Available to everyone) */}
      {!auth.isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Option 1: Quick Analysis - No Login */}
          <div className="gradient-border rounded-2xl p-8 bg-white shadow-lg">
            <div className="flex flex-col h-full gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">⚡ Quick Analysis</h2>
                <p className="text-gray-600">
                  Get instant AI-powered resume feedback without creating an account
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">✓ What you get:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• ATS Score & feedback</li>
                  <li>• Content & Structure analysis</li>
                  <li>• Tone & Skills evaluation</li>
                  <li>• ⚠️ Analysis not saved (one-time use)</li>
                </ul>
              </div>
              <Link to="/upload" className="primary-button w-full text-center font-semibold mt-auto">
                Analyze Now
              </Link>
            </div>
          </div>

          {/* Option 2: Save & Track - With Login */}
          <div className="gradient-border rounded-2xl p-8 bg-white shadow-lg">
            <div className="flex flex-col h-full gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">📊 Save & Track</h2>
                <p className="text-gray-600">
                  Log in to save your analyses and track your resume improvements over time
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-2">✓ What you get:</p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• All Quick Analysis features</li>
                  <li>• Save resume history</li>
                  <li>• Track improvements</li>
                  <li>• ✅ Access anytime from any device</li>
                </ul>
              </div>
              <Link to="/auth" className="primary-button w-full text-center font-semibold mt-auto" style={{ backgroundColor: '#10b981' }}>
                Log In / Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Resumes List (Only for logged in users) */}
      {auth.isAuthenticated && (
        <>
          {loadingResumes && (
              <div className="flex flex-col items-center justify-center">
                <img src="/images/resume-scan-2.gif" className="w-[200px]" />
              </div>
          )}

          {!loadingResumes && resumes.length > 0 && (
            <div className="resumes-section">
              {resumes.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}

          {!loadingResumes && resumes?.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-10 gap-4">
                <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                  Upload Your First Resume
                </Link>
              </div>
          )}
        </>
      )}
    </section>
  </main>
}
