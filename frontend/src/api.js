const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server — make sure the backend is running on port 8000.");
  }

  const text = await res.text();

  if (!text) {
    throw new Error(
      res.ok
        ? "Server returned an empty response"
        : `Server error (${res.status}) — make sure the backend is running on port 8000.`
    );
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // proxy returned HTML (e.g. 502 from Vite when backend is down)
    throw new Error("Cannot reach the backend — start it with: uvicorn main:app --reload");
  }

  if (!res.ok) {
    // Pydantic validation errors: { detail: [{msg, loc, ...}] }
    // Custom errors: { detail: "string" }
    if (Array.isArray(json.detail)) {
      const msgs = json.detail.map((e) => e.msg.replace("Value error, ", ""));
      throw new Error(msgs.join(". "));
    }
    throw new Error(json.detail || `Request failed (${res.status})`);
  }
  return json;
}

export function createQuiz(data) {
  return request("/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function listQuizzes(page = 1, size = 10) {
  return request(`/api/quizzes?page=${page}&size=${size}`);
}

export function getQuiz(id) {
  return request(`/api/quizzes/${id}`);
}
