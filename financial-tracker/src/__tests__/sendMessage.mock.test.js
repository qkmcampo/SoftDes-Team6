import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";

import { sendMessage } from "../services/geminiService.js";

const API_URL = "http://localhost:5000/api/assistant/chat";
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the server. Please check if the backend is running.";
const EMPTY_REPLY_MESSAGE = "No reply received from the assistant.";

function mockJsonResponse({ ok = true, data = {}, jsonError = null } = {}) {
  return {
    ok,
    json: jest.fn().mockImplementation(async () => {
      if (jsonError) {
        throw jsonError;
      }
      return data;
    }),
  };
}

function getFirstRequest() {
  expect(global.fetch).toHaveBeenCalled();
  const [url, options] = global.fetch.mock.calls[0];

  return {
    url,
    options,
    body: JSON.parse(options.body),
  };
}

describe("sendMessage()", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    global.fetch = jest.fn();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("Trial 01: returns the mocked reply for a valid message", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "Budget tip here." } })
    );

    const result = await sendMessage("Give me a tip");

    expect(result).toBe("Budget tip here.");
  });

  test("Trial 02: sends the request to the correct backend URL", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("Check URL");

    const request = getFirstRequest();
    expect(request.url).toBe(API_URL);
  });

  test("Trial 03: uses POST as the HTTP method", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("Check method");

    const request = getFirstRequest();
    expect(request.options.method).toBe("POST");
  });

  test("Trial 04: sends application/json in the headers", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("Check headers");

    const request = getFirstRequest();
    expect(request.options.headers).toEqual({
      "Content-Type": "application/json",
    });
  });

  test("Trial 05: includes the message field in the request body", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("Where is my message?");

    const request = getFirstRequest();
    expect(request.body.message).toBe("Where is my message?");
  });

  test("Trial 06: includes the provided history array in the request body", async () => {
    const history = [{ role: "user", content: "Earlier message" }];
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("Use history", history);

    const request = getFirstRequest();
    expect(request.body.history).toEqual(history);
  });

  test("Trial 07: defaults history to an empty array when omitted", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("No history passed");

    const request = getFirstRequest();
    expect(request.body.history).toEqual([]);
  });

  test("Trial 08: normalizes a non-array history value into an empty array", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("Bad history input", null);

    const request = getFirstRequest();
    expect(request.body.history).toEqual([]);
  });

  test("Trial 09: does not mutate the original history array", async () => {
    const history = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];
    const originalSnapshot = JSON.stringify(history);

    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage("Keep history intact", history);

    expect(JSON.stringify(history)).toBe(originalSnapshot);
  });

  test("Trial 10: preserves special characters in the message body", async () => {
    const message = "Profit % grew by 12% - nice! @store #1";
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage(message);

    const request = getFirstRequest();
    expect(request.body.message).toBe(message);
  });

  test("Trial 11: preserves multiline messages in the request body", async () => {
    const message = "Line 1\nLine 2\nLine 3";
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "OK" } })
    );

    await sendMessage(message);

    const request = getFirstRequest();
    expect(request.body.message).toBe(message);
  });

  test("Trial 12: returns the backend error message for a 500 response", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({
        ok: false,
        data: { error: "Internal server error" },
      })
    );

    const result = await sendMessage("Trigger 500");

    expect(result).toBe("Internal server error");
  });

  test("Trial 13: returns the backend error message for a 400 response", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({
        ok: false,
        data: { error: "Message is required" },
      })
    );

    const result = await sendMessage("");

    expect(result).toBe("Message is required");
  });

  test("Trial 14: returns a generic message when the server error has no error field", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({
        ok: false,
        data: { details: "Unexpected response" },
      })
    );

    const result = await sendMessage("Missing error field");

    expect(result).toBe(GENERIC_ERROR_MESSAGE);
  });

  test("Trial 15: returns the fallback message when fetch rejects", async () => {
    global.fetch.mockRejectedValue(new Error("Network failure"));

    const result = await sendMessage("No internet");

    expect(result).toBe(NETWORK_ERROR_MESSAGE);
  });

  test("Trial 16: logs an error when fetch rejects", async () => {
    const networkError = new Error("Network failure");
    global.fetch.mockRejectedValue(networkError);

    await sendMessage("Log this failure");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Assistant API error:",
      networkError
    );
  });

  test("Trial 17: handles an empty reply string without crashing", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: { reply: "" } })
    );

    const result = await sendMessage("Empty reply");

    expect(result).toBe(EMPTY_REPLY_MESSAGE);
  });

  test("Trial 18: handles a missing reply field without crashing", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, data: {} })
    );

    const result = await sendMessage("Missing reply");

    expect(result).toBe(EMPTY_REPLY_MESSAGE);
  });

  test("Trial 19: handles invalid JSON gracefully and logs the parse error", async () => {
    const parseError = new Error("Unexpected end of JSON input");
    global.fetch.mockResolvedValue(
      mockJsonResponse({ ok: true, jsonError: parseError })
    );

    const result = await sendMessage("Bad JSON");

    expect(result).toBe(EMPTY_REPLY_MESSAGE);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Assistant API parse error:",
      parseError
    );
  });

  test("Trial 20: resolves multiple sequential calls independently", async () => {
    global.fetch
      .mockResolvedValueOnce(
        mockJsonResponse({ ok: true, data: { reply: "First reply" } })
      )
      .mockResolvedValueOnce(
        mockJsonResponse({ ok: true, data: { reply: "Second reply" } })
      );

    const first = await sendMessage("First call");
    const second = await sendMessage("Second call");

    expect(first).toBe("First reply");
    expect(second).toBe("Second reply");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
