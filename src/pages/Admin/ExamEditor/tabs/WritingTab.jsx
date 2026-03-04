import React, { useState } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { ChevronDown, ChevronUp, FileText, Image, Clock, Target, BookOpen, PenTool, AlertCircle, CheckCircle, Eye, EyeOff, Upload, Trash2, Plus, Info, Lightbulb, HelpCircle } from "lucide-react";

// Task 1 types based on IELTS with detailed hints
const TASK1_TYPES = [
  { 
    value: "graph", 
    label: "Graph/Chart Description", 
    description: "Line graph, bar chart, pie chart, or table",
    hint: "Student describes data trends, compares figures, highlights key features. Requires visual material upload."
  },
  { 
    value: "process", 
    label: "Process Diagram", 
    description: "Describe stages of a process or how something works",
    hint: "Student explains sequential steps in a natural/manufacturing process. Upload a diagram showing numbered or labeled stages."
  },
  { 
    value: "map", 
    label: "Map Comparison", 
    description: "Compare two maps showing changes over time",
    hint: "Student compares two versions of a location (past/present or before/after development). Upload side-by-side maps."
  },
  { 
    value: "letter_formal", 
    label: "Formal Letter (GT)", 
    description: "Write a formal/business letter",
    hint: "General Training only. Student writes to an authority figure, company, or organization with proper formal register."
  },
  { 
    value: "letter_informal", 
    label: "Informal Letter (GT)", 
    description: "Write to a friend or family member",
    hint: "General Training only. Student writes a personal letter with casual tone and friendly expressions."
  },
  { 
    value: "letter_semiformal", 
    label: "Semi-formal Letter (GT)", 
    description: "Write to someone you know professionally",
    hint: "General Training only. Student writes to a colleague, landlord, or acquaintance with polite but not overly formal tone."
  },
];

// Task 2 essay types with detailed hints
const TASK2_TYPES = [
  { 
    value: "opinion", 
    label: "Opinion Essay", 
    description: "Do you agree or disagree with a statement?",
    hint: "Prompt presents a viewpoint. Student must give their opinion clearly and support it with reasons throughout the essay."
  },
  { 
    value: "discussion", 
    label: "Discussion Essay", 
    description: "Discuss both views and give your opinion",
    hint: "Prompt presents two opposing views. Student must discuss BOTH perspectives fairly before stating which they agree with more."
  },
  { 
    value: "problem_solution", 
    label: "Problem & Solution", 
    description: "Discuss problems and suggest solutions",
    hint: "Prompt asks about causes/problems and solutions. Student identifies issues and proposes practical remedies."
  },
  { 
    value: "advantages_disadvantages", 
    label: "Advantages & Disadvantages", 
    description: "Discuss pros and cons",
    hint: "Student analyzes benefits and drawbacks of a situation, trend, or proposal. May or may not need to give opinion depending on prompt."
  },
  { 
    value: "two_part", 
    label: "Two-Part Question", 
    description: "Answer two related questions",
    hint: "Prompt contains TWO distinct questions. Student must address BOTH fully (often: 'Why is this happening? What can be done?')."
  },
];

