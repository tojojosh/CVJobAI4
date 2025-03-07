"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimizedCV, setOptimizedCV] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;
    if (!selectedFile) {
      setError("Please upload your CV file (PDF format)");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setOptimizedCV(null);
    
    try {
      // Create form data to send to the API
      const formData = new FormData();
      formData.append('jobDescription', jobDescription);
      formData.append('cvFile', selectedFile);

      // Call our API endpoint
      const response = await fetch('/api/process-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('DeploymentNotFound')) {
          throw new Error('Azure OpenAI deployment not found. Please check your Azure setup and try again in a few minutes.');
        } else if (data.error?.includes('API key')) {
          throw new Error('Invalid API key. Please check your Azure OpenAI API key configuration.');
        } else {
          throw new Error(data.error || 'Failed to process CV');
        }
      }

      // Success! Set the optimized CV
      setOptimizedCV(data.optimizedCV);
      setFeedback(`Your CV has been optimized to match the job description!`);
    } catch (err) {
      console.error('Error processing CV:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setFeedback('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (error && file) setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const downloadOptimizedCV = () => {
    if (!optimizedCV) return;
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Set font size and line height
    doc.setFontSize(12);
    const lineHeight = 7;
    let y = 20;
    
    // Split the CV text into lines and add them to the PDF
    const lines = optimizedCV.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      // Skip empty lines and formatting characters
      if (!line.trim() || line.trim() === '---' || line.trim().startsWith('**')) {
        return;
      }
      
      // Check if we need a new page
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      // Check if this is a section header (all caps or followed by a colon)
      if (line.trim().toUpperCase() === line.trim() || line.trim().endsWith(':')) {
        // Add extra spacing before new sections
        y += lineHeight * 2;
        currentSection = line.trim();
      }
      
      // Add the line to the PDF with proper text wrapping
      const splitLines = doc.splitTextToSize(line, 170); // 170 is the width in mm
      splitLines.forEach((splitLine: string) => {
        doc.text(splitLine, 20, y);
        y += lineHeight;
      });
      
      // Add extra spacing after section headers
      if (currentSection === line.trim()) {
        y += lineHeight;
      }
    });
    
    // Save the PDF
    doc.save('optimized_cv.pdf');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full flex justify-center mb-8">
        <h1 className="text-3xl font-bold text-center text-white bg-blue-600 px-8 py-4 rounded-lg shadow-lg">
          CREDOLAY
        </h1>
      </div>

      <div className="relative flex place-items-center w-full justify-center">
        <div className="w-full max-w-7xl px-10 py-12 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">
            CV Buddy
          </h2>
          <p className="mb-8 text-lg text-center text-gray-600 dark:text-gray-300">
            Paste your job description below and our AI will analyze it for you.
          </p>

          {feedback ? (
            <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">
              {feedback}
              
              {optimizedCV && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Your Optimized CV:</h3>
                  <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {optimizedCV}
                  </div>
                  <button 
                    onClick={downloadOptimizedCV}
                    className="block mx-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Download Optimized CV (PDF)
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setFeedback('');
                  setJobDescription('');
                  setSelectedFile(null);
                  setOptimizedCV(null);
                  setError(null);
                }}
                className="block mx-auto mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Start New Analysis
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  className="w-full h-64 p-4 text-base text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Paste your job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isSubmitting ? 'Analyzing...' : 'Analyze Job Description'}
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    id="cv-upload"
                    aria-label="Upload your CV in PDF format"
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="w-full px-4 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                    </svg>
                    {selectedFile ? selectedFile.name.substring(0, 15) + (selectedFile.name.length > 15 ? '...' : '') : 'Upload CV (PDF)'}
                  </button>
                </div>
              </div>
              {selectedFile && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  CV uploaded: {selectedFile.name}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      <div className="mb-32 grid text-center max-w-7xl w-full lg:mb-0 lg:grid-cols-4 lg:gap-6">
        <div className="p-8 border-2 border-blue-500 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-gray-900 hover:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Fast Analysis{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 text-base text-gray-300">
            Get instant feedback on your job description.
          </p>
        </div>

        <div className="p-8 border-2 border-green-500 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-gray-900 hover:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            AI Powered{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 text-base text-gray-300">
            Advanced AI technology to help improve your job listings.
          </p>
        </div>

        <div className="p-8 border-2 border-purple-500 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-gray-900 hover:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Better Candidates{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 text-base text-gray-300">
            Attract higher quality candidates with optimized descriptions.
          </p>
        </div>

        <div className="p-8 border-2 border-yellow-500 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-gray-900 hover:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Easy to Use{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 text-base text-gray-300">
            Simple interface - just paste your text and get results.
          </p>
        </div>
      </div>
    </main>
  );
} 