import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Clock,
  Sparkles,
  X,
  Copy,
  Check,
  Square,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import type { EditorElement } from "../types/editor";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import { fetchWithCaptcha } from "../lib/apiWithCaptcha";
import {
  createFallbackPlan,
  generateFallbackElements,
} from "../lib/aiArchitect";

interface MessageAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  isSystem?: boolean;
  actions?: MessageAction[];
}

interface ChatbotProps {
  elements?: EditorElement[];
  onUpdateElements?: (elements: EditorElement[]) => void;
}

export function Chatbot({ elements = [], onUpdateElements }: ChatbotProps) {
  const { user, credits, refreshCredits, deductCredits } = useAuth();
  const { alert } = useDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi! I'm your Resume AI Architect. I can scan your canvas and redesign it for you. Try asking me to 'Make it more modern' or 'Add a sleek sidebar'!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"Planning..." | "Executing..." | null>(
    null,
  );
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!loading) {
      setElapsedMs(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [loading]);

  const formattedTimer = `${(elapsedMs / 1000).toFixed(1)}s`;
  const endRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setStage(null);
    setMessages((p) => [
      ...p,
      {
        role: "bot",
        text: "Task cancelled.",
      },
    ]);
  };

  const applyDefaultLayout = (promptText: string) => {
    if (!onUpdateElements) return;
    const fallbackPlan = createFallbackPlan(promptText || "Professional Resume");
    const fallbackElements = generateFallbackElements(fallbackPlan, promptText || "");
    onUpdateElements(fallbackElements);
    setMessages((p) => [
      ...p,
      {
        role: "bot",
        text: "Default template layout has been applied to your canvas.",
      },
    ]);
  };

  const executeRequest = async (userMsg: string) => {
    if (!userMsg.trim() || loading) return;

    if (credits < 10) {
      alert("Insufficient credits (10 required). Please recharge.");
      return;
    }

    // Instantly start loader & lock UI
    setLoading(true);
    setStage("Planning...");
    setMessages((p) => [...p, { role: "user", text: userMsg }]);

    abortControllerRef.current = new AbortController();

    // Add a placeholder bot message for live streaming
    setMessages((p) => [
      ...p,
      {
        role: "bot",
        text: "Analyzing canvas geometry & thinking...",
      },
    ]);

    try {
      const idToken = user ? await user.getIdToken().catch(() => "") : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-User-ID": user?.uid || "",
        "X-Skip-Credit-Check": "true",
      };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const resp = await fetchWithCaptcha("/api/ai-chat-edit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          elements,
          prompt: userMsg,
          stream: true,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 402)
          throw new Error("Insufficient credits. Please recharge.");
        const errorText = await resp.text().catch(() => "");
        throw new Error(errorText || `Backend failed to process request (${resp.status})`);
      }

      let result: any = null;
      let streamFallbackTriggered = false;
      const contentType = resp.headers.get("Content-Type") || "";

      if (contentType.includes("text/event-stream") && resp.body) {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamedThoughts = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              try {
                const event = JSON.parse(trimmed.slice(5).trim());
                if (event.fallback_triggered || event.type === "fallback_prompt") {
                  streamFallbackTriggered = true;
                }
                if (event.message || event.thought) {
                  const chunk = event.thought || event.message;
                  streamedThoughts += (streamedThoughts ? "\n" : "") + `> ${chunk}`;
                  setMessages((p) => {
                    const copy = [...p];
                    const lastIdx = copy.length - 1;
                    if (lastIdx >= 0 && copy[lastIdx].role === "bot") {
                      copy[lastIdx] = {
                        ...copy[lastIdx],
                        text: streamedThoughts,
                      };
                    }
                    return copy;
                  });
                }
                if (event.type === "complete") {
                  result = event;
                }
              } catch (e) {
                // ignore SSE parse errors
              }
            }
          }
        }
      } else {
        result = await resp.json();
      }

      if (result?.fallback_triggered || streamFallbackTriggered) {
        setMessages((p) => {
          const copy = [...p];
          const promptCopy = userMsg;
          copy.push({
            role: "bot",
            text: "AI generation failed or fell back to default layout. Would you like to use the default template or retry again?",
            actions: [
              {
                label: "Retry Again",
                variant: "primary",
                onClick: () => executeRequest(promptCopy),
              },
              {
                label: "Use Default Template",
                variant: "secondary",
                onClick: () => applyDefaultLayout(promptCopy),
              },
            ],
          });
          return copy;
        });
        return;
      }

      if (result?.status === "rejected") {
        setMessages((p) => [
          ...p,
          {
            role: "bot",
            text: result.reason || result.error || "I am a dedicated Resume & Career AI. I can only assist with resume building and career development topics.",
          },
        ]);
        return;
      }

      setStage("Executing...");

      if (result?.added_elements && onUpdateElements) {
        const combined = [...elements, ...result.added_elements];
        onUpdateElements(combined);
        setMessages((p) => {
          const copy = [...p];
          const lastIdx = copy.length - 1;
          const finalNote = `Design execution complete. Added ${result.added_elements.length} elements (Symmetry: ${result.symmetry_score || 95}/100). How does it look?`;
          if (lastIdx >= 0 && copy[lastIdx].role === "bot") {
            copy[lastIdx] = {
              ...copy[lastIdx],
              text: copy[lastIdx].text ? `${copy[lastIdx].text}\n\n${finalNote}` : finalNote,
            };
          } else {
            copy.push({ role: "bot", text: finalNote });
          }
          return copy;
        });
      } else if (result?.elements && onUpdateElements) {
        onUpdateElements(result.elements);
        setMessages((p) => {
          const copy = [...p];
          const lastIdx = copy.length - 1;
          const finalNote = `Design execution complete. Applied updated canvas layout. How does it look?`;
          if (lastIdx >= 0 && copy[lastIdx].role === "bot") {
            copy[lastIdx] = {
              ...copy[lastIdx],
              text: copy[lastIdx].text ? `${copy[lastIdx].text}\n\n${finalNote}` : finalNote,
            };
          } else {
            copy.push({ role: "bot", text: finalNote });
          }
          return copy;
        });
      } else {
        setMessages((p) => {
          const copy = [...p];
          const lastIdx = copy.length - 1;
          const finalNote = "I analyzed the canvas but didn't find any necessary changes for that request.";
          if (lastIdx >= 0 && copy[lastIdx].role === "bot") {
            copy[lastIdx] = { ...copy[lastIdx], text: finalNote };
          } else {
            copy.push({ role: "bot", text: finalNote });
          }
          return copy;
        });
      }

      // ONLY DEBIT CREDITS ON SUCCESSFUL COMPLETION
      await deductCredits(10).catch(console.error);
      refreshCredits();
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("AI Architect request aborted");
      } else {
        console.error("AI Architect Error:", err);
        const promptCopy = userMsg;
        setMessages((p) => [
          ...p,
          {
            role: "bot",
            text: `AI generation failed: ${err.message || "Failed to connect to the AI Architect."}\n\nWould you like to retry again or use the default template?`,
            actions: [
              {
                label: "Retry Again",
                variant: "primary",
                onClick: () => executeRequest(promptCopy),
              },
              {
                label: "Use Default Template",
                variant: "secondary",
                onClick: () => applyDefaultLayout(promptCopy),
              },
            ],
          },
        ]);
      }
    } finally {
      if (abortControllerRef.current) {
        setLoading(false);
        setStage(null);
        abortControllerRef.current = null;
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    executeRequest(userMsg);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 sm:bottom-28 right-4 sm:right-6 p-2.5 sm:p-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full shadow-lg shadow-teal-500/25 transition-all z-[100] flex items-center justify-center hover:scale-105 active:scale-95 group border border-white/20"
        title="Open AI Resume Architect"
      >
        <Sparkles
          size={18}
          className="group-hover:rotate-12 transition-transform"
        />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 sm:bottom-28 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-w-[420px] flex flex-col bg-app-bg rounded-2xl shadow-2xl border border-app-border overflow-hidden z-[100] transition-all">
      <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface/50">
        <div className="flex items-center gap-2 text-app-text">
          <Sparkles size={20} className="text-teal-500 animate-pulse" />
          <h3 className="font-semibold text-sm">AI Editor Architect</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-app-text-muted hover:text-app-text transition-colors p-1 rounded-md hover:bg-app-surface"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto min-h-[350px] max-h-[500px] space-y-4 scroll-smooth">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-teal-100 text-teal-600" : "bg-app-surface text-app-text-muted"}`}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm relative group ${m.role === "user" ? "bg-teal-500 text-white rounded-tr-none" : "bg-app-surface text-app-text border border-app-border rounded-tl-none"}`}
            >
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap leading-relaxed">
                {m.text}
              </div>
              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-app-border/40 flex flex-wrap gap-2">
                  {m.actions.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      onClick={act.onClick}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        act.variant === "primary"
                          ? "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-sm"
                          : "bg-app-bg hover:bg-app-surface text-app-text border border-app-border"
                      }`}
                    >
                      {act.variant === "primary" ? (
                        <RotateCcw size={12} />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
              {m.role === "bot" && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(m.text);
                    setCopiedIndex(i);
                    setTimeout(() => setCopiedIndex(null), 2000);
                  }}
                  className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
                >
                  {copiedIndex === i ? (
                    <Check size={12} className="text-teal-500" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copiedIndex === i ? "Copied!" : "Copy block"}
                </button>
              )}
            </div>
          </div>
        ))}
        {stage && (
          <div className="flex gap-3 flex-row items-center animate-in fade-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-teal-50 text-teal-500 dark:bg-teal-900/20">
              <Bot size={14} />
            </div>
            <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-tl-none flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-teal-500" />
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {stage}
              </span>
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 flex items-center gap-1">
                <Clock size={12} className="animate-pulse text-teal-500" />{" "}
                {formattedTimer}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-app-border bg-app-bg">
        <div className="flex items-center gap-2 bg-app-surface rounded-xl p-1 pr-1.5 border border-app-border focus-within:ring-2 ring-teal-500/50 transition-all">
          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-app-text placeholder:text-app-text-muted"
            placeholder="Tell me what to redesign..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={loading}
          />
          {loading ? (
            <button
              onClick={handleCancel}
              className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all flex items-center justify-center shadow-lg active:scale-95"
              title="Cancel request"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 text-white rounded-lg transition-all flex items-center justify-center shadow-lg active:scale-95"
              title="Send"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-center text-app-text-muted">
          AI Architect will mathematically plan and execute designs live on your
          canvas.
        </p>
      </div>
    </div>
  );
}
