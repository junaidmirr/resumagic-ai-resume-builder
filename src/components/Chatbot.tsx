import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, X } from "lucide-react";
import type { EditorElement } from "../types/editor";

interface ChatbotProps {
  elements?: EditorElement[];
  onUpdateElements?: (elements: EditorElement[]) => void;
}

export function Chatbot({ elements = [], onUpdateElements }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string; isSystem?: boolean }[]
  >([
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    setStage("Planning...");

    try {
      // Call our backend Architect which has the 2-stage planning logic
      const resp = await fetch("/api/ai-chat-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elements,
          prompt: userMsg,
        }),
      });

      if (!resp.ok) throw new Error("Backend failed to process request");

      setStage("Executing...");
      const result = await resp.json();

      if (result.elements && onUpdateElements) {
        onUpdateElements(result.elements);
        setMessages((p) => [
          ...p,
          {
            role: "bot",
            text: `Design execution complete! 🚀 I've applied the new layout based on your request. How does it look?`,
          },
        ]);
      } else {
        setMessages((p) => [
          ...p,
          {
            role: "bot",
            text: "I analyzed the canvas but didn't find any necessary changes for that request.",
          },
        ]);
      }
    } catch (err: any) {
      console.error("AI Architect Error:", err);
      setMessages((p) => [
        ...p,
        {
          role: "bot",
          text: `Error: ${err.message || "Failed to connect to the AI Architect. Is the backend running?"}`,
        },
      ]);
    } finally {
      setLoading(false);
      setStage(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-xl transition-all z-[100] flex items-center justify-center hover:scale-105 active:scale-95 group"
      >
        <Sparkles
          size={24}
          className="group-hover:rotate-12 transition-transform"
        />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] sm:w-[420px] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100] transition-all border-teal-500/20">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Sparkles size={20} className="text-teal-500 animate-pulse" />
          <h3 className="font-semibold text-sm">AI Editor Architect</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
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
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"}`}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.role === "user" ? "bg-teal-500 text-white rounded-tr-none" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-tl-none"}`}
            >
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap leading-relaxed">
                {m.text}
              </div>
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
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl p-1 pr-1.5 border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-teal-500/50 transition-all">
          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
            placeholder="Tell me what to redesign..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-lg transition-all flex items-center justify-center shadow-lg active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-center text-slate-400">
          AI Architect will mathematically plan and execute designs live on your
          canvas.
        </p>
      </div>
    </div>
  );
}
