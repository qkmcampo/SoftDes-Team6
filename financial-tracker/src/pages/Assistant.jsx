import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageSquareText, Search } from "lucide-react";

import ChatInput from "../components/assistant/ChatInput";
import ChatMessage from "../components/assistant/ChatMessage";
import RecommendationSidebar from "../components/assistant/RecommendationSidebar";
import TypingIndicator from "../components/assistant/TypingIndicator";
import useSectionFocus from "../hooks/useSectionFocus";
import { sendMessage } from "../services/geminiService";

const INITIAL_MESSAGE = {
  id: 1,
  role: "assistant",
  content:
    "Hello. I am your Financial Assistant for Gerald Retail.\n\n" +
    "I can help you analyze expenses, suggest restocks, review income sources, and support budget planning using your recorded data.\n\n" +
    "What would you like to review today?",
  timestamp: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
};

function Assistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const bottomRef = useRef(null);
  const conversationRef = useRef(null);
  const recommendationsRef = useRef(null);

  const sectionRefs = useMemo(
    () => ({
      "conversation-panel": conversationRef,
      "ai-recommendations": recommendationsRef,
    }),
    []
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const focusedSection = useSectionFocus(sectionRefs, { delay: 100 });

  const handleSend = async (text) => {
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setIsLoading(true);

    const history = messages
      .filter((message) => message.id !== INITIAL_MESSAGE.id)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const responseText = await sendMessage(text, history);

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((previousMessages) => [...previousMessages, assistantMessage]);
    setIsLoading(false);
  };

  const filteredMessages = searchQuery
    ? messages.filter((message) =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel-pad">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="icon-chip">
              <Bot size={20} />
            </div>
            <div className="max-w-3xl">
              <p className="section-eyebrow">Assistant</p>
              <h1 className="section-title">Financial conversation</h1>
              <p className="section-copy">
                Ask about balances, expenses, restocks, and financial patterns using your recorded data.
              </p>
            </div>
          </div>

          <div className="surface-card flex w-full items-center gap-2 px-4 py-3 xl:w-72">
            <Search size={14} className="shrink-0 text-[#84848A]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search this conversation"
              className="flex-1 bg-transparent text-sm text-[#050725] outline-none placeholder:text-[#84848A]"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_340px]">
        <section
          ref={conversationRef}
          className={`surface-panel section-anchor overflow-hidden ${
            focusedSection === "conversation-panel" ? "section-focus-highlight" : ""
          }`}
        >
          <div className="flex items-center gap-3 border-b border-[#2C2F45]/8 px-6 py-4 text-xs uppercase tracking-[0.16em] text-[#84848A]">
            <MessageSquareText size={14} className="text-[#F9B672]" />
            {searchQuery
              ? `${filteredMessages.length} matching message${filteredMessages.length === 1 ? "" : "s"}`
              : "Conversation history"}
          </div>

          <div className="flex min-h-[440px] flex-col sm:min-h-[520px] xl:h-[calc(100vh-13rem)] xl:max-h-[860px]">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {filteredMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[#2C2F45]/12 bg-white/40 px-6 text-center">
                  <Search size={24} className="text-[#F9B672]" />
                  <p className="mt-4 text-sm font-semibold text-[#050725]">No message matches your search</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#6F6F76]">
                    Try a different keyword or clear the search field to continue the full conversation.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {isLoading && <TypingIndicator />}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="border-t border-[#2C2F45]/10 px-6 py-4">
              <ChatInput
                onSend={handleSend}
                isLoading={isLoading}
                showSuggestions={messages.length <= 1}
              />
            </div>
          </div>
        </section>

        <aside
          ref={recommendationsRef}
          className={`section-anchor xl:sticky xl:top-8 xl:self-start ${
            focusedSection === "ai-recommendations" ? "section-focus-highlight" : ""
          }`}
        >
          <RecommendationSidebar />
        </aside>
      </div>
    </div>
  );
}

export default Assistant;
