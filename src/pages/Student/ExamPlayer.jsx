import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { 
  Clock, AlertTriangle, CheckCircle, ArrowRight, ChevronRight, 
  Maximize2, Volume2, FileText, Edit3, Send 
} from "lucide-react";
import ListeningRenderer from "./ListeningRenderer";
import ReadingRenderer from "./ReadingRenderer";
import ErrorBoundary from "../../components/ErrorBoundary";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function ExamPlayer() {
  const { id: examId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Exam data
  const [exam, setExam] = useState(null);
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Exam state
  const [currentModule, setCurrentModule] = useState("listening"); // listening, reading, writing
  const [currentPart, setCurrentPart] = useState(1); // Track which part of listening/reading is shown
  const [currentWritingTask, setCurrentWritingTask] = useState(1); // 1 = Task 1, 2 = Task 2
  const [answers, setAnswers] = useState({});
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Timer state
  const [moduleTimeRemaining, setModuleTimeRemaining] = useState({
    listening: 30 * 60,
    reading: 60 * 60,
    writing_task1: 20 * 60, // Task 1: 20 minutes
    writing_task2: 40 * 60  // Task 2: 40 minutes
  });
  const [timeSpent, setTimeSpent] = useState({
    listening: 0,
    reading: 0,
    writing_task1: 0,
    writing_task2: 0
  });

  // Fullscreen & violation state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState([]);
  const violationTimeoutRef = useRef(null);

  // Auto-save state
  const autoSaveTimeoutRef = useRef(null);
  const lastSaveRef = useRef({});

  // Module order
  const MODULE_ORDER = ["listening", "reading", "writing"];
  const MODULE_DURATIONS = { listening: 30, reading: 60, writing: 60 };

  // ============================================
  // FETCH EXAM DATA
  // ============================================
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const response = await fetch(`${API_URL}/exams/${examId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Failed to load exam");
        }

        const data = await response.json();
        console.log('[ExamPlayer] Loaded exam data:', {
          sections: data.sections?.length || 0,
          questions: data.questions?.length || 0,
          questionGroups: data.questionGroups?.length || 0,
          summaryQuestions: data.questions?.filter(q => q.question_type === 'summary_completion').length || 0,
          summaryGroups: data.questionGroups?.filter(g => g.question_type === 'summary_completion').length || 0
        });
        console.log('[ExamPlayer] Summary completion questions:', data.questions?.filter(q => q.question_type === 'summary_completion'));
        setExam(data);
        setSections(data.sections || []);
        setQuestions(data.questions || []);
        setQuestionGroups(data.questionGroups || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && examId) {
      fetchExamData();
    }
  }, [token, examId]);

  // ============================================
  // FULLSCREEN ENFORCEMENT
  // ============================================
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  const handleFullscreenChange = useCallback(() => {
    const isNowFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isNowFullscreen);

    if (!isNowFullscreen && hasStarted && !examSubmitted) {
      // User exited fullscreen during exam - log violation
      logViolation("fullscreen_exit");
    }
  }, [hasStarted, examSubmitted]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [handleFullscreenChange]);

  // ============================================
  // VIOLATION LOGGING
  // ============================================
  const logViolation = useCallback(async (type) => {
    if (!hasStarted || examSubmitted) return;

    const violation = {
      type,
      timestamp: new Date().toISOString(),
      module: currentModule
    };

    setViolations(prev => [...prev, violation]);

    try {
      await fetch(`${API_URL}/exams/${examId}/violations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type, metadata: { module: currentModule } })
      });
    } catch (err) {
      console.error("Failed to log violation:", err);
    }

    // Show warning
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
    violationTimeoutRef.current = setTimeout(() => {
      if (!document.fullscreenElement && hasStarted && !examSubmitted) {
        enterFullscreen();
      }
    }, 5000);
  }, [hasStarted, examSubmitted, currentModule, examId, token, enterFullscreen]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted && !examSubmitted) {
        logViolation("tab_switch");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasStarted, examSubmitted, logViolation]);

  // ============================================
  // MODULE TIMER
  // ============================================
  useEffect(() => {
    if (!hasStarted || examSubmitted) return;

    const interval = setInterval(() => {
      // Determine the timer key based on current module and task
      const timerKey = currentModule === 'writing' 
        ? `writing_task${currentWritingTask}` 
        : currentModule;

      setModuleTimeRemaining(prev => {
        const newTime = Math.max(0, prev[timerKey] - 1);
        
        // Auto-redirect when time runs out
        if (newTime === 0) {
          // If in writing Task 1, move to Task 2
          if (currentModule === 'writing' && currentWritingTask === 1) {
            setCurrentWritingTask(2);
          } else {
            // Move to next module or finish
            const currentIndex = MODULE_ORDER.indexOf(currentModule);
            if (currentIndex < MODULE_ORDER.length - 1) {
              handleModuleSubmit(true); // Auto-submit and move to next
            } else {
              handleFinalSubmit(); // Time's up on last module
            }
          }
        }

        return { ...prev, [timerKey]: newTime };
      });

      setTimeSpent(prev => ({
        ...prev,
        [timerKey]: prev[timerKey] + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, currentModule, currentWritingTask, examSubmitted]);

  // ============================================
  // AUTO-SAVE
  // ============================================
  const saveAnswers = useCallback(async (answerData = answers) => {
    if (!hasStarted) return;

    try {
      await fetch(`${API_URL}/exams/${examId}/autosave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: answerData,
          module: currentModule,
          timestamp: new Date().toISOString()
        })
      });
      lastSaveRef.current = { ...answerData };
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [hasStarted, answers, currentModule, examId, token]);

  // ============================================
  // AUTO-SAVE
  // ============================================
  // Auto-save on answer change
  useEffect(() => {
    if (JSON.stringify(answers) === JSON.stringify(lastSaveRef.current)) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveAnswers();
    }, 2000); // Save 2 seconds after last change

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [answers, saveAnswers]);

  // ============================================
  // START EXAM
  // ============================================
  const handleStartExam = async () => {
    await enterFullscreen();
    setHasStarted(true);

    // Log exam start
    try {
      await fetch(`${API_URL}/exams/${examId}/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          event_type: "exam_started",
          metadata: { module: "listening" }
        })
      });
    } catch (err) {
      console.error("Failed to log exam start:", err);
    }
  };

  // ============================================
  // MODULE SUBMISSION
  // ============================================
  const handleModuleSubmit = async (autoSubmit = false) => {
    // If in writing module Task 1, warn and move to Task 2 instead  
    if (currentModule === 'writing' && currentWritingTask === 1) {
      const confirmMove = window.confirm('You are still on Task 1. Do you want to move to Task 2? (You can also click "Continue to Task 2" button)');
      if (confirmMove) {
        setCurrentWritingTask(2);
      }
      return;
    }

    // Save answers before moving to next module
    await saveAnswers();

    const currentIndex = MODULE_ORDER.indexOf(currentModule);
    if (currentIndex < MODULE_ORDER.length - 1) {
      const nextModule = MODULE_ORDER[currentIndex + 1];
      setCurrentModule(nextModule);
      setCurrentPart(1); // Reset to part 1 for new module
      setCurrentWritingTask(1); // Reset to task 1 for writing

      // Log module completion
      try {
        await fetch(`${API_URL}/exams/${examId}/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            event_type: "module_completed",
            metadata: { 
              module: currentModule, 
              auto_submit: autoSubmit,
              time_spent_writing_task1: timeSpent.writing_task1 || 0,
              time_spent_writing_task2: timeSpent.writing_task2 || 0,
              time_spent: currentModule === 'writing' 
                ? (timeSpent.writing_task1 || 0) + (timeSpent.writing_task2 || 0)
                : timeSpent[currentModule]
            }
          })
        });
      } catch (err) {
        console.error("Failed to log module completion:", err);
      }
    }
  };

  // ============================================
  // FINAL SUBMISSION
  // ============================================
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    // Final save before submission
    await saveAnswers();

    try {
      // Aggregate writing task times into total writing time
      const submissionTimeSpent = {
        listening: timeSpent.listening,
        reading: timeSpent.reading,
        writing: (timeSpent.writing_task1 || 0) + (timeSpent.writing_task2 || 0)
      };

      const response = await fetch(`${API_URL}/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          time_spent_by_module: submissionTimeSpent,
          violations: violations.length
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Submission failed");
      }

      setExamSubmitted(true);

      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      alert("Submission failed: " + err.message);
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get all sections for current module
  const allModuleSections = sections.filter(s => s.module_type === currentModule).sort((a, b) => a.section_order - b.section_order);
  
  // For listening and reading, only show current part
  let currentSection = null;
  if (currentModule === "listening" || currentModule === "reading") {
    currentSection = allModuleSections[currentPart - 1];
  }
  
  // Legacy computed values for compatibility
  const currentSections = currentModule === "writing" ? allModuleSections : (currentSection ? [currentSection] : []);
  const currentQuestions = questions.filter(q => {
    const qSection = sections.find(s => s.id === q.section_id);
    if (currentModule === "listening" || currentModule === "reading") {
      return qSection?.id === currentSection?.id;
    }
    return qSection?.module_type === currentModule;
  });

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Exam</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // SUBMISSION COMPLETE
  // ============================================
  if (examSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Exam Submitted!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your exam has been successfully submitted. Your instructor will review your responses and provide results.
          </p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Exam Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Listening</p>
                <p className="font-bold text-gray-900">{Math.floor(timeSpent.listening / 60)} min</p>
              </div>
              <div>
                <p className="text-gray-500">Reading</p>
                <p className="font-bold text-gray-900">{Math.floor(timeSpent.reading / 60)} min</p>
              </div>
              <div>
                <p className="text-gray-500">Writing</p>
                <p className="font-bold text-gray-900">{Math.floor(timeSpent.writing / 60)} min</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // START SCREEN
  // ============================================
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{exam?.title || "IELTS Exam"}</h1>
            <p className="text-blue-100">{exam?.description}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Modules Info */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Exam Structure</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Volume2 size={24} className="text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Listening</p>
                        <p className="text-sm text-gray-600">4 sections, 40 questions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{MODULE_DURATIONS.listening} min</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <FileText size={24} className="text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Reading</p>
                        <p className="text-sm text-gray-600">3 passages, 40 questions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{MODULE_DURATIONS.reading} min</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <Edit3 size={24} className="text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Writing</p>
                        <p className="text-sm text-gray-600">2 tasks</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{MODULE_DURATIONS.writing} min</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center">
                  <AlertTriangle size={20} className="mr-2" />
                  Important Instructions
                </h4>
                <ul className="space-y-2 text-sm text-amber-900">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>The exam will enter fullscreen mode. Do not exit or switch tabs.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Each module has a time limit. You'll be automatically moved to the next module when time expires.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your answers are automatically saved. You cannot return to previous modules.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Violations (tab switches, exiting fullscreen) will be logged.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Start Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleStartExam}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Maximize2 size={24} />
                <span>Start Exam (Fullscreen)</span>
                <ArrowRight size={24} />
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                By starting, you agree to follow exam rules and regulations
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN EXAM INTERFACE
  // ============================================
  const timerKey = currentModule === 'writing' ? `writing_task${currentWritingTask}` : currentModule;
  const timeColor = moduleTimeRemaining[timerKey] < 300 ? "text-red-600" : "text-gray-700";
  const isLastModule = currentModule === MODULE_ORDER[MODULE_ORDER.length - 1] && 
                       (currentModule !== 'writing' || currentWritingTask === 2);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-bold">{exam?.title}</h2>
          <div className="flex items-center space-x-4 text-sm">
            <span className="px-3 py-1 bg-white/10 rounded-full capitalize">{currentModule}</span>
            {violations.length > 0 && (
              <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-full flex items-center space-x-1">
                <AlertTriangle size={14} />
                <span>{violations.length} violations</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className={`flex items-center space-x-2 font-bold text-lg text-white`}>
            <Clock size={20} />
            <span>{formatTime(moduleTimeRemaining[timerKey])}</span>
            {currentModule === 'writing' && (
              <span className="text-sm font-normal ml-2">Task {currentWritingTask}</span>
            )}
          </div>
          
          <button
            onClick={isLastModule ? handleFinalSubmit : () => handleModuleSubmit(false)}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center space-x-2 transition disabled:opacity-50"
          >
            <span>{isLastModule ? "Submit Exam" : `Submit ${currentModule}`}</span>
            {isLastModule ? <Send size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      {/* Module Content */}
      <div className="flex-1 overflow-hidden">
        {/* Listening Module */}
        {currentModule === "listening" && currentSection && (
          <div className="h-full flex flex-col p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Listening Module - Part {currentPart}</h3>
            
            {/* Audio Section */}
            {currentSection.audio_url && (
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 mb-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-3">
                    <Volume2 size={24} className="text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Audio</h4>
                  </div>
                  <audio 
                    controls 
                    className="w-full max-w-2xl"
                    src={currentSection.audio_url}
                    style={{ outline: 'none' }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-sm text-gray-600">Listen carefully to the audio before answering</p>
                </div>
              </div>
            )}
            {!currentSection.audio_url && !exam?.modules_config?.listening?.global_audio_url && (
              <div className="bg-yellow-50 rounded-xl border-2 border-yellow-200 p-4 mb-6">
                <p className="text-yellow-800 text-sm">⚠️ No audio file attached for this section</p>
              </div>
            )}

            {/* Questions - Show only current part */}
            <div className="flex-1 overflow-y-auto">
              <ErrorBoundary>
                <ListeningRenderer 
                  sections={[currentSection]}
                  questions={currentQuestions}
                  questionGroups={questionGroups.filter(g => g.section_id === currentSection.id)}
                  answers={answers}
                  setAnswers={setAnswers}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Reading Module */}
        {currentModule === "reading" && currentSection && (
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
              <ErrorBoundary>
                <ReadingRenderer 
                  section={currentSection}
                  partNumber={currentPart}
                  globalOffset={allModuleSections.slice(0, currentPart - 1).reduce((sum, s) => sum + questions.filter(q => q.section_id === s.id).length, 0)}
                  questions={currentQuestions}
                  questionGroups={questionGroups.filter(g => g.section_id === currentSection.id)}
                  answers={answers}
                  setAnswers={setAnswers}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Writing Module */}
        {currentModule === "writing" && (
          <div className="h-full flex flex-col p-6">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900" style={{color: 'rgb(41, 69, 99)', fontFamily: 'Montserrat, Helvetica, Arial, sans-serif'}}>
                  Writing Module - Task {currentWritingTask}
                </h3>
                <div className="text-sm text-gray-600">
                  {currentWritingTask === 1 ? '20 minutes' : '40 minutes'}
                </div>
              </div>
            
            <div className="flex-1 overflow-y-auto">
              {currentSections
                .filter((_, idx) => idx + 1 === currentWritingTask) // Show only current task
                .map((section, idx) => {
                  let taskConfig;
                  try {
                    taskConfig = section.task_config ? JSON.parse(section.task_config) : {};
                  } catch {
                    taskConfig = {};
                  }
                  const actualTaskNumber = currentWritingTask;
                  const taskKey = `writing_task_${actualTaskNumber}`;
                  return (
                    <div key={section.id} className="bg-white rounded-xl border-2 border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-xl text-gray-900" style={{fontFamily: 'Montserrat, Helvetica, Arial, sans-serif'}}>
                            Task {actualTaskNumber}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {actualTaskNumber === 1 ? 'Minimum 150 words' : 'Minimum 250 words'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          Word count: {(answers[taskKey] || '').split(/\s+/).filter(Boolean).length}
                        </div>
                      </div>

                      {/* Task Prompt */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div 
                          className="prose prose-sm max-w-none"
                          style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
                          dangerouslySetInnerHTML={{ __html: taskConfig.prompt || section.content }}
                        />
                      </div>

                      {/* Response Area */}
                      <textarea
                        className="w-full h-64 p-4 border-2 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                        style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
                        placeholder={`Write your response for Task ${actualTaskNumber} here...`}
                        value={answers[taskKey] || ""}
                        onChange={(e) => setAnswers({...answers, [taskKey]: e.target.value})}
                      />
                      
                      {/* Task 1 -> Task 2 Navigation */}
                      {currentWritingTask === 1 && (
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={() => setCurrentWritingTask(2)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-2 transition"
                          >
                            <span>Continue to Task 2</span>
                            <ArrowRight size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center space-x-6 flex-wrap gap-y-3">
          {currentModule === "listening" && (() => {
            let cumulativeOffset = 0;
            return allModuleSections.map((section, partIdx) => {
              const partNumber = partIdx + 1;
              const globalOffset = cumulativeOffset;
              const partQuestions = questions.filter(q => q.section_id === section.id).sort((a, b) => a.question_number - b.question_number);
              const isCurrentPart = partNumber === currentPart;
              
              // Update offset for next part
              cumulativeOffset += partQuestions.length;

              return (
                <div key={section.id} className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPart(partNumber)}
                    className={`text-sm font-semibold transition cursor-pointer px-3 py-1.5 rounded-lg ${
                      isCurrentPart ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    Part {partNumber}
                  </button>
                  <div className="flex space-x-1">
                    {partQuestions.map((q, qIdx) => {
                      const globalNum = globalOffset + qIdx + 1;
                      const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentPart(partNumber);
                            // Scroll to question after a brief delay to let the part render
                            setTimeout(() => {
                              const element = document.querySelector(`[data-question-id="${q.id}"]`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition hover:scale-110 ${
                            isAnswered ? 'bg-green-400 text-white hover:bg-green-500' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                          title={`Question ${globalNum}${isAnswered ? ' - Answered' : ''}`}
                        >
                          {globalNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}

          {currentModule === "reading" && (() => {
            let cumulativeOffset = 0;
            return allModuleSections.map((section, partIdx) => {
              const partNumber = partIdx + 1;
              const globalOffset = cumulativeOffset;
              const partQuestions = questions.filter(q => q.section_id === section.id).sort((a, b) => a.question_number - b.question_number);
              const isCurrentPart = partNumber === currentPart;
              
              // Update offset for next part
              cumulativeOffset += partQuestions.length;

              return (
                <div key={section.id} className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPart(partNumber)}
                    className={`text-sm font-semibold transition cursor-pointer px-3 py-1.5 rounded-lg ${
                      isCurrentPart ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-100'
                    }`}
                  >
                    Part {partNumber}
                  </button>
                  <div className="flex space-x-1">
                    {partQuestions.map((q, qIdx) => {
                      const globalNum = globalOffset + qIdx + 1;
                      const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentPart(partNumber);
                            // Scroll to question after a brief delay to let the part render
                            setTimeout(() => {
                              const element = document.querySelector(`[data-question-id="${q.id}"]`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition hover:scale-110 ${
                            isAnswered ? 'bg-green-400 text-white hover:bg-green-500' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                          title={`Question ${globalNum}${isAnswered ? ' - Answered' : ''}`}
                      >
                        {globalNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          });
          })()}

          {currentModule === "writing" && currentSections.map((section, idx) => {
            const taskNumber = idx + 1;
            const taskKey = `writing_task_${taskNumber}`;
            const isAnswered = (answers[taskKey] || '').trim().length > 0;
            const isCurrentTask = taskNumber === currentWritingTask;
            const isAccessible = taskNumber <= currentWritingTask; // Can only access current or previous tasks
            
            return (
              <button 
                key={section.id} 
                onClick={() => {
                  if (isAccessible) {
                    setCurrentWritingTask(taskNumber);
                  }
                }}
                disabled={!isAccessible}
                className={`flex items-center space-x-3 cursor-pointer transition ${
                  isCurrentTask ? 'opacity-100' : isAccessible ? 'opacity-70 hover:opacity-100' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <span className={`text-sm font-semibold min-w-[60px] ${
                  isCurrentTask ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  Task {taskNumber}
                </span>
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isAnswered ? 'bg-green-100 border-green-400' : isCurrentTask ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-300'
                  }`}
                >
                  {isAnswered && <span className="text-green-600 text-xs">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Exit Warning */}
      {!isFullscreen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fullscreen Required</h2>
            <p className="text-gray-600 mb-6">
              You must remain in fullscreen mode during the exam. This violation has been logged.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
