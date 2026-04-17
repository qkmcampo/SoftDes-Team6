import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

const MESSAGE_LIMIT = 400;

const SUGGESTION_GROUPS = [
  {
    label: "Budget",
    suggestions: [
      "How is my budget this month?",
      "Am I overspending? Give me a breakdown.",
      "Help me create a monthly budget plan.",
    ],
  },
  {
    label: "Inventory",
    suggestions: [
      "What items should I restock?",
      "Show me my low stock alerts.",
      "Which products are selling the fastest?",
    ],
  },
  {
    label: "Savings",
    suggestions: [
      "How can I reduce my expenses?",
      "Tips to save money this month.",
      "What is my income vs expenses ratio?",
    ],
  },
  {
    label: "Analytics",
    suggestions: [
      "Analyze my recent transactions.",
      "What are my biggest expense categories?",
      "Predict my expenses for next month.",
    ],
  },
];

function ChatInput({ onSend, isLoading, showSuggestions }) {
  const [input, setInput] = useState("");
  const [activeGroup, setActiveGroup] = useState(0);
  const trimmedInput = input.trim();
  const isOverLimit = input.length > MESSAGE_LIMIT;

  const handleSend = () => {
    if (!trimmedInput || isLoading || isOverLimit) return;
    onSend(trimmedInput);
    setInput("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {showSuggestions && (
        <div className="space-y-3 rounded-[24px] border border-[#2C2F45]/10 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#2C2F45] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F9B672]">
              <Sparkles size={12} />
              Prompt ideas
            </div>
            {SUGGESTION_GROUPS.map((group, index) => (
              <button
                key={group.label}
                type="button"
                onClick={() => setActiveGroup(index)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  activeGroup === index
                    ? "bg-[#F9B672]/20 text-[#050725]"
                    : "text-[#84848A] hover:bg-[#ECDFC7] hover:text-[#050725]"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTION_GROUPS[activeGroup].suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSend(suggestion)}
                className="rounded-full border border-[#F9B672]/25 bg-[#F9B672]/12 px-3 py-2 text-xs font-medium text-[#050725] transition hover:-translate-y-0.5 hover:bg-[#F9B672]/18"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[26px] border border-[#2C2F45]/10 bg-white/70 p-3 shadow-[0_14px_34px_rgba(5,7,37,0.06)]">
        <div className="flex items-end gap-3 rounded-[22px] border border-[#2C2F45]/8 bg-[#F4E9DA] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] focus-within:border-[#F9B672]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about expenses, restock priorities, balances, or forecasts"
            rows={1}
            className="min-h-[44px] max-h-32 flex-1 resize-none bg-transparent text-sm leading-relaxed text-[#050725] outline-none placeholder:text-[#84848A]"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!trimmedInput || isLoading || isOverLimit}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
              trimmedInput && !isLoading && !isOverLimit
                ? "bg-[#2C2F45] text-white shadow-[0_12px_24px_rgba(5,7,37,0.16)] hover:bg-[#050725]"
                : "cursor-not-allowed bg-[#2C2F45]/12 text-[#84848A]"
            }`}
          >
            <Send size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[11px] font-medium">
          <span className={`${isOverLimit ? "text-[#B74747]" : "text-[#84848A]"}`}>
            {isOverLimit
              ? `Shorten your message to ${MESSAGE_LIMIT} characters or fewer.`
              : "Press Enter to send, or Shift + Enter for a new line."}
          </span>
          <span className={`${isOverLimit ? "text-[#B74747]" : "text-[#84848A]"}`}>
            {input.length}/{MESSAGE_LIMIT}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
