// Reading Module Renderer - Matches Preview Mode Format
import React, { useState } from "react";

const accentColor = 'rgb(55, 133, 77)'; // Green for reading

// Render HTML safely
const RenderHtml = ({ html }) => {
  return <span dangerouslySetInnerHTML={{ __html: html || '' }} />;
};

// Blank input component for fill-in questions
const BlankInput = ({ questionNumber, value, onChange }) => (
  <span className="inline-flex items-center gap-2 mx-1 my-0.5">
    <span 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        minWidth: '28px',
        minHeight: '28px',
        backgroundColor: accentColor,
        borderRadius: '50%',
        color: 'white',
        fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 600
      }}
    >
      {questionNumber}
    </span>
    <input 
      type="text" 
      value={value || ''}
      onChange={onChange}
      style={{ 
        width: '200px',
        height: '32px',
        padding: '0 20px 0 10px',
        border: '1px solid rgb(189, 197, 207)',
        borderRadius: '100px',
        fontSize: '14px',
        fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
        boxShadow: 'rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset',
        outline: 'none',
        backgroundColor: 'white'
      }}
    />
  </span>
);

// Detect paragraph letters from content
const detectParagraphLetters = (content) => {
  if (!content) return [];
  const textOnly = content.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\r/g, '\n');
  const lines = textOnly.split('\n');
  const letters = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Z])[\.\)]\s+/);
    if (match) {
      letters.push(match[1]);
    }
  }
  
  return [...new Set(letters)].sort();
};

