const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/$/,
  "",
);
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the server. Please check if the backend is running.";
const EMPTY_REPLY_MESSAGE = "No reply received from the assistant.";

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function normalizeHistory(history) {
  return Array.isArray(history) ? history : [];
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    console.error("Assistant API parse error:", error);
    return null;
  }
}

export async function sendMessage(message, history = [], hasRetried = false) {
  const safeHistory = normalizeHistory(history);

  try {
    const response = await fetch(`${API_BASE}/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history: safeHistory,
      }),
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      if (!hasRetried && response.status >= 500) {
        await wait(500);
        return sendMessage(message, history, true);
      }
      return data?.error || GENERIC_ERROR_MESSAGE;
    }

    return typeof data?.reply === "string" && data.reply.trim()
      ? data.reply
      : EMPTY_REPLY_MESSAGE;
  } catch (error) {
    console.error("Assistant API error:", error);
    if (!hasRetried) {
      await wait(500);
      return sendMessage(message, history, true);
    }
    return NETWORK_ERROR_MESSAGE;
  }
}

export async function getRecommendations(hasRetried = false) {
  try {
    const response = await fetch(`${API_BASE}/assistant/recommendations`);
    const data = await response.json();

    if (!response.ok) {
      if (!hasRetried && response.status >= 500) {
        await wait(500);
        return getRecommendations(true);
      }
      return [];
    }

    return data.recommendations || [];
  } catch (error) {
    console.error("Recommendations API error:", error);
    if (!hasRetried) {
      await wait(500);
      return getRecommendations(true);
    }
    return [];
  }
}
