import { Globe, FileUp, Sparkles, X } from "lucide-react";
import { useState, useRef } from "react";

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (type: "url" | "pdf", value: string | File) => void;
}

export function LinkedInImportModal({
  isOpen,
  onClose,
  onImport,
}: LinkedInImportModalProps) {
  const [activeTab, setActiveTab] = useState<"url" | "pdf">("url");
  const [profileUrl, setProfileUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (activeTab === "url" && profileUrl.trim()) {
      onImport("url", profileUrl.trim());
    } else if (activeTab === "pdf" && selectedFile) {
      onImport("pdf", selectedFile);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg origin-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-sky-500" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Import from LinkedIn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 m-6 mb-4 rounded-xl">
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === "url" ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <Globe size={14} /> Profile URL
          </button>
          <button
            onClick={() => setActiveTab("pdf")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === "pdf" ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <FileUp size={14} /> LinkedIn PDF
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          {activeTab === "url" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/username"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                />
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Connect your public profile. We'll attempt to fetch your
                  experience and education directly.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Upload profile PDF
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed transition-all
                    ${selectedFile ? "border-sky-400 bg-sky-50 dark:bg-sky-900/10" : "border-slate-300 dark:border-slate-700 hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  {selectedFile ? (
                    <>
                      <FileUp className="h-8 w-8 text-sky-500" />
                      <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                        {selectedFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-8 w-8 text-slate-400" />
                      <span className="text-sm font-medium text-slate-500">
                        Select "Save to PDF" file from LinkedIn
                      </span>
                    </>
                  )}
                </button>
                <input
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-normal">
                    Tip: Go to your LinkedIn profile, click "More", and select{" "}
                    <strong>"Save to PDF"</strong> for the best results.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={
              (activeTab === "url" && !profileUrl.trim()) ||
              (activeTab === "pdf" && !selectedFile)
            }
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            <Sparkles size={14} />
            Import Profile
          </button>
        </div>
      </div>
    </div>
  );
}
