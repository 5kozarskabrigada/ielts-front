// src/pages/MockTestPlayerPage.js
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../authContext";
import {
  apiGetMockTest,
  apiGetAssignment
} from "../api";
import TestPlayerPage from "./TestPlayerPage"; // reuse your test player per assignment

const SECTION_ORDER = ["reading", "listening", "speaking", "writing"];

const SECTION_TIMES = {
  reading: 35 * 60,
  listening: 36 * 60,
  speaking: 16 * 60,
  writing: 29 * 60
};

function MockTestPlayerPage({ mockTestId, onExit }) {
  const { currentUser, token } = useAuth();
  const [mockTest, setMockTest] = useState(null);
  const [sectionAssignments, setSectionAssignments] = useState({
    reading: [],
    listening: [],
    speaking: [],
    writing: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("reading");
  const [timeLeft, setTimeLeft] = useState(0);

  // for stepping through assignments inside a section
  const [activeAssignmentIndex, setActiveAssignmentIndex] = useState(0);

  useEffect(() => {
    if (!token || !mockTestId) return;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const mt = await apiGetMockTest(token, mockTestId);

        const secData = { reading: [], listening: [], speaking: [], writing: [] };

        for (const sec of SECTION_ORDER) {
          const ids = mt[`${sec}Ids`] || [];
          const loaded = [];
          for (const id of ids) {
            const a = await apiGetAssignment(token, id);
            loaded.push(a);
          }
          secData[sec] = loaded;
        }

        setMockTest(mt);
        setSectionAssignments(secData);

        const firstAvailable =
          SECTION_ORDER.find(
            (sec) => secData[sec] && secData[sec].length > 0
          ) || "reading";
        setActiveSection(firstAvailable);
        setActiveAssignmentIndex(0);
        setTimeLeft(SECTION_TIMES[firstAvailable]);
      } catch (err) {
        setError(err.message || "Failed to load mock test");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, mockTestId]);

  useEffect(() => {
    if (!activeSection) return;
    setTimeLeft(SECTION_TIMES[activeSection]);
  }, [activeSection]);

  useEffect(() => {
    if (!timeLeft) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const currentAssignments = useMemo(
    () => sectionAssignments[activeSection] || [],
    [sectionAssignments, activeSection]
  );
  const activeAssignment =
    currentAssignments[activeAssignmentIndex] || null;

  function handleSectionComplete() {
    const idx = SECTION_ORDER.indexOf(activeSection);
    const nextSec = SECTION_ORDER.slice(idx + 1).find(
      (sec) => sectionAssignments[sec] && sectionAssignments[sec].length > 0
    );
    if (nextSec) {
      setActiveSection(nextSec);
      setActiveAssignmentIndex(0);
      setTimeLeft(SECTION_TIMES[nextSec]);
    } else {
      if (onExit) onExit();
    }
  }

  function handleAssignmentFinished() {
    const nextIndex = activeAssignmentIndex + 1;
    if (nextIndex < currentAssignments.length) {
      setActiveAssignmentIndex(nextIndex);
    } else {
      handleSectionComplete();
    }
  }

  if (!currentUser || currentUser.role !== "student") {
    return (
      <div className="main-content">
        <div className="page-title">Mock test</div>
        <div className="card">Student access only.</div>
      </div>
    );
  }

  if (loading || !mockTest) {
    return (
      <div className="main-content">
        <div className="page-title">Mock test</div>
        {loading && (
          <div className="text-muted" style={{ marginTop: 8 }}>
            Loading…
          </div>
        )}
        {error && (
          <div className="form-error" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="main-content">
      <div className="page-title">{mockTest.title}</div>
      <div className="page-subtitle">
        Full TOEFL-style practice test. Sections are timed and run one by one.
      </div>

      <div
        className="card"
        style={{
          borderTop: "4px solid #4f46e5",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16
        }}
      >
        <div>
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Active section
          </div>
          <div style={{ fontWeight: 600 }}>
            {SECTION_LABELS[activeSection] || activeSection}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Time remaining
          </div>
          <div
            style={{
              fontWeight: 600,
              fontFamily: "monospace",
              fontSize: "1.1rem"
            }}
          >
            {mins.toString().padStart(2, "0")}:
            {secs.toString().padStart(2, "0")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {SECTION_ORDER.map((sec) => {
            const has = (sectionAssignments[sec] || []).length > 0;
            return (
              <button
                key={sec}
                type="button"
                className={
                  activeSection === sec ? "button primary small" : "button small"
                }
                disabled={!has || sec !== activeSection}
              >
                {SECTION_LABELS[sec]}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {!activeAssignment ? (
        <div className="card">
          <div className="text-muted">
            No assignment found in this section. The mock may be misconfigured.
          </div>
        </div>
      ) : (
        <TestPlayerPage
          assignmentId={activeAssignment.id}
          onExit={handleAssignmentFinished}
        />
      )}
    </div>
  );
}

export default MockTestPlayerPage;