// Detailed guidance for each task type
const TASK_TYPE_GUIDANCE = {
  // Task 1 Academic
  graph: {
    title: "Graph/Chart Description",
    description: "Student analyzes and summarizes visual data (line graph, bar chart, pie chart, table) in 150+ words.",
    example: "The line graph shows population growth in three countries between 1960 and 2020. Summarize the information by selecting and reporting the main features.",
    tips: [
      "Upload a clear, high-resolution graph or chart image",
      "Include specific numerical data in the visual",
      "Ensure all axes, labels, and legends are readable",
      "Multi-data visuals (comparing multiple items) work best"
    ]
  },
  process: {
    title: "Process Diagram",
    description: "Student describes a cyclical or linear process, explaining each stage in order.",
    example: "The diagram shows how chocolate is produced. Summarize the information by selecting and reporting the main features.",
    tips: [
      "Upload a clear diagram with numbered/labeled stages",
      "Natural processes (water cycle, life cycle) or manufacturing processes work well",
      "Include 5-10 distinct stages for ideal complexity",
      "Arrows should clearly show the sequence/direction"
    ]
  },
  map: {
    title: "Map Comparison",
    description: "Student compares two maps of the same location showing development/changes over time.",
    example: "The maps show changes to Riverside town between 1990 and 2020. Summarize the information by selecting and reporting the main features.",
    tips: [
      "Upload two maps side-by-side (or clearly labeled 'before/after')",
      "Include obvious changes (new buildings, removed features, land use changes)",
      "Compass direction (N/S/E/W) adds reference points for students",
      "Label key features: road, river, buildings, etc."
    ]
  },
  // Task 1 General Training Letters
  letter_formal: {
    title: "Formal Letter",
    description: "Student writes a formal letter following business letter conventions with appropriate tone.",
    example: "You recently bought a product online, but it arrived damaged. Write a letter to the company. Include: what you bought, the problem, what action you want.",
    tips: [
      "Specify clearly who the recipient is (manager, company, official)",
      "Provide 3 bullet points of what to include in the letter",
      "Scenario should require formal register (complaints, requests, applications)",
      "Model answer should demonstrate: salutation, clear paragraphs, formal closing"
    ]
  },
  letter_informal: {
    title: "Informal Letter",
    description: "Student writes a friendly, personal letter with casual language and warm tone.",
    example: "Your English-speaking friend is coming to visit your country. Write a letter telling them: what places you'll visit together, what they should bring, why you're excited.",
    tips: [
      "Recipient should be a friend or family member",
      "Provide 3 engaging bullet points as conversation starters",
      "Encourage friendly expressions, questions, enthusiasm",
      "Model answer should show: casual greeting, personal anecdotes, warm sign-off"
    ]
  },
  letter_semiformal: {
    title: "Semi-formal Letter",
    description: "Student writes a polite but not overly formal letter to someone they know professionally.",
    example: "You want to organize a welcome party for new employees. Write to your manager. Include: why you want to organize it, your suggestions for the event, offer to help with arrangements.",
    tips: [
      "Recipient: colleague, landlord, neighbor, teacher, local official",
      "Tone: polite and respectful but not stiff",
      "Scenarios: requests, suggestions, invitations, apologies",
      "Model should balance politeness with a personable touch"
    ]
  },
  // Task 2 Essays
  opinion: {
    title: "Opinion (Agree/Disagree) Essay",
    description: "Student states their opinion clearly and supports it with reasons and examples throughout.",
    example: "Some people believe that children should begin formal education at a very early age. Others think they should not start school until they are older. Discuss both views and give your opinion.",
    tips: [
      "Use clear stance language: 'To what extent do you agree or disagree?'",
      "Avoid ambiguous prompts—make the statement debatable",
      "Topic should be accessible (education, technology, society, environment)",
      "Model answer should show: clear thesis, strong topic sentences, consistent stance"
    ]
  },
  discussion: {
    title: "Discussion Essay",
    description: "Student presents both sides of an argument fairly before giving their own view.",
    example: "Some people think that parents should teach children how to be good members of society. Others believe that school is the place to learn this. Discuss both views and give your own opinion.",
    tips: [
      "Always include: 'Discuss both views and give your opinion'",
      "Present two genuinely opposing viewpoints",
      "Student must discuss BOTH sides (not choose one immediately)",
      "Model should have balanced body paragraphs + clear opinion in conclusion"
    ]
  },
  problem_solution: {
    title: "Problem & Solution Essay",
    description: "Student identifies causes/problems and proposes practical solutions with explanations.",
    example: "In many countries, people are living in 'throwaway societies' where things are used for a short time then thrown away. What are the causes of this? What problems does it lead to?",
    tips: [
      "Use prompts asking: 'What are the causes/problems? What solutions can you suggest?'",
      "Can separate problems from solutions OR combine them",
      "Topic should have identifiable issues AND actionable solutions",
      "Model should propose realistic, explained solutions (not just list them)"
    ]
  },
  advantages_disadvantages: {
    title: "Advantages & Disadvantages Essay",
    description: "Student analyzes both benefits and drawbacks systematically.",
    example: "In many countries, shopping online is becoming increasingly popular. What are the advantages and disadvantages of this trend?",
    tips: [
      "May ask for opinion: 'Do the advantages outweigh the disadvantages?'",
      "Or neutral analysis: 'Discuss the advantages and disadvantages'",
      "Topic should have clear pros AND cons (not one-sided issues)",
      "Model should give balanced coverage or clear judgment if asked"
    ]
  },
  two_part: {
    title: "Two-Part Question Essay",
    description: "Student must address TWO distinct but related questions in their response.",
    example: "Many young people today are leaving their homes in rural areas to study or work in cities. Why is this happening? Do you think this trend has more advantages or disadvantages?",
    tips: [
      "ALWAYS include two distinct questions in the prompt",
      "Common pairs: Why + What solutions / What causes + What effects",
      "Make it clear both questions require substantial answers",
      "Model should dedicate adequate space to BOTH questions (roughly equal)"
    ]
  }
};

