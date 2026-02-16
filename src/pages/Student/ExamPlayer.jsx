import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { apiGetExam, apiLogViolation, apiSubmitExam } from "../../api";
import { AlertTriangle, Clock, Save, ShieldAlert, Headphones, BookOpen, PenTool, SkipForward, CheckSquare, FileText } from "lucide-react";

export default function ExamPlayer() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Exam State
  const [currentModule, setCurrentModule] = useState("listening"); // listening, reading, writing
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [answers, setAnswers] = useState({});
  const [violationCount, setViolationCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Refs
  const containerRef = useRef(null);
  const audioRef = useRef(null);

  // Constants
  const MODULE_ORDER = ["listening", "reading", "writing"];
  const MODULE_DURATIONS = { listening: 30, reading: 60, writing: 60 }; // minutes

  const logViolation = useCallback(async (type) => {
    setViolationCount((prev) => prev + 1);
    try {
      await apiLogViolation(token, id, type, { timestamp: new Date() });
    } catch (err) {
      console.error("Failed to log violation", err);
    }
  }, [token, id]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await apiGetExam(token, id);
        setExam(data);
        // Start with Listening duration
        setTimeLeft(MODULE_DURATIONS.listening * 60);
      } catch (err) {
        alert("Failed to load exam");
        navigate("/student/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id, token, navigate]);

  // Timer Logic
  useEffect(() => {
    if (!exam || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleModuleComplete(); // Auto-advance when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, timeLeft]);

  // Security Monitoring
  useEffect(() => {
    const handleVisibilityChange = () => { if (document.hidden) logViolation("tab_switch"); };
    const handleBlur = () => logViolation("window_blur");
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        logViolation("fullscreen_exit");
      } else {
        setIsFullScreen(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [logViolation]);

  const requestFullScreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        alert("Error: " + err.message);
      });
      setIsFullScreen(true);
    }
  };

  const handleModuleComplete = () => {
    const currentIndex = MODULE_ORDER.indexOf(currentModule);
    if (currentIndex < MODULE_ORDER.length - 1) {
      const nextModule = MODULE_ORDER[currentIndex + 1];
      setCurrentModule(nextModule);
      setTimeLeft(MODULE_DURATIONS[nextModule] * 60);
      alert(`Time's up! Moving to ${nextModule} module.`);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      await apiSubmitExam(token, id, { answers, time_spent_by_module: {} }); // TODO: track actual time
      alert("Exam submitted successfully!");
      if (document.fullscreenElement) document.exitFullscreen();
      navigate("/student/dashboard");
    } catch (err) {
      alert("Failed to submit exam");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading exam...</div>;

  if (!isFullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-lg text-center max-w-md">
          <ShieldAlert size={48} className="mx-auto text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Secure Exam Environment</h2>
          <p className="mb-6 text-gray-600">
            This exam requires full-screen mode. Violations such as switching tabs or exiting full-screen will be recorded.
          </p>
          <button
            onClick={requestFullScreen}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Enter Full Screen to Start
          </button>
        </div>
      </div>
    );
  }

  // Filter content for current module
  const currentSections = exam.sections?.filter(s => s.module_type === currentModule) || [];
  const currentQuestions = exam.questions?.filter(q => q.module_type === currentModule) || [];

  return (
    <div ref={containerRef} className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white p-3 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold uppercase tracking-wider text-blue-400">{currentModule} Module</div>
          <span className="text-gray-400 text-sm">Student: {user?.first_name} {user?.last_name}</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-2xl font-mono font-bold bg-gray-800 px-4 py-1 rounded text-white flex items-center space-x-2 border border-gray-700">
            <Clock size={20} className="text-yellow-500" />
            <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</span>
          </div>
          
          <button
            onClick={handleModuleComplete}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition text-sm font-medium"
          >
            <SkipForward size={16} />
            <span>{currentModule === 'writing' ? 'Submit Exam' : 'Next Section'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Module Specific Layouts */}
        
        {/* LISTENING LAYOUT */}
        {currentModule === 'listening' && (
          <div className="flex flex-col w-full h-full">
            {/* Audio Player Bar */}
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-center shrink-0">
              {currentSections.length > 0 && currentSections[0].audio_url ? (
                <audio controls controlsList="nodownload" ref={audioRef} className="w-full max-w-2xl">
                  <source src={currentSections[0].audio_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <div className="text-gray-400 flex items-center space-x-2">
                  <Headphones size={20} /> <span>Audio will play automatically for each section.</span>
                </div>
              )}
            </div>
            
            {/* Questions Area */}
            <div className="flex-1 overflow-auto p-8 bg-white">
              <div className="max-w-4xl mx-auto space-y-8">
                {currentQuestions.length > 0 ? currentQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-gray-50 border rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-medium text-gray-900 mb-4">{q.question_text}</p>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Type your answer..."
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          value={answers[q.id] || ""}
                        />
                      </div>
                    </div>
                  </div>
                )) : <div className="text-center text-gray-500 mt-20">No listening questions found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* READING LAYOUT (Split Screen) */}
        {currentModule === 'reading' && (
          <div className="flex w-full h-full">
            {/* Left: Passage */}
            <div className="w-1/2 h-full overflow-auto border-r border-gray-200 bg-white p-8">
              {currentSections.map((section) => (
                <div key={section.id} className="mb-12">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{section.title}</h3>
                  <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {section.content || "Passage content will appear here..."}
                  </div>
                </div>
              ))}
              {currentSections.length === 0 && (
                <div className="text-center text-gray-400 mt-20">No reading passages available.</div>
              )}
            </div>

            {/* Right: Questions */}
            <div className="w-1/2 h-full overflow-auto bg-gray-50 p-8">
              <div className="space-y-8">
                {currentQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <span className="font-bold text-gray-500 mt-1">Q{q.question_number}</span>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium mb-3">{q.question_text}</p>
                        
                        {/* Identify Question Type Logic could go here */}
                        {/* For now, generic input */}
                        <div className="mt-2">
                          <label className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                            <CheckSquare size={14} /> <span>Your Answer:</span>
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded focus:border-blue-500 outline-none"
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            value={answers[q.id] || ""}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WRITING LAYOUT */}
        {currentModule === 'writing' && (
          <div className="flex w-full h-full">
            {/* Left: Prompt */}
            <div className="w-1/3 h-full overflow-auto border-r border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg font-bold uppercase text-gray-500 mb-4 flex items-center">
                <FileText size={18} className="mr-2" /> Task Prompt
              </h3>
              {currentSections.map((section) => (
                <div key={section.id} className="bg-white p-6 rounded shadow-sm mb-6 border">
                  <h4 className="font-bold text-gray-800 mb-2">{section.title}</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}
              {currentSections.length === 0 && <p className="text-gray-500">No prompt available.</p>}
            </div>

            {/* Right: Editor */}
            <div className="w-2/3 h-full flex flex-col bg-white">
              <div className="flex-1 p-6">
                <textarea
                  className="w-full h-full p-6 text-lg leading-relaxed border-none outline-none resize-none font-serif text-gray-800 placeholder-gray-300"
                  placeholder="Start typing your essay here..."
                  spellCheck="false"
                  onChange={(e) => {
                    // Assuming one main writing task answer for now, or use section ID as key
                    const key = currentQuestions[0]?.id || 'writing_task';
                    setAnswers({ ...answers, [key]: e.target.value });
                  }}
                />
              </div>
              <div className="bg-gray-100 p-3 border-t text-sm text-gray-600 flex justify-between items-center">
                <span>Word Count: 0</span>
                <span className="text-gray-400">Spell check disabled</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
