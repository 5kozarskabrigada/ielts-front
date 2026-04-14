import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { ArrowLeft, User, CheckCircle, XCircle, FileText, PenTool, Star, Loader2, Download, Sparkles, RefreshCw } from "lucide-react";
import NotificationModal from "../../components/NotificationModal/NotificationModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL, apiGradeWritingWithAI } from "../../api";

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [gradingTasks, setGradingTasks] = useState({});
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
    } catch (err) {
      console.error("Failed to fetch submission details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const EXAMROOM_LOGO_URL = 'https://www.image2url.com/r2/default/images/1776187544241-f8e0bf3d-2418-475d-ad65-2a9b6939d231.png';

  const ACADEMIC_READING_SCORE_TABLE = [
    { range: '39 - 40', band: 9.0 },
    { range: '37 - 38', band: 8.5 },
    { range: '35 - 36', band: 8.0 },
    { range: '33 - 34', band: 7.5 },
    { range: '30 - 32', band: 7.0 },
    { range: '27 - 29', band: 6.5 },
    { range: '23 - 26', band: 6.0 },
    { range: '19 - 22', band: 5.5 },
    { range: '15 - 18', band: 5.0 },
    { range: '13 - 14', band: 4.5 },
    { range: '10 - 12', band: 4.0 },
    { range: '8 - 9', band: 3.5 },
    { range: '6 - 7', band: 3.0 },
    { range: '4 - 5', band: 2.5 },
    { range: '3', band: 2.0 },
    { range: '2', band: 1.5 },
    { range: '1', band: 1.0 },
    { range: '0', band: 0.0 },
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

  const getModuleBandScore = (moduleKey) => {
    const raw = submission?.scores_by_module?.[moduleKey];
    const parsed = raw != null && raw !== '' ? parseFloat(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;

    // Writing fallback from AI/admin-scored tasks.
    if (moduleKey === 'writing') {
      const writingResponses = Array.isArray(submission?.writing_responses) ? submission.writing_responses : [];
      const taskBands = writingResponses
        .map((wr) => wr.admin_override_band ?? wr.final_band ?? wr.ai_overall_band)
        .map((v) => parseFloat(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (taskBands.length > 0) {
        return taskBands.reduce((a, b) => a + b, 0) / taskBands.length;
      }
    }

    return null;
  };

  const handleDownloadPdf = async () => {
    if (!submission || downloadingPdf) return;
    setDownloadingPdf(true);

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

      const totalScore = submission.band_score != null ? parseFloat(submission.band_score).toFixed(1) : 'N/A';
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
        const overallBand = submission.band_score != null ? parseFloat(submission.band_score) : null;

        const bandCards = [
          { title: 'Listening Band', value: listeningBand },
          { title: 'Reading Band', value: readingBand },
          { title: 'Writing Band', value: writingBand },
          { title: 'Overall Band', value: overallBand },
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
          pdf.text(c.value != null && Number.isFinite(c.value) ? c.value.toFixed(1) : 'N/A', x + 5, y + 17.2);
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
        if (!moduleData || !Array.isArray(moduleData.answers) || moduleData.answers.length === 0) return;

        const moduleTotal = getModuleTotal(moduleKey, moduleData);
        const existingNumbers = new Set(
          moduleData.answers
            .map((a) => Number(a.question_number || 0))
            .filter((n) => Number.isFinite(n) && n > 0)
        );

        const recoveredRows = [];
        for (let q = 1; q <= moduleTotal; q += 1) {
          if (!existingNumbers.has(q)) {
            recoveredRows.push({
              question_number: q,
              question_type: 'structured_recovered',
              question_text: 'Structured question record recovered for reporting (original DB row missing).',
              user_answer: null,
              correct_answer: null,
              is_correct: null,
              module_type: moduleKey,
              section_title: 'Recovered Questions',
              section_order: 999,
            });
          }
        }

        const moduleAnswers = [...moduleData.answers, ...recoveredRows];

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

          const body = data.rows
            .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
            .map((a) => {
              const studentAns = fmtAnswer(a.user_answer, a.question_type);
              const correctAns = fmtAnswer(a.correct_answer, a.question_type);
              const result = studentAns === 'Skipped'
                ? 'Skipped'
                : (a.is_correct === true ? 'Correct' : (a.is_correct === false ? 'Wrong' : 'Recorded'));
              return [
                String(a.question_number || '-'),
                String(a.question_text || '').replace(/\s+/g, ' ').trim(),
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

      const addAcademicReadingScoringSection = () => {
        const readingData = submission.answers_by_module?.reading || {};
        const readingCorrect = Number(readingData.correct || 0);
        const readingBand = getModuleBandScore('reading');

        let y = addPageHeader('Academic Reading Scoring', 'Academic Reading conversion guide only');

        pdf.setFillColor(241, 245, 249);
        pdf.setDrawColor(...border);
        pdf.roundedRect(margin, y - 4, contentWidth, 14, 2, 2, 'FD');
        pdf.setTextColor(...dark);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(`Student Reading: ${readingCorrect}/40`, margin + 4, y + 1.8);
        pdf.text(`Band: ${readingBand != null ? readingBand.toFixed(1) : 'N/A'}`, pageWidth - margin - 4, y + 1.8, { align: 'right' });

        autoTable(pdf, {
          startY: y + 14,
          head: [['Correct Answers (40)', 'Band Score']],
          body: ACADEMIC_READING_SCORE_TABLE.map((row) => [row.range, row.band.toFixed(1)]),
          theme: 'grid',
          margin: { left: margin, right: margin },
          headStyles: {
            fillColor: dark,
            textColor: 255,
            fontSize: 9,
            halign: 'left',
          },
          styles: {
            fontSize: 8.5,
            cellPadding: 2.8,
            lineColor: border,
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          },
        });
      };

      drawCover();
      drawSummaryCards();
      addModuleBreakdown('listening', 'Listening');
      addModuleBreakdown('reading', 'Reading');
      addAcademicReadingScoringSection();
      addWritingSection();

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        pdf.setPage(i);
        pdf.setTextColor(...muted);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
      }

      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
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
          <div className={`text-center px-8 py-6 rounded-xl border-2 ${getBandColor(submission.band_score)}`}>
            <p className="text-sm font-semibold uppercase mb-2">Band Score</p>
            <p className="text-6xl font-bold">{submission.band_score != null ? parseFloat(submission.band_score).toFixed(1) : 'N/A'}</p>
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
          <div className="grid grid-cols-3 gap-4">
            {['listening', 'reading', 'writing'].map(module => {
              const score = getModuleBandScore(module);
              const moduleAnswers = submission.answers_by_module?.[module];
              const correct = moduleAnswers?.correct || 0;
              const total = getModuleTotal(module, moduleAnswers);
              return (
                <div key={module} className={`rounded-xl border-2 p-6 text-center ${getBandColor(score ?? 0)}`}>
                  <p className="text-sm font-semibold uppercase tracking-wide mb-2">{module}</p>
                  <p className="text-5xl font-bold">{score != null ? score.toFixed(1) : 'N/A'}</p>
                  <p className="text-sm mt-2">
                    {correct} / {total} correct
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6 pdf-keep-together">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Academic Reading Scoring</h3>
        <p className="text-sm text-gray-600 mb-4">Academic Reading conversion table (40 questions).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Student Reading Correct</p>
            <p className="text-2xl font-bold text-gray-900">{submission.answers_by_module?.reading?.correct || 0} / 40</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Reading Band</p>
            <p className="text-2xl font-bold text-gray-900">{(() => {
              const readingBand = getModuleBandScore('reading');
              return readingBand != null ? readingBand.toFixed(1) : 'N/A';
            })()}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Correct Answers (40)</th>
                <th className="px-4 py-2 text-left font-semibold">Band Score</th>
              </tr>
            </thead>
            <tbody>
              {ACADEMIC_READING_SCORE_TABLE.map((row) => (
                <tr key={`${row.range}-${row.band}`} className="border-t border-gray-200">
                  <td className="px-4 py-2 text-gray-800">{row.range}</td>
                  <td className="px-4 py-2 font-semibold text-gray-900">{row.band.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                      <p className="text-xl font-bold">{score != null ? parseFloat(score).toFixed(1) : 'N/A'}</p>
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

            // Group answers by section
            const answersBySection = {};
            moduleData.answers.forEach(ans => {
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
                
                {sortedSections.map(([sectionTitle, sectionData], sIdx) => (
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
                                  {ans.question_text && (
                                    <p className="text-sm text-gray-700 mb-2" style={{wordBreak: 'break-word'}}>{ans.question_text}</p>
                                  )}
                                  
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
                ))}
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
