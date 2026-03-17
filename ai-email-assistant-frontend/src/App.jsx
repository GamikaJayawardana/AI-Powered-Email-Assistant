import axios from 'axios';
import { useState } from 'react';

function App() {
  const [emailContent, setEmailContent] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/email/generate",
        { emailContent, tone, length, customInstructions }
      );
      setGeneratedReply(typeof response.data === "string" ? response.data : JSON.stringify(response.data));
    } catch (error) {
      setError("Failed to generate reply. Please make sure the backend server is running.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-animate flex items-center justify-center p-4 sm:p-8 font-sans">
      
      {/* Background Decorative Blobs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="fixed top-40 right-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="fixed -bottom-8 left-1/2 w-72 h-72 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="glass-panel w-full max-w-2xl rounded-3xl p-8 sm:p-10 relative z-10 mx-auto mt-8 mb-8">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 mb-2">
            AI Email Assistant
          </h1>
          <p className="text-slate-400 text-sm font-medium">Draft intelligent replies in seconds</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Original Email</label>
            <textarea
              className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none shadow-inner"
              placeholder="Paste the email you received here..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Desired Tone</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all cursor-pointer shadow-inner"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="" className="bg-slate-800">Default</option>
                  <option value="formal" className="bg-slate-800">Formal</option>
                  <option value="casual" className="bg-slate-800">Casual</option>
                  <option value="friendly" className="bg-slate-800">Friendly</option>
                  <option value="professional" className="bg-slate-800">Professional</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Reply Length</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all cursor-pointer shadow-inner"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                >
                  <option value="" className="bg-slate-800">Default</option>
                  <option value="brief" className="bg-slate-800">Brief</option>
                  <option value="standard" className="bg-slate-800">Standard</option>
                  <option value="detailed" className="bg-slate-800">Detailed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Custom Instructions (Optional)</label>
            <input
              type="text"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
              placeholder="e.g., Always sign off with 'Best, Gamika'"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!emailContent || loading}
            className={`w-full py-4 rounded-xl font-semibold text-white tracking-wide transition-all shadow-lg flex justify-center items-center gap-2
              ${!emailContent || loading 
                ? 'bg-indigo-900/50 cursor-not-allowed opacity-70' 
                : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0'}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Magic...
              </>
            ) : "Generate Reply"}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {generatedReply && (
          <div className="mt-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="block text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                Generated Reply
              </label>
              <button
                onClick={handleCopy}
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/5 hover:border-white/20"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <textarea
              className="w-full h-48 bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner resize-none font-medium"
              value={generatedReply}
              readOnly
            /> 
          </div>
        )}  

      </div>
    </div>
  )
}

export default App
