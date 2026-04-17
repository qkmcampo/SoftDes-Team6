import { Bot } from "lucide-react";

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#050725] text-[#F9B672] shadow-[0_12px_22px_rgba(5,7,37,0.10)]">
        <Bot size={16} />
      </div>

      <div className="rounded-[24px] rounded-bl-md border border-[#2C2F45]/8 bg-white/80 px-4 py-3 shadow-[0_14px_32px_rgba(5,7,37,0.06)]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 animate-bounce rounded-full bg-[#84848A]"
              style={{ animationDelay: `${index * 0.14}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
