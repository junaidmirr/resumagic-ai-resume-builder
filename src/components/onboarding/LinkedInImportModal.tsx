import { Globe, FileUp, Sparkles, X } from "lucide-react";
import { useState, useRef } from "react";

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (type: "pdf", value: File) => void;
}

export function LinkedInImportModal({
  isOpen,
  onClose,
  onImport,
}: LinkedInImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedFile) {
      onImport("pdf", selectedFile);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-app-surface rounded-2xl shadow-2xl border border-app-border w-full max-w-lg origin-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-sky-500" />
            <h3 className="font-bold text-lg text-app-text">
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

        <div className="px-6 pb-6 pt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-app-text-secondary mb-2">
                Upload profile PDF
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed transition-all
                  ${selectedFile ? "border-sky-400 bg-sky-50 dark:bg-sky-900/10" : "border-app-border hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-app-border bg-app-bg/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!selectedFile}
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
