import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { apiGetClasses, apiJoinClass } from "../api";

function StudentDashboard() {
  const { currentUser, token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiGetClasses(token)
      .then((data) => {
        setClasses(data);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load classes"))
      .finally(() => setLoading(false));
  }, [token]);

  if (!currentUser || currentUser.role !== "student") {
    return (
      <div className="main-content">
        <div className="page-title">My classrooms</div>
        <div className="card">Student access only.</div>
      </div>
    );
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      setLoading(true);
      await apiJoinClass(token, joinCode.trim());
      setJoinCode("");
      const data = await apiGetClasses(token);
      setClasses(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to join class");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-content">
      <div className="page-title">My classrooms</div>
      <div className="page-subtitle">
        Join your TOEFL classes with a code and see all your groups.
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      {loading && (
        <div className="text-muted" style={{ marginBottom: 12 }}>
          Loading…
        </div>
      )}

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-title">Join a classroom</div>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Class code</label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter code from your teacher"
                />
              </div>
              <button type="submit" className="button primary">
                Join class
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">Your classrooms</div>
            {classes.length === 0 && (
              <div className="text-muted">
                You are not in any classes yet. Ask your teacher for a code.
              </div>
            )}
            {classes.map((c) => (
              <div key={c.id} className="list-item">
                <div>
                  <div>{c.name}</div>
                  <div className="text-muted">
                    Code: {c.join_code}
                  </div>
                </div>
                <div className="tag blue">Joined</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
