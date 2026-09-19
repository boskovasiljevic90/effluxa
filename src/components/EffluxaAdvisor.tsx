"use client";

import {
  Bot,
  ChevronDown,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAdvisorPageLabel } from "@/lib/effluxaAdvisor";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const WELCOME_MESSAGE =
  "Hi — I’m Effluxa Advisor. Ask me about this page, a report, a finding, or the next action. You can write in any language; I’ll reply in the language you use.";

export default function EffluxaAdvisor({
  preferredLanguage,
}: {
  preferredLanguage?: string | null;
}) {
  const pathname = usePathname() || "/dashboard";
  const pageLabel = getAdvisorPageLabel(pathname);
  const reportId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/reports\/([^/]+)/);
    return match?.[1] || null;
  }, [pathname]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: "assistant",
      content: WELCOME_MESSAGE,
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, open]);

  const starterPrompts = reportId
    ? [
        "Explain this report in simple terms",
        "What is the most important risk here?",
        "Show me the next practical action",
      ]
    : [
        "What can you help me with on this page?",
        "Teach me how to use Effluxa",
        "Where should I start?",
      ];

  function addUserMessage(content: string) {
    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: "user", content },
    ]);
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();

    const content = draft.trim();
    if (!content || isSending) return;

    const history = messages.map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));

    addUserMessage(content);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history,
          pathname,
          reportId,
          preferredLanguage,
          browserLanguage:
            typeof navigator !== "undefined" ? navigator.language : "",
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.answer) {
        throw new Error(
          payload?.error || "Effluxa Advisor is temporarily unavailable."
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: payload.answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Effluxa Advisor is temporarily unavailable. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  return (
    <>
      {open && (
        <section
          className="effluxa-advisor-panel"
          aria-label="Effluxa Advisor"
          role="dialog"
          aria-modal="false"
        >
          <div className="effluxa-advisor-header">
            <div className="effluxa-advisor-title-wrap">
              <div className="effluxa-advisor-avatar" aria-hidden="true">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="effluxa-advisor-title">Effluxa Advisor</div>
                <div className="effluxa-advisor-context">
                  <span className="effluxa-advisor-live-dot" />
                  {pageLabel} context
                </div>
              </div>
            </div>

            <div className="effluxa-advisor-header-actions">
              <button
                type="button"
                className="effluxa-advisor-icon-button"
                onClick={() => setOpen(false)}
                aria-label="Minimize Effluxa Advisor"
                title="Minimize"
              >
                <ChevronDown size={18} />
              </button>
              <button
                type="button"
                className="effluxa-advisor-icon-button"
                onClick={() => setMessages([])}
                aria-label="Clear Effluxa Advisor conversation"
                title="Clear conversation"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="effluxa-advisor-trust-note">
            <ShieldCheck size={15} />
            <span>Read-only guidance. Ask in any language.</span>
          </div>

          <div className="effluxa-advisor-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="effluxa-advisor-empty">
                <Bot size={24} />
                <p>Start a new conversation with Effluxa Advisor.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`effluxa-advisor-message ${message.role}`}
              >
                {message.role === "assistant" && (
                  <span className="effluxa-advisor-message-icon" aria-hidden="true">
                    <Bot size={14} />
                  </span>
                )}
                <div className="effluxa-advisor-message-bubble">
                  {message.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="effluxa-advisor-message assistant">
                <span className="effluxa-advisor-message-icon" aria-hidden="true">
                  <Bot size={14} />
                </span>
                <div className="effluxa-advisor-message-bubble effluxa-advisor-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <div className="effluxa-advisor-starters" aria-label="Suggested questions">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setDraft(prompt);
                  window.setTimeout(() => textareaRef.current?.focus(), 0);
                }}
                disabled={isSending}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className="effluxa-advisor-composer" onSubmit={sendMessage}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Effluxa Advisor…"
              aria-label="Message Effluxa Advisor"
              rows={1}
              maxLength={4000}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="submit"
              className="effluxa-advisor-send"
              disabled={!draft.trim() || isSending}
              aria-label="Send message"
              title="Send message"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      {!open && (
        <button
          type="button"
          className="effluxa-advisor-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open Effluxa Advisor"
        >
          <MessageCircle size={22} />
          <span>Ask Effluxa</span>
          <span className="effluxa-advisor-launcher-sparkle" aria-hidden="true">
            <Sparkles size={12} />
          </span>
        </button>
      )}
    </>
  );
}
