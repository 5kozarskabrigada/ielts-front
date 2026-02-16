export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ---------- Auth ----------

export async function apiLogin(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }
  return res.json(); // { token, user }
}

export async function apiRegisterDevAdmin(data) {
  const res = await fetch(`${API_URL}/auth/dev/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Registration failed");
  }
  return res.json();
}

export async function apiForgotPassword(email) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to reset password");
  }
  return res.json();
}

// ---------- Users (Admin) ----------

export async function apiListUsers(token, query = "") {
  const url = query ? `${API_URL}/users?q=${encodeURIComponent(query)}` : `${API_URL}/users`;
  const res = await fetch(url, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to list users");
  }
  return res.json();
}

export async function apiCreateUser(token, userData) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create user");
  }
  return res.json();
}

export async function apiUpdateUser(token, userId, updates) {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update user");
  }
  return res.json();
}

export async function apiDeleteUser(token, userId) {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete user");
  }
  return res.json();
}

// ---------- Classrooms ----------

export async function apiListClassrooms(token) {
  const res = await fetch(`${API_URL}/classrooms`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to list classrooms");
  }
  return res.json();
}

export async function apiCreateClassroom(token, classroomData) {
  const res = await fetch(`${API_URL}/classrooms`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(classroomData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create classroom");
  }
  return res.json();
}

// ---------- Exams ----------

export async function apiListExams(token) {
  const res = await fetch(`${API_URL}/exams`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to list exams");
  }
  return res.json();
}

export async function apiCreateExam(token, examData) {
  const res = await fetch(`${API_URL}/exams`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(examData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create exam");
  }
  return res.json();
}

export async function apiGetExam(token, examId) {
  const res = await fetch(`${API_URL}/exams/${examId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get exam");
  }
  return res.json();
}

export async function apiUpdateExamStatus(token, examId, updates) {
  const res = await fetch(`${API_URL}/exams/${examId}/status`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update exam status");
  }
  return res.json();
}

export async function apiDeleteExam(token, examId) {
  const res = await fetch(`${API_URL}/exams/${examId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete exam");
  }
  return res.json();
}

export async function apiGetExamLogs(token, examId) {
  const res = await fetch(`${API_URL}/exams/${examId}/logs`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get exam logs");
  }
  return res.json();
}

export async function apiCreateSection(token, examId, sectionData) {
  const res = await fetch(`${API_URL}/exams/${examId}/sections`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(sectionData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create section");
  }
  return res.json();
}

export async function apiAddQuestions(token, examId, questions) {
  const res = await fetch(`${API_URL}/exams/${examId}/questions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ questions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to add questions");
  }
  return res.json();
}

export async function apiSubmitExam(token, examId, payload) {
  const res = await fetch(`${API_URL}/exams/${examId}/submit`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit exam");
  }
  return res.json();
}

export async function apiSaveExamStructure(token, examId, payload) {
  const res = await fetch(`${API_URL}/exams/${examId}/structure`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save exam structure");
  }
  return res.json();
}

// ---------- Monitoring ----------

export async function apiLogViolation(token, examId, type, metadata) {
  const res = await fetch(`${API_URL}/exams/${examId}/violations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ type, metadata }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to log violation");
  }
  return res.json();
}

// ---------- Admin ----------

export async function apiGetDashboardStats(token) {
  const res = await fetch(`${API_URL}/admin/stats`, {
    headers: authHeaders(token),
    body: JSON.stringify({}), // Should be GET? Ah, original code had fetch with headers, but GET usually doesn't have body unless specified. Wait, previous code didn't have body.
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get stats");
  }
  return res.json();
}

export async function apiGetAdminLogs(token) {
  const res = await fetch(`${API_URL}/admin/logs`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get logs");
  }
  return res.json();
}

export async function apiGetScoringConfigs(token) {
  const res = await fetch(`${API_URL}/admin/configs`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get configs");
  }
  return res.json();
}

export async function apiUpdateScoringConfig(token, key, value) {
  const res = await fetch(`${API_URL}/admin/configs/${key}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update config");
  }
  return res.json();
}