// TypeInfoBox component for task guidance
function TypeInfoBox({ type, isTask1 }) {
  const guidance = TASK_TYPE_GUIDANCE[type];
  if (!guidance) return null;

  return (
    <div className={`rounded-lg p-4 border-l-4 mb-4 ${
      isTask1 
        ? 'bg-blue-50 border-blue-500' 
        : 'bg-purple-50 border-purple-500'
    }`}>
      <div className="flex items-start space-x-3">
        <HelpCircle size={20} className={isTask1 ? 'text-blue-600 mt-0.5' : 'text-purple-600 mt-0.5'} />
        <div className="flex-1">
          <h5 className={`font-semibold ${isTask1 ? 'text-blue-900' : 'text-purple-900'}`}>
            {guidance.title}
          </h5>
          <p className={`text-sm mt-1 ${isTask1 ? 'text-blue-800' : 'text-purple-800'}`}>
            {guidance.description}
          </p>
          
          <div className={`mt-3 text-xs p-2 rounded ${
            isTask1 ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'
          }`}>
            <strong>Example Prompt:</strong><br/>
            <em>"{guidance.example}"</em>
          </div>

          <div className="mt-3">
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center ${
              isTask1 ? 'text-blue-700' : 'text-purple-700'
            }`}>
              <Lightbulb size={12} className="mr-1" /> Setup Tips
            </div>
            <ul className={`text-xs space-y-1 ${
              isTask1 ? 'text-blue-800' : 'text-purple-800'
            }`}>
              {guidance.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0 ${
                    isTask1 ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskEditor({ section, taskNumber }) {
  const { updateSection } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);

  const isTask1 = taskNumber === 1;
  const taskTypes = isTask1 ? TASK1_TYPES : TASK2_TYPES;
  const defaultWordMin = isTask1 ? 150 : 250;
  const defaultDuration = isTask1 ? 20 : 40;

  // Parse task config from section content (stored as JSON)
  const getTaskConfig = () => {
    try {
      return section.task_config ? JSON.parse(section.task_config) : {
        type: taskTypes[0].value,
        prompt: "",
        instructions: "",
        imageUrl: "",
        wordMinimum: defaultWordMin,
        wordMaximum: null,
        duration: defaultDuration,
        modelAnswer: "",
        scoringCriteria: {
          taskResponse: { weight: 25, description: "How well the response addresses all parts of the task" },
          coherenceCohesion: { weight: 25, description: "Organization, paragraphing, and use of cohesive devices" },
          lexicalResource: { weight: 25, description: "Range and accuracy of vocabulary" },
          grammaticalRange: { weight: 25, description: "Range and accuracy of grammar" }
        }
      };
    } catch {
      return {
        type: taskTypes[0].value,
        prompt: "",
        instructions: "",
        imageUrl: "",
        wordMinimum: defaultWordMin,
        wordMaximum: null,
        duration: defaultDuration,
        modelAnswer: "",
        scoringCriteria: {
          taskResponse: { weight: 25, description: "How well the response addresses all parts of the task" },
          coherenceCohesion: { weight: 25, description: "Organization, paragraphing, and use of cohesive devices" },
          lexicalResource: { weight: 25, description: "Range and accuracy of vocabulary" },
          grammaticalRange: { weight: 25, description: "Range and accuracy of grammar" }
        }
      };
    }
  };

  const taskConfig = getTaskConfig();

  const updateTaskConfig = (updates) => {
    const newConfig = { ...taskConfig, ...updates };
    updateSection(section.id, { 
      task_config: JSON.stringify(newConfig),
      content: newConfig.prompt // Keep content synced with prompt for backward compatibility
    });
  };

  const selectedType = taskTypes.find(t => t.value === taskConfig.type);

  return (
    <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
      {/* Header */}
      <div 
        className={`p-5 border-b flex justify-between items-center cursor-pointer transition ${
          isTask1 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100' 
                  : 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold text-lg ${
            isTask1 ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
          }`}>
            {taskNumber}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">Writing Task {taskNumber}</h4>
            <p className="text-sm text-gray-600 mt-0.5">
              {selectedType?.label || "Select task type"} • {taskConfig.wordMinimum}+ words • {taskConfig.duration} min
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            taskConfig.prompt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {taskConfig.prompt ? 'Configured' : 'Needs Setup'}
          </span>
          {isExpanded ? <ChevronUp size={22} className="text-gray-400" /> : <ChevronDown size={22} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Task Type Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3">Task Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {taskTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => updateTaskConfig({ type: type.value })}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    taskConfig.type === type.value 
                      ? isTask1 ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  {type.hint && (
                    <div className="text-xs text-gray-400 mt-1 italic">{type.hint}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Task Type Guidance Box */}
          <TypeInfoBox type={taskConfig.type} isTask1={isTask1} />

          {/* Visual Material (Task 1 only for graph/process/map types) */}
          {isTask1 && ['graph', 'process', 'map'].includes(taskConfig.type) && (
            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <Image size={16} className="mr-2" /> Visual Material
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
                {taskConfig.imageUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={taskConfig.imageUrl} 
                      alt="Task visual" 
                      className="max-h-48 mx-auto rounded-lg shadow-sm"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex items-center justify-center space-x-2">
                      <input 
                        type="text" 
                        className="flex-1 max-w-md text-sm border p-2 rounded-lg" 
                        value={taskConfig.imageUrl}
                        onChange={(e) => updateTaskConfig({ imageUrl: e.target.value })}
                        placeholder="Image URL..."
                      />
                      <button 
                        onClick={() => updateTaskConfig({ imageUrl: "" })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">Upload graph, chart, or diagram</p>
                    <input 
                      type="text" 
                      className="mt-3 w-full max-w-md mx-auto text-sm border p-2 rounded-lg" 
                      placeholder="Or paste image URL here..."
                      onChange={(e) => updateTaskConfig({ imageUrl: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Task Prompt */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <FileText size={16} className="mr-2" /> Task Prompt
            </label>
            <textarea
              className="w-full h-40 p-4 border rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder={isTask1 
                ? "e.g., The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant."
                : "e.g., Some people believe that unpaid community service should be a compulsory part of high school programmes (for example working for a charity, improving the neighbourhood or teaching sports to younger children).\n\nTo what extent do you agree or disagree?"
              }
              value={taskConfig.prompt}
              onChange={(e) => updateTaskConfig({ prompt: e.target.value })}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                <Info size={12} className="inline mr-1" />
                Write clear instructions that students will see during the exam
              </p>
              <span className="text-xs text-gray-400">
                {taskConfig.prompt ? taskConfig.prompt.trim().split(/\s+/).length : 0} words
              </span>
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Additional Instructions (Optional)</label>
            <textarea
              className="w-full h-20 p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Any additional guidelines or notes for students..."
              value={taskConfig.instructions || ""}
              onChange={(e) => updateTaskConfig({ instructions: e.target.value })}
            />
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <Target size={14} className="mr-1" /> Min Words
              </label>
              <input
                type="number"
                min={50}
                max={500}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={taskConfig.wordMinimum}
                onChange={(e) => updateTaskConfig({ wordMinimum: parseInt(e.target.value) || defaultWordMin })}
              />
            </div>
            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <Target size={14} className="mr-1" /> Max Words
              </label>
              <input
                type="number"
                min={100}
                max={1000}
                placeholder="No limit"
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={taskConfig.wordMaximum || ""}
                onChange={(e) => updateTaskConfig({ wordMaximum: parseInt(e.target.value) || null })}
              />
            </div>
            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <Clock size={14} className="mr-1" /> Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={taskConfig.duration}
                onChange={(e) => updateTaskConfig({ duration: parseInt(e.target.value) || defaultDuration })}
              />
            </div>
          </div>

          {/* Model Answer Section */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowModelAnswer(!showModelAnswer)}
              className="flex items-center space-x-2 text-sm font-bold text-gray-700 mb-3 hover:text-blue-600"
            >
              {showModelAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>Model Answer {showModelAnswer ? '(Hide)' : '(Show)'}</span>
              <span className="text-xs font-normal text-gray-400">For grading reference</span>
            </button>
            
            {showModelAnswer && (
              <div className="space-y-2">
                <textarea
                  className="w-full h-48 p-4 border rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-green-50"
                  placeholder="Write or paste a model answer here. This will be used as a reference for grading and will not be shown to students..."
                  value={taskConfig.modelAnswer || ""}
                  onChange={(e) => updateTaskConfig({ modelAnswer: e.target.value })}
                />
                <div className="text-right text-xs text-gray-500">
                  Model answer: {taskConfig.modelAnswer ? taskConfig.modelAnswer.trim().split(/\s+/).length : 0} words
                </div>
              </div>
            )}
          </div>

          {/* Scoring Criteria Section */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowCriteria(!showCriteria)}
              className="flex items-center space-x-2 text-sm font-bold text-gray-700 mb-3 hover:text-blue-600"
            >
              <BookOpen size={16} />
              <span>Scoring Criteria {showCriteria ? '(Hide)' : '(Show)'}</span>
              <span className="text-xs font-normal text-gray-400">IELTS Band Descriptors</span>
            </button>
            
            {showCriteria && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <p className="text-xs text-gray-600 mb-4">
                  Based on IELTS Writing Band Descriptors. Each criterion is scored 0-9 and weighted equally (25% each).
                </p>
                
                {[
                  { key: 'taskResponse', label: 'Task Response', icon: Target },
                  { key: 'coherenceCohesion', label: 'Coherence & Cohesion', icon: BookOpen },
                  { key: 'lexicalResource', label: 'Lexical Resource', icon: FileText },
                  { key: 'grammaticalRange', label: 'Grammatical Range & Accuracy', icon: PenTool }
                ].map(criterion => (
                  <div key={criterion.key} className="flex items-start space-x-3 bg-white p-3 rounded-lg border">
                    <criterion.icon size={18} className="text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-800">{criterion.label}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {taskConfig.scoringCriteria?.[criterion.key]?.weight || 25}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {taskConfig.scoringCriteria?.[criterion.key]?.description || ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WritingTab() {
  const { sections, exam } = useExamEditor();
  const writingSections = sections.filter(s => s.module_type === 'writing');

  // Sort by section_order to ensure Task 1 comes before Task 2
  const sortedSections = [...writingSections].sort((a, b) => a.section_order - b.section_order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Writing Module</h3>
          <p className="text-sm text-gray-500 mt-1">
            {exam?.type === 'general' ? 'General Training' : 'Academic'} Writing • 2 Tasks • 60 minutes total
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
            <Clock size={14} />
            <span>Task 1: 20 min</span>
          </div>
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full">
            <Clock size={14} />
            <span>Task 2: 40 min</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">IELTS Writing Format</h4>
            <p className="text-sm text-amber-800 mt-1">
              <strong>Task 1:</strong> Describe visual information (graphs, charts, diagrams) or write a letter (General Training). 
              Minimum 150 words in 20 minutes.
            </p>
            <p className="text-sm text-amber-800 mt-1">
              <strong>Task 2:</strong> Write an essay in response to a point of view, argument, or problem. 
              Minimum 250 words in 40 minutes. This task carries more weight in scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Task Editors */}
      <div className="space-y-6">
        {sortedSections.length > 0 ? (
          sortedSections.map((section, idx) => (
            <TaskEditor 
              key={section.id} 
              section={section} 
              taskNumber={idx + 1}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <PenTool size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Writing sections not initialized. Try refreshing.</p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gray-50 rounded-lg p-5 border">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center">
          <CheckCircle size={18} className="mr-2 text-green-600" />
          Task Setup Checklist
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-2">Task 1 (Academic)</p>
            <ul className="space-y-1 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Upload clear graph/chart/diagram image</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Write clear task instructions</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Set minimum 150 words</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Add model answer for reference</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Task 2 (Essay)</p>
            <ul className="space-y-1 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span>Choose appropriate essay type</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span>Write thought-provoking prompt</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span>Set minimum 250 words</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span>Add Band 9 model answer</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
