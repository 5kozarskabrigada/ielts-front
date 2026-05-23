import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { ArrowLeft, User, CheckCircle, XCircle, FileText, PenTool, Star, Loader2, Download, Sparkles, RefreshCw, Mail, Edit2, Save } from "lucide-react";
import NotificationModal from "../../components/NotificationModal/NotificationModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL, apiGradeWritingWithAI } from "../../api";
import { stripHtmlTags } from "../../utils/textHelpers";

/**
 * Extract the sentence containing a specific blank from a template.
 * Sentences are defined by periods (.), bullet points (•), or line breaks.
 * Returns just the sentence/line with that blank.
 * 
 * @param {string} template - The full template with [BLANK] placeholders
 * @param {number} blankIndex - Which blank to extract (0-based, e.g., 0 for first blank)
 * @returns {string} - The sentence containing that blank with [BLANK] replaced by ___
 */
function extractSentenceForBlank(template, blankIndex) {
  if (!template) return '';
  
  // Clean up the template text - strip HTML first
  let cleanTemplate = String(template).trim();
  
  // Enhanced HTML stripping - remove tags and clean up fragments
  cleanTemplate = cleanTemplate.replace(/<[^>]*>/g, ''); // Remove complete tags
  cleanTemplate = cleanTemplate.replace(/[<>]/g, ''); // Remove stray angle brackets
  cleanTemplate = cleanTemplate.replace(/style\s*=\s*["'][^"']*["']/gi, ''); // Remove style attributes
  cleanTemplate = cleanTemplate.replace(/font-size:\s*\w+;?/gi, ''); // Remove font-size declarations
  cleanTemplate = cleanTemplate.replace(/[-]size:\s*\w+;?/gi, ''); // Remove broken style fragments
  cleanTemplate = cleanTemplate.trim();
  
  if (!cleanTemplate) return '';
  
  // Find all [BLANK] positions
  const blankRegex = /\[BLANK\]/g;
  const blanks = [];
  let match;
  while ((match = blankRegex.exec(cleanTemplate)) !== null) {
    blanks.push(match.index);
  }
  
  // If no blanks found, return the text as-is
  if (blanks.length === 0) {
    return cleanTemplate;
  }
  
  // If blankIndex is out of range, use the first blank
  const actualIndex = (blankIndex >= 0 && blankIndex < blanks.length) ? blankIndex : 0;
  
  // Special case: if only one blank, just return the whole template
  if (blanks.length === 1) {
    return cleanTemplate.replace(/\[BLANK\]/g, '___');
  }
  
  // For multiple blanks: Extract text around THIS specific blank only
  // Strategy: Find sentence boundaries around the target blank position
  const targetBlankPos = blanks[actualIndex];
  
  // Look backwards for sentence start
  const beforeBlank = cleanTemplate.substring(0, targetBlankPos);
  let sentenceStart = 0;
  
  // Check for various sentence separators going backwards
  const bulletMatch = beforeBlank.match(/[•\*\-]\s*(?=[^\n]*$)/);
  const numberedMatch = beforeBlank.match(/\d+\.\s*(?=[^\n]*$)/);
  const lineBreak = beforeBlank.lastIndexOf('\n');
  // NEW: Better dash detection - find any sequence of 2+ dashes
  const dashMatch = beforeBlank.match(/[-]{2,}/g);
  const dashSep = dashMatch ? beforeBlank.lastIndexOf(dashMatch[dashMatch.length - 1]) : -1;
  const dashLength = dashMatch && dashMatch.length > 0 ? dashMatch[dashMatch.length - 1].length : 0;
  const periodPos = beforeBlank.lastIndexOf('.');
  const exclamPos = beforeBlank.lastIndexOf('!');
  const questPos = beforeBlank.lastIndexOf('?');
  const semicolonPos = beforeBlank.lastIndexOf(';'); // NEW: Semicolon detection
  // NEW: Look backwards for capital letter after whitespace (sentence start)
  // Simplified: just look for space(s) + capital letter
  const capitalMatches = [...beforeBlank.matchAll(/\s+([A-Z])/g)];
  const lastCapitalPos = capitalMatches.length > 0 ? 
    capitalMatches[capitalMatches.length - 1].index + capitalMatches[capitalMatches.length - 1][0].length - 1 : -1;
  
  // Use the CLOSEST separator before the blank
  const separators = [
    bulletMatch ? bulletMatch.index : -1,
    numberedMatch ? numberedMatch.index : -1,
    lineBreak,
    dashSep,
    periodPos,
    exclamPos,
    questPos,
    semicolonPos,
    lastCapitalPos
  ].filter(pos => pos >= 0);
  
  if (separators.length > 0) {
    sentenceStart = Math.max(...separators);
    // If it's a period/!/?, move past it and any whitespace
    if (sentenceStart === periodPos || sentenceStart === exclamPos || sentenceStart === questPos || sentenceStart === semicolonPos) {
      sentenceStart += 1;
    }
    // If it's a dash separator, move past ALL the dashes
    if (sentenceStart === dashSep) {
      sentenceStart += dashLength;
    }
    // If it's a line break, move past it
    if (sentenceStart === lineBreak) {
      sentenceStart += 1;
    }
    // If it's a capital letter position, keep it (don't skip past it)
    // Capital letter IS the start of the sentence
  }
  
  // Look forward for sentence end
  const afterBlankStart = targetBlankPos + '[BLANK]'.length;
  const afterBlank = cleanTemplate.substring(afterBlankStart);
  let sentenceEnd = cleanTemplate.length;
  
  // Check for various sentence separators going forward
  const nextLineBreak = afterBlank.indexOf('\n');
  // NEW: Better dash detection - find any sequence of 2+ dashes
  const nextDashMatch = afterBlank.match(/[-]{2,}/);
  const nextDashSep = nextDashMatch ? nextDashMatch.index : -1;
  const nextPeriod = afterBlank.indexOf('.');
  const nextExclam = afterBlank.indexOf('!');
  const nextQuest = afterBlank.indexOf('?');
  const nextSemicolon = afterBlank.indexOf(';'); // NEW: Semicolon detection
  const nextBullet = afterBlank.match(/[•\*\-]\s/);
  const nextNumbered = afterBlank.match(/\d+\.\s/);
  // NEW: Look for capital letter as sentence start (e.g., "and ___ The next sentence")
  const nextCapital = afterBlank.match(/\s+[A-Z]/);
  
  // Use the CLOSEST separator after the blank
  const endSeparators = [
    nextLineBreak >= 0 ? afterBlankStart + nextLineBreak : -1,
    nextDashSep >= 0 ? afterBlankStart + nextDashSep : -1,
    nextPeriod >= 0 ? afterBlankStart + nextPeriod : -1,
    nextExclam >= 0 ? afterBlankStart + nextExclam : -1,
    nextQuest >= 0 ? afterBlankStart + nextQuest : -1,
    nextSemicolon >= 0 ? afterBlankStart + nextSemicolon : -1,
    nextBullet ? afterBlankStart + nextBullet.index : -1,
    nextNumbered ? afterBlankStart + nextNumbered.index : -1,
    nextCapital ? afterBlankStart + nextCapital.index : -1
  ].filter(pos => pos >= 0);
  
  if (endSeparators.length > 0) {
    sentenceEnd = Math.min(...endSeparators);
    // If it's a period/!/?, include it in the sentence
    if (sentenceEnd === afterBlankStart + nextPeriod || 
        sentenceEnd === afterBlankStart + nextExclam || 
        sentenceEnd === afterBlankStart + nextQuest) {
      sentenceEnd += 1;
    }
    // Semicolon: don't include it in the sentence (just like period)
    // Capital letter and dash: don't include (they mark start of next sentence)
  }
  
  // Extract the sentence containing this blank
  const extractedSentence = cleanTemplate.substring(sentenceStart, sentenceEnd).trim();
  
  // Replace only [BLANK] with ___ in the extracted sentence
  return extractedSentence.replace(/\[BLANK\]/g, '___');
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailingPdf, setEmailingPdf] = useState(false);
  const [gradingTasks, setGradingTasks] = useState({});
  const [editingSpeaking, setEditingSpeaking] = useState(false);
  const [speakingScore, setSpeakingScore] = useState('');
  const [savingSpeaking, setSavingSpeaking] = useState(false);
  const [editingWriting, setEditingWriting] = useState(false);
  const [writingScore, setWritingScore] = useState('');
  const [savingWriting, setSavingWriting] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  const pageRef = React.useRef(null);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const fetchSubmissionDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/monitoring/submissions/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submission: ${response.status}`);
      }
      
      const data = await response.json();
      setSubmission(data);
      // Initialize speaking score if it exists
      if (data.speaking_band_score != null) {
        setSpeakingScore(String(data.speaking_band_score));
      }
    } catch (err) {
      console.error("Failed to fetch submission details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPdf = async () => {
    if (!submission || emailingPdf) return;
    
    if (!submission.user_email) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Email Error',
        message: 'Student email not found. Cannot send PDF.'
      });
      return;
    }

    setEmailingPdf(true);

    try {
      const { pdf, filename } = await buildSubmissionPdf();
      const pdfBlob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', pdfBlob, filename);

      const response = await fetch(`${API_URL}/monitoring/submissions/${id}/email-pdf`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Special handling for email service not configured
        if (response.status === 503 && data.details) {
          throw new Error(`Email service not configured on server. ${data.details}`);
        }
        throw new Error(data.error || data.message || 'Failed to send PDF');
      }

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'PDF Sent Successfully',
        message: `Results PDF has been sent to ${submission.user_email}`
      });
    } catch (error) {
      console.error('Failed to email PDF:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Email Failed',
        message: error.message || 'Failed to send PDF via email'
      });
    } finally {
      setEmailingPdf(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const EXAMROOM_LOGO_URL = 'https://www.image2url.com/r2/default/images/1776187544241-f8e0bf3d-2418-475d-ad65-2a9b6939d231.png';

  const LISTENING_BAND_TABLE = [
    { min: 39, max: 40, band: 9.0 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8.0 },
    { min: 32, max: 34, band: 7.5 },
    { min: 30, max: 31, band: 7.0 },
    { min: 26, max: 29, band: 6.5 },
    { min: 23, max: 25, band: 6.0 },
    { min: 18, max: 22, band: 5.5 },
    { min: 16, max: 17, band: 5.0 },
    { min: 13, max: 15, band: 4.5 },
    { min: 10, max: 12, band: 4.0 },
    { min: 7, max: 9, band: 3.5 },
    { min: 4, max: 6, band: 3.0 },
    { min: 3, max: 3, band: 2.5 },
    { min: 2, max: 2, band: 2.0 },
    { min: 1, max: 1, band: 1.0 },
    { min: 0, max: 0, band: 0.0 },
  ];

  const ACADEMIC_READING_BAND_TABLE = [
    { min: 39, max: 40, band: 9.0 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8.0 },
    { min: 33, max: 34, band: 7.5 },
    { min: 30, max: 32, band: 7.0 },
    { min: 27, max: 29, band: 6.5 },
    { min: 23, max: 26, band: 6.0 },
    { min: 19, max: 22, band: 5.5 },
    { min: 15, max: 18, band: 5.0 },
    { min: 13, max: 14, band: 4.5 },
    { min: 10, max: 12, band: 4.0 },
    { min: 8, max: 9, band: 3.5 },
    { min: 7, max: 7, band: 3.5 },
    { min: 6, max: 6, band: 3.0 },
    { min: 5, max: 5, band: 3.0 },
    { min: 4, max: 4, band: 3.0 },
    { min: 3, max: 3, band: 2.5 },
    { min: 2, max: 2, band: 2.0 },
    { min: 1, max: 1, band: 1.0 },
    { min: 0, max: 0, band: 0.0 },
  ];

  const loadLogoAsDataUrl = async (url) => {
    const candidates = [
      url,
      // CORS-safe proxy fallback while still using your URL as source
      'https://images.weserv.nl/?url=www.image2url.com/r2/default/images/1776187544241-f8e0bf3d-2418-475d-ad65-2a9b6939d231.png'
    ];

    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, { cache: 'no-store' });
        if (!response.ok) continue;
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (typeof dataUrl === 'string') return dataUrl;
      } catch {
        // try next candidate
      }
    }

    return null;
  };

  const getModuleTotal = (moduleKey, moduleAnswers) => {
    const correct = Number(moduleAnswers?.correct || 0);
    const wrong = Number(moduleAnswers?.wrong || 0);
    const skipped = Number(moduleAnswers?.skipped || 0);
    const explicitTotal = Number(moduleAnswers?.total_questions || 0);
    const answersLen = Array.isArray(moduleAnswers?.answers) ? moduleAnswers.answers.length : 0;
    const maxQuestionNumber = Array.isArray(moduleAnswers?.answers)
      ? moduleAnswers.answers.reduce((m, a) => Math.max(m, Number(a?.question_number || 0)), 0)
      : 0;

    let total = Math.max(explicitTotal, answersLen, correct + wrong + skipped, maxQuestionNumber);

    if ((moduleKey === 'reading' || moduleKey === 'listening') && total > 0 && total < 40) {
      total = 40;
    }

    return total;
  };

  const getBandFromCorrect = (correctAnswers, table) => {
    const n = Math.round(Number(correctAnswers) || 0);
    if (n >= 1 && n <= 9) {
      if (n === 1) return 1.0;
      if (n === 2) return 2.0;
      if (n === 3) return 2.5;
      if (n >= 4 && n <= 6) return 3.0;
      return 3.5; // 7-9
    }
    const matched = table.find((row) => n >= row.min && n <= row.max);
    return matched ? matched.band : null;
  };

  const getModuleBandScore = (moduleKey) => {
    if (moduleKey === 'writing' && !submission?.writing_checked) {
      return null;
    }

    if (moduleKey === 'speaking') {
      // Speaking score is manually entered by admin
      const speakingBand = submission?.speaking_band_score;
      return speakingBand != null ? parseFloat(speakingBand) : null;
    }

    if (moduleKey === 'writing') {
      // Check for manual writing band score override first
      const manualWritingBand = submission?.writing_band_score;
      if (manualWritingBand != null) {
        return parseFloat(manualWritingBand);
      }
      
      // Fall back to AI/admin-scored tasks if no manual override
      const writingResponses = Array.isArray(submission?.writing_responses) ? submission.writing_responses : [];
      const taskBands = writingResponses
        .map((wr) => wr.admin_override_band ?? wr.final_band ?? wr.ai_overall_band)
        .map((v) => parseFloat(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (taskBands.length > 0) {
        return taskBands.reduce((a, b) => a + b, 0) / taskBands.length;
      }
      return null;
    }

    if (moduleKey === 'reading') {
      const readingCorrect = Number(submission?.answers_by_module?.reading?.correct || 0);
      const readingBand = getBandFromCorrect(readingCorrect, ACADEMIC_READING_BAND_TABLE);
      if (readingBand != null) return readingBand;
    }

    if (moduleKey === 'listening') {
      const listeningCorrect = Number(submission?.answers_by_module?.listening?.correct || 0);
      const listeningBand = getBandFromCorrect(listeningCorrect, LISTENING_BAND_TABLE);
      if (listeningBand != null) return listeningBand;
    }

    const raw = submission?.scores_by_module?.[moduleKey];
    const parsed = raw != null && raw !== '' ? parseFloat(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;

    return null;
  };

  const isWritingChecked = submission?.writing_checked === true;

  const buildSubmissionPdf = async () => {
    if (!submission) {
      throw new Error('Submission data is not available');
    }

    try {

      const studentName = (submission.user_name || 'Unknown').replace(/\s+/g, '_');
      const examTitle = (submission.exam_title || 'Exam').replace(/\s+/g, '_');
      const filename = `${studentName}_${examTitle}_Results.pdf`;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      const dark = [17, 24, 39];
      const muted = [107, 114, 128];
      const border = [229, 231, 235];
      const panel = [249, 250, 251];
      const green = [22, 163, 74];
      const red = [220, 38, 38];
      const amber = [217, 119, 6];
      const logoDataUrl = await loadLogoAsDataUrl(EXAMROOM_LOGO_URL);

      const totalScore = (submission.band_score != null && isWritingChecked)
        ? parseFloat(submission.band_score).toFixed(1)
        : '-';
      const completedDate = submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
      const getModuleStats = (moduleKey) => {
        const m = submission.answers_by_module?.[moduleKey] || {};
        const correct = Number(m.correct || 0);
        const total = getModuleTotal(moduleKey, m);
        return { correct, total };
      };

      const drawCover = () => {
        const brandY = margin;
        const brandH = 18;
        const coverY = margin + 22;

        // Put logo at the very beginning of the page in a dedicated brand strip.
        pdf.setFillColor(...panel);
        pdf.setDrawColor(...border);
        pdf.roundedRect(margin, brandY, contentWidth, brandH, 3, 3, 'FD');

        // Brand logo from provided URL
        if (logoDataUrl) {
          try {
            const imageType = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            // Square logo placement (no stretching)
            pdf.addImage(logoDataUrl, imageType, margin + 4.5, brandY + 2, 13.5, 13.5, undefined, 'FAST');
          } catch {
            // If format detection fails, keep text fallback below.
          }
        }

        if (!logoDataUrl) {
          pdf.setTextColor(...dark);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text('ER', margin + 11.2, brandY + 10.8, { align: 'center' });
        }

        pdf.setTextColor(...dark);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11.5);
        pdf.text('ExamRoom', margin + 21, brandY + 8.2);
        pdf.setTextColor(...muted);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.2);
        pdf.text('Official Submission Report', margin + 21, brandY + 13.3);

        pdf.setFillColor(...dark);
        pdf.roundedRect(margin, coverY, contentWidth, 54, 4, 4, 'F');

        // Cover text
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(19);
        pdf.text('Submission Results', margin + 8, coverY + 15);

        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(submission.exam_title || 'Exam Submission Report', margin + 8, coverY + 23);

        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26);
        pdf.text(`${totalScore}`, pageWidth - margin - 8, coverY + 18, { align: 'right' });

        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('TOTAL BAND', pageWidth - margin - 8, coverY + 25, { align: 'right' });

        pdf.setDrawColor(55, 65, 81);
        pdf.line(margin + 8, coverY + 35, pageWidth - margin - 8, coverY + 35);

        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('STUDENT', margin + 8, coverY + 43);
        pdf.text('DATE', pageWidth - margin - 8, coverY + 43, { align: 'right' });

        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(submission.user_name || 'Unknown Student', margin + 8, coverY + 49);
        pdf.text(completedDate, pageWidth - margin - 8, coverY + 49, { align: 'right' });
      };

      const drawSummaryCards = () => {
        const y = margin + 86;
        const gap = 4;
        const cardW = (contentWidth - gap * 3) / 4;
        const listeningStats = getModuleStats('listening');
        const readingStats = getModuleStats('reading');
        const listeningBand = getModuleBandScore('listening');
        const readingBand = getModuleBandScore('reading');
        const writingBand = getModuleBandScore('writing');
        const speakingBand = getModuleBandScore('speaking');

        const bandCards = [
          { title: 'Listening Band', value: listeningBand },
          { title: 'Reading Band', value: readingBand },
          { title: 'Writing Band', value: writingBand },
          { title: 'Speaking Band', value: speakingBand },
        ];

        bandCards.forEach((c, i) => {
          const x = margin + (cardW + gap) * i;
          pdf.setFillColor(...panel);
          pdf.setDrawColor(...border);
          pdf.roundedRect(x, y, cardW, 24, 3, 3, 'FD');
          pdf.setTextColor(...muted);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.2);
          pdf.text(String(c.title).toUpperCase(), x + 5, y + 7.5);
          pdf.setTextColor(...dark);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(13.5);
          const cardValue = c.value != null && Number.isFinite(c.value) ? c.value.toFixed(1) : '-';
          pdf.text(cardValue, x + 5, y + 17.2);

        });

        const countY = y + 28;
        const cards = [
          {
            title: 'Listening',
            value: `${listeningStats.correct}/${listeningStats.total}`,
            sub: 'correct answers',
            accent: dark,
            bg: panel,
          },
          {
            title: 'Reading',
            value: `${readingStats.correct}/${readingStats.total}`,
            sub: 'correct answers',
            accent: dark,
            bg: panel,
          },
          {
            title: 'Total Correct',
            value: `${submission.total_correct || 0}/${submission.total_questions || 0}`,
            sub: 'all modules',
            accent: dark,
            bg: panel,
          },
          {
            title: 'Status',
            value: String(submission.status || 'Submitted'),
            sub: 'submission state',
            accent: green,
            bg: [220, 252, 231],
          },
        ];

        cards.forEach((c, i) => {
          const x = margin + (cardW + gap) * i;
          pdf.setFillColor(...c.bg);
          pdf.setDrawColor(...border);
          pdf.roundedRect(x, countY, cardW, 29, 3, 3, 'FD');
          pdf.setTextColor(...muted);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text(String(c.title).toUpperCase(), x + 5, countY + 8);
          pdf.setTextColor(...c.accent);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.text(String(c.value), x + 5, countY + 18);
          pdf.setTextColor(...muted);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.text(String(c.sub), x + 5, countY + 25);
        });
      };

      const addPageHeader = (title, subtitle) => {
        pdf.addPage();
        pdf.setFillColor(...dark);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(title, margin, 13);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(subtitle, margin, 21);
        return 40;
      };

      const fmtAnswer = (ans, qType) => {
        if (ans === null || ans === undefined || ans === '') return 'Skipped';
        if (typeof ans === 'object') return Array.isArray(ans) ? ans.join(', ') : JSON.stringify(ans);
        const str = String(ans);
        if (qType === 'multiple_choice_multiple') {
          if (str.includes('/')) {
            return str.split('/').map(s => s.trim()).filter(Boolean).sort().join(', ');
          }
          if (/^[A-Za-z]+$/.test(str) && str.length > 1) {
            return str.toUpperCase().split('').sort().join(', ');
          }
        }
        return str;
      };

      const addModuleBreakdown = (moduleKey, moduleTitle) => {
        const moduleData = submission.answers_by_module?.[moduleKey];
        if (!moduleData) return null;

        const baseAnswers = Array.isArray(moduleData.answers)
          ? moduleData.answers.filter((a) => {
              const qType = String(a?.question_type || '').toLowerCase();
              const sectionTitle = String(a?.section_title || '').toLowerCase();
              return qType !== 'structured_recovered' && !sectionTitle.includes('recovered questions');
            })
          : [];

        const moduleTotal = getModuleTotal(moduleKey, moduleData);
        if (baseAnswers.length === 0 && moduleTotal <= 0) return null;

        const moduleAnswers = [...baseAnswers];
        if (moduleAnswers.length === 0) return null;

        let y = addPageHeader(`${moduleTitle} Module`, `${moduleData.correct || 0} correct / ${moduleData.wrong || 0} wrong`);

        const bySection = {};
        moduleAnswers.forEach((a) => {
          const key = a.section_title || 'Unknown Section';
          if (!bySection[key]) bySection[key] = { order: a.section_order || 0, rows: [] };
          bySection[key].rows.push(a);
        });

        const sections = Object.entries(bySection).sort(([, a], [, b]) => a.order - b.order);

        sections.forEach(([sectionTitle, data]) => {
          if (y > pageHeight - 28) y = addPageHeader(`${moduleTitle} Module`, `${moduleData.correct || 0} correct / ${moduleData.wrong || 0} wrong`);

          pdf.setFillColor(241, 245, 249);
          pdf.setDrawColor(...border);
          pdf.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'FD');
          pdf.setTextColor(30, 64, 175);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text(String(sectionTitle), margin + 4, y + 2.5);
          y += 9;

          // Build template-to-blank-index mapping for this section
          const sortedRows = data.rows.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
          const templateToBlankIndex = new Map(); // Map of questionNumber -> blankIndex
          const templateGroups = new Map(); // Map of template -> array of question numbers
          
          sortedRows.forEach(row => {
          const templateTypes = ['summary_completion', 'sentence_completion', 'table_completion', 'form_completion', 'note_completion', 'diagram_labeling', 'map_labeling'];
            if (templateTypes.includes(row.question_type) && row.question_template) {
              if (!templateGroups.has(row.question_template)) {
                templateGroups.set(row.question_template, []);
              }
              templateGroups.get(row.question_template).push(row.question_number);
            }
          });
          
          // Assign blank indices
          templateGroups.forEach((questionNumbers, template) => {
            questionNumbers.sort((a, b) => a - b);
            questionNumbers.forEach((qNum, idx) => {
              templateToBlankIndex.set(qNum, idx);
            });
          });

          const body = sortedRows
            .map((a) => {
              const studentAns = fmtAnswer(a.user_answer, a.question_type);
              const correctAns = fmtAnswer(a.correct_answer, a.question_type);
              const result = studentAns === 'Skipped'
                ? 'Skipped'
                : (a.is_correct === true ? 'Correct' : (a.is_correct === false ? 'Wrong' : 'Recorded'));
              
              // For template-based questions, extract the sentence containing this specific blank
              const templateTypes = ['summary_completion', 'sentence_completion', 'table_completion', 'form_completion', 'note_completion', 'diagram_labeling', 'map_labeling'];
              const isTemplateType = templateTypes.includes(a.question_type);
              let displayText = '';
              
              if (isTemplateType) {
                // For form_completion, just use the template (don't combine with label)
                if (a.question_type === 'form_completion' && a.question_template) {
                  displayText = String(a.question_template).trim().replace(/\[BLANK\]/g, '___');
                }
                
                // For map_labeling, use question_text directly (the label prompt/location description)
                if (a.question_type === 'map_labeling' && a.question_text) {
                  displayText = String(a.question_text).trim();
                }
                
                // For other template types, extract the sentence containing the blank
                if (!displayText && a.question_template && String(a.question_template).trim()) {
                  // Extract sentence for this specific blank
                  const blankIndex = templateToBlankIndex.get(a.question_number) || 0;
                  displayText = extractSentenceForBlank(a.question_template, blankIndex);
                }
                
                // If extraction failed or template is empty, try question_text
                if (!displayText && a.question_text) {
                  const qText = String(a.question_text).trim();
                  // Only use question_text if it's not generic "Summary blank X" text
                  if (!qText.match(/^(Summary|Sentence|Table|Form|Note|Diagram)\s+(blank|completion)\s+\d+$/i)) {
                    displayText = qText;
                  }
                }
                
                // Last resort: show a message indicating missing template
                if (!displayText) {
                  displayText = `[Question ${a.question_number}: Template text not available]`;
                }
              } else {
                // Non-template question types
                displayText = a.question_text || '';
              }
              
              return [
                String(a.question_number || '-'),
                stripHtmlTags(String(displayText || '')),
                String(studentAns),
                String(correctAns),
                result,
              ];
            });

          autoTable(pdf, {
            startY: y,
            head: [['#', 'Question', 'Student', 'Correct', 'Result']],
            body,
            theme: 'grid',
            margin: { left: margin, right: margin },
            headStyles: {
              fillColor: dark,
              textColor: 255,
              fontSize: 8.5,
              halign: 'left',
            },
            styles: {
              fontSize: 8,
              cellPadding: 2.6,
              lineColor: border,
              lineWidth: 0.1,
              overflow: 'linebreak',
              valign: 'middle',
            },
            bodyStyles: {
              textColor: [31, 41, 55],
            },
            rowPageBreak: 'avoid',
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 82 },
              2: { cellWidth: 30 },
              3: { cellWidth: 30 },
              4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
            },
            didParseCell: (hookData) => {
              if (hookData.section !== 'body' || hookData.column.index !== 4) return;
              const result = String(hookData.cell.raw);
              if (result === 'Correct') hookData.cell.styles.textColor = green;
              else if (result === 'Wrong') hookData.cell.styles.textColor = red;
              else if (result === 'Recorded') hookData.cell.styles.textColor = muted;
              else hookData.cell.styles.textColor = amber;
            },
            didDrawPage: () => {
              pdf.setTextColor(...muted);
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(8);
              pdf.text('ExamRoom Submission Report', margin, pageHeight - 6);
            },
          });

          y = (pdf.lastAutoTable?.finalY || y) + 6;
        });

        return y;
      };

      const addWritingSection = () => {
        const writingResponses = submission.writing_responses || [];
        if (!Array.isArray(writingResponses) || writingResponses.length === 0) return;

        let y = addPageHeader('Writing Module', 'Task responses and scoring criteria');

        writingResponses.forEach((wr, idx) => {
          const finalBand = wr.admin_override_band || wr.final_band || wr.ai_overall_band;
          const scores = [
            ['Task Response', wr.ai_task_response_score],
            ['Coherence', wr.ai_coherence_score],
            ['Lexical', wr.ai_lexical_score],
            ['Grammar', wr.ai_grammar_score],
            ['Overall', wr.ai_overall_band],
          ];

          if (y > pageHeight - 70) y = addPageHeader('Writing Module', 'Task responses and scoring criteria');

          pdf.setFillColor(241, 245, 249);
          pdf.setDrawColor(...border);
          pdf.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'FD');
          pdf.setTextColor(30, 64, 175);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text(`Task ${wr.task_number}: ${wr.section_title || `Writing Task ${wr.task_number}`}`, margin + 4, y + 2.5);
          y += 10;

          autoTable(pdf, {
            startY: y,
            head: [['Criterion', 'Score']],
            body: scores.map(([label, value]) => [label, value != null ? Number(value).toFixed(1) : 'N/A']),
            theme: 'grid',
            margin: { left: margin, right: margin + 70 },
            headStyles: { fillColor: dark, textColor: 255, fontSize: 8.5 },
            styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: border, lineWidth: 0.1 },
            columnStyles: {
              0: { cellWidth: 44 },
              1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            },
          });

          const scoreTableY = (pdf.lastAutoTable?.finalY || y) + 3;

          const essay = String(wr.response_text || '').trim() || 'No response submitted';
          const words = wr.word_count || (essay ? essay.split(/\s+/).filter(Boolean).length : 0);
          const bandText = finalBand != null ? `Band ${typeof finalBand === 'number' ? finalBand.toFixed(1) : finalBand}` : 'Band N/A';

          autoTable(pdf, {
            startY: scoreTableY,
            head: [[`Student Response (${words} words, ${bandText})`]],
            body: [[essay]],
            theme: 'grid',
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8.5 },
            styles: { fontSize: 8, cellPadding: 2.8, lineColor: border, lineWidth: 0.1, overflow: 'linebreak' },
            rowPageBreak: 'avoid',
          });

          y = (pdf.lastAutoTable?.finalY || scoreTableY) + 8;
        });
      };

      drawCover();
      drawSummaryCards();
      addModuleBreakdown('listening', 'Listening');
      addModuleBreakdown('reading', 'Reading');
      addWritingSection();

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        pdf.setPage(i);
        pdf.setTextColor(...muted);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
      }

      return { pdf, filename };
    } catch (err) {
      console.error('PDF generation failed:', err);
      throw err;
    }
  };

  const handleDownloadPdf = async () => {
    if (!submission || downloadingPdf) return;
    setDownloadingPdf(true);

    try {
      const { pdf, filename } = await buildSubmissionPdf();
      pdf.save(filename);
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'PDF Download Failed',
        message: `Unable to generate PDF: ${err.message}`
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getBandColor = (band) => {
    if (!Number.isFinite(Number(band))) return "text-gray-600 bg-gray-100 border-gray-200";
    const n = parseFloat(band);
    if (n >= 7) return "text-green-600 bg-green-50 border-green-200";
    if (n >= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleGradeWritingTask = async (writingResponse) => {
    const taskKey = String(writingResponse.task_number);
    setGradingTasks((current) => ({ ...current, [taskKey]: true }));

    try {
      await apiGradeWritingWithAI(token, {
        submissionId: id,
        sectionId: writingResponse.section_id,
        taskNumber: writingResponse.task_number,
        responseText: writingResponse.response_text,
      });

      await fetchSubmissionDetails();
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'AI Grading Complete',
        message: `Writing Task ${writingResponse.task_number} was graded successfully.`
      });
    } catch (err) {
      console.error('AI grading failed:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'AI Grading Failed',
        message: err.message || 'Unable to grade this writing task with AI.'
      });
    } finally {
      setGradingTasks((current) => ({ ...current, [taskKey]: false }));
    }
  };

  const handleSaveSpeakingScore = async () => {
    if (!speakingScore || isNaN(parseFloat(speakingScore))) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Invalid Score',
        message: 'Please enter a valid speaking band score (0-9).'
      });
      return;
    }

    const score = parseFloat(speakingScore);
    if (score < 0 || score > 9) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Invalid Score',
        message: 'Speaking band score must be between 0 and 9.'
      });
      return;
    }

    setSavingSpeaking(true);
    try {
      const response = await fetch(`${API_URL}/monitoring/submissions/${id}/speaking-score`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ speaking_band_score: score })
      });

      if (!response.ok) {
        throw new Error('Failed to save speaking score');
      }

      await fetchSubmissionDetails();
      setEditingSpeaking(false);
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Speaking Score Saved',
        message: 'The speaking band score has been updated successfully.'
      });
    } catch (err) {
      console.error('Failed to save speaking score:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Unable to save speaking score.'
      });
    } finally {
      setSavingSpeaking(false);
    }
  };

  const handleSaveWritingScore = async () => {
    if (!writingScore || isNaN(parseFloat(writingScore))) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Invalid Score',
        message: 'Please enter a valid writing band score (0-9).'
      });
      return;
    }

    const score = parseFloat(writingScore);
    if (score < 0 || score > 9) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Invalid Score',
        message: 'Writing band score must be between 0 and 9.'
      });
      return;
    }

    setSavingWriting(true);
    try {
      const response = await fetch(`${API_URL}/monitoring/submissions/${id}/writing-score`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ writing_band_score: score })
      });

      if (!response.ok) {
        throw new Error('Failed to save writing score');
      }

      await fetchSubmissionDetails();
      setEditingWriting(false);
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Writing Score Saved',
        message: 'The writing band score has been updated successfully.'
      });
    } catch (err) {
      console.error('Failed to save writing score:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Unable to save writing score.'
      });
    } finally {
      setSavingWriting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load submission details: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Submissions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Submission Details</h1>
          <p className="text-gray-600 mt-1">Detailed view of exam submission</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleEmailPdf}
            disabled={emailingPdf || !submission?.user_email}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
            title={!submission?.user_email ? 'Student email not available' : 'Send PDF to student\'s email'}
          >
            {emailingPdf ? (
              <><Loader2 size={16} className="animate-spin" /><span>Sending...</span></>
            ) : (
              <><Mail size={16} /><span>Email PDF</span></>
            )}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
          >
            {downloadingPdf ? (
              <><Loader2 size={16} className="animate-spin" /><span>Generating PDF...</span></>
            ) : (
              <><Download size={16} /><span>Download PDF</span></>
            )}
          </button>
        </div>
      </div>

      <div id="submission-pdf-root" ref={pageRef} className="space-y-6">

      {/* Student Info Card */}
      <div className="bg-white rounded-xl border shadow-sm p-6 pdf-keep-together">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{submission.user_name || 'Unknown Student'}</h2>
              <p className="text-gray-600">{submission.user_email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="font-semibold text-gray-900">{formatDate(submission.submitted_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Exam</p>
            <p className="font-semibold text-gray-900">{submission.exam_title || 'Unknown Exam'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Time Spent</p>
            <p className="font-semibold text-gray-900">
              {submission.time_spent ? formatDuration(submission.time_spent) : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {submission.status || 'Submitted'}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-xl border shadow-sm p-6 pdf-keep-together">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Overall Score</h3>
        <div className="flex items-center justify-center">
          <div className={`text-center px-8 py-6 rounded-xl border-2 ${getBandColor(isWritingChecked ? submission.band_score : null)}`}>
            <p className="text-sm font-semibold uppercase mb-2">Band Score</p>
            <p className="text-6xl font-bold">{(submission.band_score != null && isWritingChecked) ? parseFloat(submission.band_score).toFixed(1) : '-'}</p>
            {!isWritingChecked && (
              <p className="text-xs mt-2 text-gray-500">Pending writing review</p>
            )}
            <p className="text-sm mt-2">
              {submission.total_correct || 0} / {submission.total_questions || 0} correct
            </p>
          </div>
        </div>
      </div>

      {/* Module-Wise Scores */}
      {(submission.scores_by_module || submission.answers_by_module) && (
        <div className="bg-white rounded-xl border shadow-sm p-6 pdf-keep-together">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Module-Wise Band Scores</h3>
          <div className="grid grid-cols-4 gap-4">
            {['listening', 'reading', 'writing', 'speaking'].map(module => {
              const score = getModuleBandScore(module);
              const moduleAnswers = submission.answers_by_module?.[module];
              const correct = moduleAnswers?.correct || 0;
              const total = getModuleTotal(module, moduleAnswers);
              
              // Special UI for speaking module
              if (module === 'speaking') {
                return (
                  <div key={module} className={`rounded-xl border-2 p-6 text-center ${getBandColor(score)}`}>
                    <p className="text-sm font-semibold uppercase tracking-wide mb-2">Speaking</p>
                    {editingSpeaking ? (
                      <div className="flex flex-col items-center space-y-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9"
                          value={speakingScore}
                          onChange={(e) => setSpeakingScore(e.target.value)}
                          className="w-24 text-center text-3xl font-bold border-2 rounded-lg px-2 py-1"
                          placeholder="0.0"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveSpeakingScore}
                            disabled={savingSpeaking}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs font-medium"
                          >
                            {savingSpeaking ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingSpeaking(false);
                              setSpeakingScore(submission.speaking_band_score ? String(submission.speaking_band_score) : '');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-5xl font-bold">{score != null ? score.toFixed(1) : '-'}</p>
                        <button
                          onClick={() => {
                            setEditingSpeaking(true);
                            setSpeakingScore(score ? String(score) : '');
                          }}
                          className="mt-2 flex items-center justify-center space-x-1 mx-auto px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium pdf-hide"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <p className="text-xs mt-1 text-gray-500">Manual entry</p>
                      </>
                    )}
                  </div>
                );
              }
              
              // Special UI for writing module
              if (module === 'writing') {
                return (
                  <div key={module} className={`rounded-xl border-2 p-6 text-center ${getBandColor(score)}`}>
                    <p className="text-sm font-semibold uppercase tracking-wide mb-2">Writing</p>
                    {editingWriting ? (
                      <div className="flex flex-col items-center space-y-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9"
                          value={writingScore}
                          onChange={(e) => setWritingScore(e.target.value)}
                          className="w-24 text-center text-3xl font-bold border-2 rounded-lg px-2 py-1"
                          placeholder="0.0"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveWritingScore}
                            disabled={savingWriting}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs font-medium"
                          >
                            {savingWriting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingWriting(false);
                              setWritingScore(submission.writing_band_score ? String(submission.writing_band_score) : '');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-5xl font-bold">{score != null ? score.toFixed(1) : '-'}</p>
                        <button
                          onClick={() => {
                            setEditingWriting(true);
                            setWritingScore(score ? String(score) : '');
                          }}
                          className="mt-2 flex items-center justify-center space-x-1 mx-auto px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium pdf-hide"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <p className="text-xs mt-1 text-gray-500">{submission.writing_band_score ? 'Manual override' : 'AI/task average'}</p>
                      </>
                    )}
                  </div>
                );
              }
              
              return (
                <div key={module} className={`rounded-xl border-2 p-6 text-center ${getBandColor(score)}`}>
                  <p className="text-sm font-semibold uppercase tracking-wide mb-2">{module}</p>
                  <p className="text-5xl font-bold">{score != null ? score.toFixed(1) : '-'}</p>
                  <p className="text-sm mt-2">
                    {correct} / {total} correct
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Writing Assessment Summary — teacher overview shown on the PDF cover page */}
      {(submission.writing_responses || []).some(wr => wr.ai_overall_band != null) && (
        <div className="bg-white rounded-xl border shadow-sm p-6 pdf-keep-together">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <PenTool size={20} />
            <span>Writing Assessment Summary</span>
          </h3>
          {(submission.writing_responses || []).filter(wr => wr.ai_overall_band != null).map(wr => {
            const fb = (() => {
              if (!wr.ai_feedback) return null;
              try { return typeof wr.ai_feedback === 'string' ? JSON.parse(wr.ai_feedback) : wr.ai_feedback; } catch { return null; }
            })();
            const multiTask = (submission.writing_responses || []).filter(w => w.ai_overall_band != null).length > 1;
            return (
              <div key={wr.id} className="mb-5 last:mb-0">
                {multiTask && (
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Task {wr.task_number}: {wr.section_title || `Writing Task ${wr.task_number}`}
                  </p>
                )}
                <div className="grid grid-cols-5 gap-3 mb-3">
                  {[
                    { label: 'Task Response', score: wr.ai_task_response_score },
                    { label: 'Coherence',     score: wr.ai_coherence_score },
                    { label: 'Lexical',       score: wr.ai_lexical_score },
                    { label: 'Grammar',       score: wr.ai_grammar_score },
                    { label: 'Overall',       score: wr.ai_overall_band },
                  ].map(({ label, score }) => (
                    <div key={label} className={`rounded-lg p-3 text-center border ${getBandColor(score)}`}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-xl font-bold">{score != null ? parseFloat(score).toFixed(1) : '-'}</p>
                    </div>
                  ))}
                </div>
                {fb?.feedback && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Overall Feedback</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{fb.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Answers by Module */}
      {submission.answers_by_module && (
        <div className="space-y-6">
          {['listening', 'reading'].map(module => {
            const moduleData = submission.answers_by_module[module];
            if (!moduleData || moduleData.answers.length === 0) return null;

            const mergedAnswers = (moduleData.answers || []).filter((ans) => {
              const qType = String(ans?.question_type || '').toLowerCase();
              const sectionTitle = String(ans?.section_title || '').toLowerCase();
              return qType !== 'structured_recovered' && !sectionTitle.includes('recovered questions');
            });

            // Deduplicate answers - keep only the first occurrence of each question_number within a section
            const seenKeys = new Set();
            const uniqueAnswers = [];
            for (const ans of mergedAnswers) {
              const key = `${ans.section_id || ans.section_order}_${ans.question_number}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueAnswers.push(ans);
              }
            }

            // Group answers by section
            const answersBySection = {};
            uniqueAnswers.forEach(ans => {
              const sectionKey = ans.section_title || 'Unknown Section';
              if (!answersBySection[sectionKey]) {
                answersBySection[sectionKey] = { order: ans.section_order, answers: [] };
              }
              answersBySection[sectionKey].answers.push(ans);
            });

            // Sort sections by order
            const sortedSections = Object.entries(answersBySection)
              .sort(([, a], [, b]) => a.order - b.order);

            return (
              <div key={module} className="bg-white rounded-xl border shadow-sm" data-pdf-page-break="true">
                <div className="bg-gray-50 px-6 py-4 border-b pdf-keep-together">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 capitalize flex items-center space-x-2">
                      <FileText size={24} />
                      <span>{module} Module</span>
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="pdf-status-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '102px' }}>
                        <CheckCircle size={16} className="text-green-600" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.2 }}>{moduleData.correct} Correct</span>
                      </div>
                      <div className="pdf-status-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 10px', background: '#fee2e2', color: '#991b1b', borderRadius: '9999px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '102px' }}>
                        <XCircle size={16} className="text-red-600" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.2 }}>{moduleData.wrong} Wrong</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {sortedSections.map(([sectionTitle, sectionData], sIdx) => {
                  // Build template-to-blank-index mapping for this section
                  const sortedAnswers = [...sectionData.answers].sort((a, b) => a.question_number - b.question_number);
                  const templateToBlankIndex = new Map(); // Map of questionNumber -> blankIndex
                  const templateGroups = new Map(); // Map of template -> array of question numbers
                  
                  const templateTypes = ['summary_completion', 'sentence_completion', 'table_completion', 'form_completion', 'note_completion', 'diagram_labeling'];
                  
                  sortedAnswers.forEach(ans => {
                    if (templateTypes.includes(ans.question_type) && ans.question_template) {
                      if (!templateGroups.has(ans.question_template)) {
                        templateGroups.set(ans.question_template, []);
                      }
                      templateGroups.get(ans.question_template).push(ans.question_number);
                    }
                  });
                  
                  // Assign blank indices
                  templateGroups.forEach((questionNumbers, template) => {
                    questionNumbers.sort((a, b) => a - b);
                    questionNumbers.forEach((qNum, idx) => {
                      templateToBlankIndex.set(qNum, idx);
                    });
                  });
                  
                  return (
                  <div key={sIdx} data-pdf-part-break={sIdx > 0 ? 'true' : undefined}>
                    <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
                      <span className="text-sm font-semibold text-blue-800">
                        Part {sIdx + 1}: {sectionTitle}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {sectionData.answers
                        .sort((a, b) => a.question_number - b.question_number)
                        .map((ans, idx) => {
                          const formatAnswer = (val) => {
                            if (val === null || val === undefined || val === '') return null;
                            if (typeof val === 'object') {
                              return Array.isArray(val) ? val.join(', ') : JSON.stringify(val);
                            }
                            let str = String(val);
                            // Normalize multi-choice: "CAEF" → "A, C, E, F" and "A/C/D" → "A, C, D"
                            if (ans.question_type === 'multiple_choice_multiple') {
                              let letters;
                              if (str.includes('/')) {
                                letters = str.split('/').map(s => s.trim()).filter(Boolean);
                              } else if (/^[A-Za-z]+$/.test(str) && str.length > 1) {
                                letters = str.toUpperCase().split('');
                              }
                              if (letters) return letters.sort().join(', ');
                            }
                            return str;
                          };
                          
                          const userAnswer = formatAnswer(ans.user_answer);
                          const correctAnswer = formatAnswer(ans.correct_answer);
                          
                          return (
                            <div 
                              key={idx}
                              className={`px-4 py-3 pdf-keep-together pdf-answer-row ${
                                !userAnswer ? 'bg-gray-50' : ans.is_correct ? 'bg-green-50/40' : 'bg-red-50/40'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Question Number */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  !userAnswer ? 'bg-gray-300 text-white' : ans.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                  {ans.question_number}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1" style={{minWidth: 0, maxWidth: '100%'}}>
                                  {/* Question Text */}
                                  {(() => {
                                    // For template-based questions, extract the sentence containing this specific blank
                                    const templateTypes = ['summary_completion', 'sentence_completion', 'table_completion', 'form_completion', 'note_completion', 'diagram_labeling'];
                                    const isTemplateType = templateTypes.includes(ans.question_type);
                                    
                                    let displayText = '';
                                    if (isTemplateType) {
                                      // For form_completion, just use the template (don't combine with label)
                                      // The template should already contain the full question text
                                      if (ans.question_type === 'form_completion' && ans.question_template) {
                                        displayText = String(ans.question_template).trim().replace(/\[BLANK\]/g, '___');
                                      }
                                      
                                      // For other template types, extract the sentence containing the blank
                                      if (!displayText && ans.question_template && String(ans.question_template).trim()) {
                                        // Extract sentence for this specific blank
                                        const blankIndex = templateToBlankIndex.get(ans.question_number) || 0;
                                        displayText = extractSentenceForBlank(ans.question_template, blankIndex);
                                      }
                                      
                                      // If extraction failed or template is empty, try question_text
                                      if (!displayText && ans.question_text) {
                                        const qText = String(ans.question_text).trim();
                                        // Only use question_text if it's not generic "Summary blank X" text
                                        if (!qText.match(/^(Summary|Sentence|Table|Form|Note|Diagram)\s+(blank|completion)\s+\d+$/i)) {
                                          displayText = qText;
                                        }
                                      }
                                      
                                      // Last resort: show a message indicating missing template
                                      if (!displayText) {
                                        displayText = `[Question ${ans.question_number}: Template text not available]`;
                                      }
                                    } else {
                                      // Non-template question types
                                      displayText = ans.question_text || '';
                                    }
                                    
                                    if (displayText) {
                                      return (
                                        <p className="text-sm text-gray-700 mb-2" style={{wordBreak: 'break-word'}}>
                                          {stripHtmlTags(displayText)}
                                        </p>
                                      );
                                    }
                                    return null;
                                  })()}
                                  
                                  {/* Answers - vertical layout for PDF */}
                                  <div className="text-xs space-y-1">
                                    <div style={{wordBreak: 'break-word'}}>
                                      <span className="text-gray-500">Student: </span>
                                      {userAnswer ? (
                                        <span className={`font-semibold ${
                                          ans.is_correct ? 'text-green-700' : 'text-red-700'
                                        }`}>{userAnswer}</span>
                                      ) : (
                                        <span className="text-gray-400 italic">Skipped</span>
                                      )}
                                    </div>
                                    <div style={{wordBreak: 'break-word'}}>
                                      <span className="text-gray-500">Correct: </span>
                                      <span className="font-semibold text-green-700">{correctAnswer || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Status Badge */}
                                <div style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'flex-end',minWidth:'96px'}}>
                                  {!userAnswer ? (
                                    <span className="pdf-status-badge" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'3px',padding:'2px 8px',background:'#e5e7eb',color:'#4b5563',borderRadius:'9999px',fontSize:'11px',fontWeight:600,whiteSpace:'nowrap',minWidth:'82px'}}>
                                      Skipped
                                    </span>
                                  ) : ans.is_correct ? (
                                    <span className="pdf-status-badge" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'3px',padding:'2px 8px',background:'#bbf7d0',color:'#166534',borderRadius:'9999px',fontSize:'11px',fontWeight:600,whiteSpace:'nowrap',minWidth:'82px'}}>
                                      <CheckCircle size={12} style={{display:'inline-block',verticalAlign:'middle',flexShrink:0}} />
                                      Correct
                                    </span>
                                  ) : (
                                    <span className="pdf-status-badge" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'3px',padding:'2px 8px',background:'#fecaca',color:'#991b1b',borderRadius:'9999px',fontSize:'11px',fontWeight:600,whiteSpace:'nowrap',minWidth:'82px'}}>
                                      <XCircle size={12} style={{display:'inline-block',verticalAlign:'middle',flexShrink:0}} />
                                      Wrong
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Writing Module Section */}
      {(() => {
        const writingResponses = submission.writing_responses || [];
        if (writingResponses.length === 0) return null;

        return (
          <div className="bg-white rounded-xl border shadow-sm" data-pdf-page-break="true">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <PenTool size={24} />
                <span>Writing Module</span>
              </h3>
            </div>

            {writingResponses.map((wr, idx) => {
              const essayText = wr.response_text || '';
              const wordCount = wr.word_count || (essayText.trim() ? essayText.trim().split(/\s+/).length : 0);
              const isAiGrading = Boolean(gradingTasks[String(wr.task_number)]);
              const aiFeedback = (() => {
                if (!wr.ai_feedback) return null;
                try { return typeof wr.ai_feedback === 'string' ? JSON.parse(wr.ai_feedback) : wr.ai_feedback; }
                catch { return null; }
              })();
              const finalBand = wr.admin_override_band || wr.final_band || wr.ai_overall_band;

              return (
                <div key={wr.id} className="border-b last:border-b-0">
                  <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-blue-800">
                      Task {wr.task_number}: {wr.section_title || `Writing Task ${wr.task_number}`}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500 whitespace-nowrap">{wordCount} words</span>
                      {finalBand != null && (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${
                          finalBand >= 7 ? 'bg-green-100 text-green-700' :
                          finalBand >= 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Band {typeof finalBand === 'number' ? finalBand.toFixed(1) : finalBand}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Student Essay */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Student's Response</h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border pdf-expand">
                        {essayText || <span className="text-gray-400 italic">No response submitted</span>}
                      </div>
                    </div>

                    {essayText && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleGradeWritingTask(wr)}
                          disabled={isAiGrading}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isAiGrading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          <span>{wr.ai_overall_band != null ? 'Re-grade with AI' : 'Grade with AI'}</span>
                        </button>
                      </div>
                    )}

                    {/* AI Grading */}
                    {wr.ai_overall_band != null ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                          <Star size={16} className="text-amber-500" />
                          <span className="pdf-ai-label">AI Grading</span>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4 pdf-keep-together">
                          {[
                            { label: 'Task Response', score: wr.ai_task_response_score },
                            { label: 'Coherence', score: wr.ai_coherence_score },
                            { label: 'Lexical', score: wr.ai_lexical_score },
                            { label: 'Grammar', score: wr.ai_grammar_score },
                            { label: 'Overall', score: wr.ai_overall_band },
                          ].map(({ label, score }) => (
                            <div key={label} className={`rounded-lg p-3 text-center border ${
                              score >= 7 ? 'bg-green-50 border-green-200' :
                              score >= 5 ? 'bg-yellow-50 border-yellow-200' :
                              'bg-red-50 border-red-200'
                            }`}>
                              <p className="text-xs text-gray-500 mb-1">{label}</p>
                              <p className="text-xl font-bold">{score != null ? parseFloat(score).toFixed(1) : 'N/A'}</p>
                            </div>
                          ))}
                        </div>

                        {/* Per-criteria feedback — hidden in PDF via pdf-hide */}
                        {(() => {
                          const criteriaFeedback = [
                            { label: 'Task Response', text: aiFeedback?.task_response_feedback, score: wr.ai_task_response_score },
                            { label: 'Coherence & Cohesion', text: aiFeedback?.coherence_feedback, score: wr.ai_coherence_score },
                            { label: 'Lexical Resource', text: aiFeedback?.lexical_feedback, score: wr.ai_lexical_score },
                            { label: 'Grammatical Range & Accuracy', text: aiFeedback?.grammar_feedback, score: wr.ai_grammar_score },
                          ].filter(c => c.text);
                          if (criteriaFeedback.length === 0) return null;
                          return (
                            <div className="space-y-3 mb-4 pdf-hide">
                              {criteriaFeedback.map(({ label, text, score }) => (
                                <div key={label} className="bg-gray-50 border rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                                      score >= 7 ? 'bg-green-100 text-green-700' :
                                      score >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>{score != null ? parseFloat(score).toFixed(1) : 'N/A'}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{text}</p>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {aiFeedback?.feedback && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 pdf-hide">
                            <p className="text-sm font-semibold text-blue-800 mb-2">Overall Feedback</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiFeedback.feedback}</p>
                          </div>
                        )}

                        {aiFeedback?.key_improvements?.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3 pdf-hide">
                            <p className="text-sm font-semibold text-amber-800 mb-2">Key Improvements</p>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {aiFeedback.key_improvements.map((imp, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-amber-600 mr-2">•</span>
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      </div>{/* end pageRef */}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