// Render question group based on type
const renderQuestionGroup = (group, groupQuestions, globalOffset, answers, setAnswers, paragraphLetters) => {
  const type = group.question_type;

  // True/False/Not Given
  if (type === 'true_false_not_given' || type === 'yes_no_not_given') {
    const isYesNo = type === 'yes_no_not_given';
    return (
      <div>
        <div style={{ border: '1px solid rgb(221, 221, 221)', borderRadius: '10px', padding: '10px', marginBottom: '20px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', width: '148.5px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>{isYesNo ? 'YES.' : 'TRUE.'}</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if the statement agrees with the information
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>{isYesNo ? 'NO.' : 'FALSE.'}</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if the statement contradicts the information
                </td>
              </tr>
              <tr style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>NOT GIVEN.</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if there is no information on this
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          {groupQuestions.map((q, idx) => {
            const qNum = q.question_number;
            return (
              <div key={q.id} className="flex items-center gap-4 py-1">
                <span className="font-bold text-gray-700" style={{ minWidth: '35px', display: 'inline-block', fontSize: '15px' }}>{qNum}.</span>
                <div className="flex items-center gap-2 flex-1">
                  <select 
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    style={{ 
                      width: '100px', 
                      height: '32px', 
                      padding: '0 20px 0 10px', 
                      border: '1px solid rgb(189, 197, 207)', 
                      borderRadius: '100px', 
                      fontSize: '14px', 
                      fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif'
                    }}
                  >
                    <option value=""></option>
                    <option value="true">{isYesNo ? 'YES' : 'TRUE'}</option>
                    <option value="false">{isYesNo ? 'NO' : 'FALSE'}</option>
                    <option value="not_given">NOT GIVEN</option>
                  </select>
                  <p className="flex-1"><RenderHtml html={q.question_text || ''} /></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Multiple Choice
  if (type === 'multiple_choice_single' || type === 'multiple_choice_multiple') {
    const isMultiple = type === 'multiple_choice_multiple';
    
    return groupQuestions.map((q, idx) => {
      const qNum = q.question_number;
      return (
        <div key={q.id} className="py-3" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
          <p style={{
            color: 'rgb(40, 40, 40)',
            fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '17px',
            fontWeight: isMultiple ? 400 : 700,
            lineHeight: '26px',
            marginTop: '12px',
            marginBottom: '12px'
          }}>
            {!isMultiple && `${qNum}. `}<RenderHtml html={q.question_text || ''} />
          </p>
          <div className="ml-4 space-y-2">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
              const text = q[`option_${letter.toLowerCase()}`];
              if (!text) return null;
              const isChecked = isMultiple 
                ? (answers[q.id] || '').includes(letter)
                : answers[q.id] === letter;
              
              return (
                <label key={letter} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-50 rounded-lg">
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(223, 223, 223)',
                    color: 'rgb(41, 69, 99)',
                    fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginRight: '8px'
                  }}>
                    {letter}
                  </span>
                  <input 
                    type={isMultiple ? "checkbox" : "radio"} 
                    name={isMultiple ? undefined : `q${q.id}`}
                    checked={isChecked}
                    onChange={(e) => {
                      if (isMultiple) {
                        const current = answers[q.id] || '';
                        const newValue = e.target.checked
                          ? current + letter
                          : current.replace(letter, '');
                        setAnswers(prev => ({ ...prev, [q.id]: newValue }));
                      } else {
                        setAnswers(prev => ({ ...prev, [q.id]: letter }));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span style={{ marginLeft: '4px' }}><RenderHtml html={text} /></span>
                </label>
              );
            })}
          </div>
        </div>
      );
    });
  }

  // Matching types with dropdowns
  if (type === 'matching_headings' || type === 'matching_information' || type === 'matching_features' || type === 'matching_sentence_endings') {
    return (
      <div className="space-y-4">
        {groupQuestions.map((q, idx) => {
          const qNum = q.question_number;
          return (
            <div key={q.id} className="flex items-center gap-4 py-1">
              <span className="font-bold text-gray-700" style={{ minWidth: '35px', fontSize: '15px' }}>{qNum}.</span>
              <div className="flex-1 flex items-center gap-3">
                <select 
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  style={{ 
                    width: '100px', 
                    height: '32px', 
                    padding: '0 20px 0 10px', 
                    border: '1px solid rgb(189, 197, 207)', 
                    borderRadius: '100px', 
                    fontSize: '15px',
                    fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif'
                  }}
                >
                  <option value=""></option>
                  {paragraphLetters.map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>
                <p className="flex-1" style={{ fontSize: '15px', lineHeight: '1.6' }}><RenderHtml html={q.question_text || ''} /></p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Sentence Completion - NO number, just template
  if (type === 'sentence_completion') {
    return groupQuestions.map((q, idx) => {
      const qNum = q.question_number;
      const template = q.question_template || q.question_text || '';
      const parts = template.split('[BLANK]');
      
      return (
        <div key={q.id} className="mb-3">
          <div style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '14px' }}>
            <RenderHtml html={parts[0]} />
            {parts.length > 1 && (
              <>
                <BlankInput 
                  questionNumber={qNum}
                  value={answers[q.id]}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
                <RenderHtml html={parts[1]} />
              </>
            )}
          </div>
        </div>
      );
    });
  }

  // Short Answer
  if (type === 'short_answer') {
    return groupQuestions.map((q, idx) => {
      const qNum = q.question_number;
      return (
        <div key={q.id} className="flex items-start gap-3 mb-3">
          <span className="font-bold text-gray-700">{qNum}.</span>
          <input 
            type="text"
            value={answers[q.id] || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            className="flex-1 px-3 py-2 border rounded-lg"
            style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
          />
        </div>
      );
    });
  }

  // Other completion types
  if (['summary_completion', 'table_completion', 'diagram_labeling', 'note_completion', 'form_completion'].includes(type)) {
    return groupQuestions.map((q, idx) => {
      const qNum = q.question_number;
      return (
        <div key={q.id} className="flex items-start gap-3 mb-3">
          <span className="font-bold text-gray-700">{qNum}.</span>
          <input 
            type="text"
            value={answers[q.id] || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            className="flex-1 px-3 py-2 border rounded-lg"
            style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
          />
        </div>
      );
    });
  }

  return null;
};

export default function ReadingRenderer({ section, partNumber, globalOffset, questions, questionGroups, answers, setAnswers }) {
  const [textWidth, setTextWidth] = useState(50); // Percentage width for text side
  
  if (!section) return null;

  const sectionGroups = questionGroups
    .filter(g => g.section_id === section.id)
    .sort((a, b) => a.group_order - b.group_order);
  
  const paragraphLetters = detectParagraphLetters(section.content);

  return (
    <div className="h-full flex flex-col">
      {/* IELTS-style headers */}
      <div className="mb-4">
        <h1 style={{ 
          fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
          fontSize: '24px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          color: 'rgb(41, 69, 99)', 
          margin: '0 0 5px 0', 
          padding: 0, 
          lineHeight: '28.8px' 
        }}>
          PART {partNumber}
        </h1>
        <h2 style={{ 
          fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
          fontSize: '18px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          color: 'rgb(41, 69, 99)', 
          margin: '0 0 10px 0', 
          padding: 0, 
          lineHeight: '21.6px' 
        }}>
          READING PASSAGE {partNumber}
        </h2>
      </div>

      {/* Side-by-side layout */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* LEFT SIDE: Passage */}
        <div 
          className="overflow-y-auto pr-4"
          style={{ 
            width: `${textWidth}%`,
            borderRight: '2px solid rgb(221, 221, 221)'
          }}
        >
          {/* Instruction */}
          {section.instruction && (
            <div 
              style={{ 
                fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
                fontSize: '14px', 
                fontStyle: 'italic',
                color: 'rgb(40, 40, 40)', 
                marginBottom: '5px', 
                lineHeight: '21px'
              }}
              dangerouslySetInnerHTML={{ __html: section.instruction }}
            />
          )}
          
          {/* Image */}
          {section.image_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={section.image_url} 
                alt={section.image_description || 'Passage image'} 
                style={{ 
                  maxWidth: '100%', 
                  width: 'auto',
                  height: 'auto',
                  display: 'block'
                }} 
              />
            </div>
          )}
          
          {/* Title */}
          <h3 style={{ 
            fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
            fontSize: '26px', 
            fontWeight: 700, 
            textTransform: 'uppercase',
            color: 'rgb(41, 69, 99)', 
            marginBottom: '10px', 
            lineHeight: '31.2px',
            textAlign: 'center'
          }}>
            {section.title || `Passage ${partNumber}`}
          </h3>
          
          {/* Content */}
          <div 
            style={{ 
              fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
              fontSize: '16px', 
              color: 'rgb(40, 40, 40)', 
              lineHeight: '1.6',
              marginBottom: '30px'
            }}
            dangerouslySetInnerHTML={{ __html: (section.content || '').replace(/\b([A-Z])\. /g, '<strong>$1.</strong> ') }}
          />
        </div>

        {/* Resizer */}
        <div 
          className="cursor-col-resize w-1 bg-gray-300 hover:bg-blue-500 transition"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = textWidth;
            const container = e.currentTarget.parentElement;
            const containerWidth = container.offsetWidth;

            const handleMouseMove = (e) => {
              const deltaX = e.clientX - startX;
              const deltaPercent = (deltaX / containerWidth) * 100;
              const newWidth = Math.max(30, Math.min(70, startWidth + deltaPercent));
              setTextWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* RIGHT SIDE: Questions */}
        <div 
          className="overflow-y-auto pl-4"
          style={{ width: `${100 - textWidth}%` }}
        >
          {sectionGroups.map(group => {
            const groupQuestions = questions
              .filter(q => q.section_id === section.id && q.question_number >= group.question_range_start && q.question_number <= group.question_range_end)
              .sort((a, b) => a.question_number - b.question_number);
            
            // Calculate the starting index for this group (how many questions came before)
            const previousQuestions = questions
              .filter(q => q.section_id === section.id && q.question_number < group.question_range_start)
              .length;
            const groupStartNum = globalOffset + previousQuestions + 1;
            const groupEndNum = globalOffset + previousQuestions + groupQuestions.length;
            const questionRangeText = groupStartNum === groupEndNum ? `Question ${groupStartNum}` : `Questions ${groupStartNum}–${groupEndNum}`;

            return (
              <div key={group.id} className="mb-12">
                <h3 style={{ 
                  fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
                  fontSize: '22px', 
                  fontWeight: 700, 
                  color: accentColor, 
                  marginTop: '24px', 
                  marginBottom: '32px', 
                  lineHeight: '28px' 
                }}>
                  {questionRangeText}
                </h3>
                {group.instruction_text && (
                  <div 
                    style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '17px', color: 'rgb(40, 40, 40)', marginBottom: '20px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: group.instruction_text }} 
                  />
                )}
                {group.image_url && (
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={group.image_url} 
                      alt={group.image_description || 'Diagram'} 
                      style={{ maxWidth: '100%', width: 'auto', height: 'auto', display: 'block', border: '1px solid rgb(221, 221, 221)' }} 
                    />
                  </div>
                )}
                <div>{renderQuestionGroup(group, groupQuestions, globalOffset + previousQuestions, answers, setAnswers, paragraphLetters)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
