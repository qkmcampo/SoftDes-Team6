import { useState } from "react";
import { Bot, Check, Copy, User } from "lucide-react";

function parseMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      elements.push({ type: "spacer", key: `spacer-${index}` });
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("### ")) {
      elements.push({ type: "h3", text: trimmedLine.slice(4), key: `h3-${index}` });
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("## ")) {
      elements.push({ type: "h2", text: trimmedLine.slice(3), key: `h2-${index}` });
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("# ")) {
      elements.push({ type: "h1", text: trimmedLine.slice(2), key: `h1-${index}` });
      index += 1;
      continue;
    }

    if (/^[-*]\s/.test(trimmedLine)) {
      const items = [];
      while (index < lines.length && /^[-*]\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      elements.push({ type: "ul", items, key: `ul-${index}` });
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmedLine)) {
      const items = [];
      while (index < lines.length && /^\d+[.)]\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ""));
        index += 1;
      }
      elements.push({ type: "ol", items, key: `ol-${index}` });
      continue;
    }

    elements.push({ type: "p", text: line, key: `p-${index}` });
    index += 1;
  }

  return elements;
}

function renderInline(text) {
  if (!text) return null;

  const parts = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|(P[\d,]+\.?\d*))/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[2]) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-[#050725]">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic">
          {match[3]}
        </em>
      );
    } else if (match[4]) {
      parts.push(
        <code
          key={`code-${match.index}`}
          className="rounded-lg bg-[#ECDFC7] px-1.5 py-0.5 text-xs font-mono text-[#050725]"
        >
          {match[4]}
        </code>
      );
    } else if (match[5]) {
      parts.push(
        <span key={`currency-${match.index}`} className="font-semibold text-[#2E6F4E]">
          {match[5]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const parsedContent = !isUser ? parseMarkdown(message.content) : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-[0_12px_22px_rgba(5,7,37,0.10)] ${
          isUser ? "bg-[#2C2F45] text-white" : "bg-[#050725] text-[#F9B672]"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div
        className={`group relative max-w-[78%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-[0_14px_32px_rgba(5,7,37,0.06)] ${
          isUser
            ? "rounded-br-md bg-[#2C2F45] text-white"
            : "rounded-bl-md border border-[#2C2F45]/8 bg-white/80 text-[#050725]"
        }`}
      >
        {!isUser && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-3 rounded-lg p-1 text-[#84848A] opacity-0 transition group-hover:opacity-100 hover:bg-[#ECDFC7] hover:text-[#050725]"
            title="Copy message"
          >
            {copied ? <Check size={13} className="text-[#2E6F4E]" /> : <Copy size={13} />}
          </button>
        )}

        {isUser ? (
          <div className="space-y-1 text-white/95">
            {message.content.split("\n").map((line, index) => (
              <p key={`${message.id}-${index}`}>{line}</p>
            ))}
          </div>
        ) : (
          <div className="space-y-2 pr-6">
            {parsedContent.map((element) => {
              switch (element.type) {
                case "spacer":
                  return <div key={element.key} className="h-1" />;
                case "h1":
                  return (
                    <h3 key={element.key} className="text-base font-semibold text-[#050725]">
                      {renderInline(element.text)}
                    </h3>
                  );
                case "h2":
                  return (
                    <h4 key={element.key} className="text-sm font-semibold text-[#050725]">
                      {renderInline(element.text)}
                    </h4>
                  );
                case "h3":
                  return (
                    <h5 key={element.key} className="text-sm font-semibold text-[#2C2F45]">
                      {renderInline(element.text)}
                    </h5>
                  );
                case "ul":
                  return (
                    <ul key={element.key} className="space-y-2">
                      {element.items.map((item, index) => (
                        <li key={`${element.key}-${index}`} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#F9B672]" />
                          <span>{renderInline(item)}</span>
                        </li>
                      ))}
                    </ul>
                  );
                case "ol":
                  return (
                    <ol key={element.key} className="space-y-2">
                      {element.items.map((item, index) => (
                        <li key={`${element.key}-${index}`} className="flex items-start gap-2">
                          <span className="mt-0.5 w-5 text-xs font-semibold text-[#F9B672]">{index + 1}.</span>
                          <span>{renderInline(item)}</span>
                        </li>
                      ))}
                    </ol>
                  );
                case "p":
                default:
                  return (
                    <p key={element.key} className="text-[#050725]">
                      {renderInline(element.text)}
                    </p>
                  );
              }
            })}
          </div>
        )}

        <p className={`mt-2 text-[10px] font-medium ${isUser ? "text-white/60 text-right" : "text-[#84848A]"}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}

export default ChatMessage;
