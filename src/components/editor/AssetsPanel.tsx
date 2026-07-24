import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon, Loader2, Search, Sparkles, X, Camera, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import imageCompression from "browser-image-compression";

interface Asset {
  id: string;
  url: string;
  name: string;
  createdAt: any;
}

interface UnsplashPhoto {
  id: string;
  alt: string;
  thumbUrl: string;
  regularUrl: string;
  downloadLocation: string;
  user: {
    name: string;
    username: string;
    profileUrl: string;
  };
}

interface AssetsPanelProps {
  onInsert: (url: string, width?: number, height?: number) => void;
}

const ICONIFY_HOSTS = [
  "https://api.iconify.design",
  "https://api.simplesvg.com",
  "https://api.unisvg.com",
];

const POPULAR_ICON_CHIPS = [
  "phone", "email", "github", "linkedin", "location", 
  "star", "briefcase", "user", "code", "globe", "calendar", "award",
];

const POPULAR_PHOTO_CHIPS = [
  "headshot", "business", "minimalist", "office", "nature", 
  "technology", "city", "workspace", "portrait", "developer"
];

const DEFAULT_ICONS = [
  "lucide:phone", "lucide:mail", "lucide:globe", "lucide:map-pin", 
  "lucide:linkedin", "lucide:github", "lucide:twitter", "lucide:briefcase", 
  "lucide:user", "lucide:star", "lucide:calendar", "lucide:code", 
  "lucide:award", "lucide:book", "lucide:file-text", "lucide:check-circle", 
  "lucide:heart", "lucide:send", "lucide:layers", "lucide:cpu", 
  "lucide:database", "lucide:feather", "lucide:figma", "lucide:zap"
];

async function fetchIconifySearchWithFallback(queryStr: string): Promise<string[]> {
  for (const host of ICONIFY_HOSTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${host}/search?query=${encodeURIComponent(queryStr)}&limit=60`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.icons)) {
          return data.icons;
        }
      }
    } catch (e) {
      console.warn(`[Iconify API Fallback] ${host} failed, attempting next mirror...`);
    }
  }
  return [];
}

export function AssetsPanel({ onInsert }: AssetsPanelProps) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"icons" | "photos" | "uploads">("icons");

  // --- Uploads State ---
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Iconify API State ---
  const [iconQuery, setIconQuery] = useState("");
  const [iconResults, setIconResults] = useState<{ id: string; url: string; label: string }[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);

  // --- Unsplash API State ---
  const [photoQuery, setPhotoQuery] = useState("headshot");
  const [photoResults, setPhotoResults] = useState<UnsplashPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "8U_8rC3n3tXn2nJ3N2m1L2k3j4h5g6f7e8d9c0b1a2";

  // Fetch Firestore Uploaded Assets
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "assets"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: Asset[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Asset));
      setAssets(data);
    });
    return unsub;
  }, [user]);

  // Iconify API Search
  useEffect(() => {
    if (!iconQuery.trim()) {
      const defaults = DEFAULT_ICONS.map((full) => {
        const [prefix, name] = full.split(":");
        return {
          id: full,
          label: name,
          url: `https://api.iconify.design/${prefix}/${name}.svg`,
        };
      });
      setIconResults(defaults);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingIcons(true);
      try {
        const list = await fetchIconifySearchWithFallback(iconQuery);
        const formatted = list.map((full) => {
          const parts = full.split(":");
          const prefix = parts[0] || "lucide";
          const name = parts[1] || parts[0];
          return {
            id: full,
            label: name,
            url: `https://api.iconify.design/${prefix}/${name}.svg`,
          };
        });
        setIconResults(formatted);
      } catch (err) {
        console.error("[Iconify API Error]", err);
      } finally {
        setLoadingIcons(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [iconQuery]);

  // Unsplash API Photo Search
  useEffect(() => {
    if (activeSubTab !== "photos") return;

    const timer = setTimeout(async () => {
      setLoadingPhotos(true);
      try {
        const q = photoQuery.trim() || "headshot";
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=30&client_id=${unsplashAccessKey}`
        );

        if (res.ok) {
          const data = await res.json();
          const list: any[] = data.results || [];
          const formatted: UnsplashPhoto[] = list.map((p) => ({
            id: p.id,
            alt: p.alt_description || p.description || "Unsplash Photo",
            thumbUrl: p.urls?.small || p.urls?.thumb,
            regularUrl: p.urls?.regular || p.urls?.full,
            downloadLocation: p.links?.download_location || "",
            user: {
              name: p.user?.name || "Photographer",
              username: p.user?.username || "photographer",
              profileUrl: p.user?.links?.html || "https://unsplash.com",
            },
          }));
          setPhotoResults(formatted);
        } else {
          // Curated Unsplash fallback photos if API key rate limited
          setPhotoResults(getFallbackUnsplashPhotos(q));
        }
      } catch (err) {
        console.warn("[Unsplash API Notice] Using high-res curated photos fallback:", err);
        setPhotoResults(getFallbackUnsplashPhotos(photoQuery));
      } finally {
        setLoadingPhotos(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [photoQuery, activeSubTab]);

  const handleSelectUnsplashPhoto = (photo: UnsplashPhoto) => {
    // 1. Mandatory Unsplash API Download Event Trigger
    if (photo.downloadLocation) {
      const triggerUrl = photo.downloadLocation.includes("?")
        ? `${photo.downloadLocation}&client_id=${unsplashAccessKey}`
        : `${photo.downloadLocation}?client_id=${unsplashAccessKey}`;
      fetch(triggerUrl).catch((err) => console.warn("Unsplash download trigger warning:", err));
    }
    // 2. Hotlink original photo URL onto canvas
    onInsert(photo.regularUrl, 200, 200);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      alert("Cloudinary cloud name missing in .env file.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      setUploadProgress(30);

      const folderPath = `users/${user.uid}/assets`;
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderPath })
      });
      
      if (!signRes.ok) throw new Error("Failed to get upload signature");
      const signData = await signRes.json();
      setUploadProgress(50);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", folderPath);
      formData.append("api_key", signData.api_key);
      formData.append("timestamp", signData.timestamp.toString());
      formData.append("signature", signData.signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload to Cloudinary");
      }

      const data = await response.json();
      setUploadProgress(90);

      await addDoc(collection(db, "users", user.uid, "assets"), {
        url: data.secure_url,
        name: file.name,
        createdAt: new Date()
      });
      
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Error uploading image to Cloudinary.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm("Remove this asset from your gallery?")) return;
    
    try {
      const urlParts = asset.url.split('/');
      const filename = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `users/${user.uid}/assets/${filename}`;

      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId })
      });

      await deleteDoc(doc(db, "users", user.uid, "assets", asset.id));
    } catch (err) {
      console.error(err);
      alert("Error removing asset.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-app-surface/50">
      {/* Sub-Header Navigation Tabs */}
      <div className="p-2.5 border-b border-app-border shrink-0 bg-app-surface">
        <div className="grid grid-cols-3 gap-1 p-1 bg-app-bg rounded-xl border border-app-border text-[11px]">
          <button
            onClick={() => setActiveSubTab("icons")}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
              activeSubTab === "icons"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            <Sparkles size={13} />
            Icons
          </button>
          <button
            onClick={() => setActiveSubTab("photos")}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
              activeSubTab === "photos"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            <Camera size={13} />
            Stock Photos
          </button>
          <button
            onClick={() => setActiveSubTab("uploads")}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
              activeSubTab === "uploads"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            <ImageIcon size={13} />
            Uploads
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ICONIFY PUBLIC API LIBRARY */}
      {activeSubTab === "icons" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-app-border space-y-2 bg-app-surface/30 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder="Search 150,000+ vector icons..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-app-bg border border-app-border text-xs font-medium text-app-text placeholder:text-slate-400 focus:outline-none focus:border-brand-primary transition-all"
              />
              {iconQuery && (
                <button
                  onClick={() => setIconQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10px]">
              {POPULAR_ICON_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setIconQuery(chip)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold border transition-all ${
                    iconQuery.toLowerCase() === chip
                      ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                      : "bg-app-surface border-app-border text-slate-500 hover:border-slate-400 hover:text-app-text"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Results Grid */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {loadingIcons ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-teal-500" />
                <span className="text-[11px] font-semibold">Searching Iconify Registry...</span>
              </div>
            ) : iconResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
                <Search size={28} className="mb-2 opacity-30" />
                <p className="text-xs font-semibold">No icons found for "{iconQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {iconResults.map((ico) => (
                  <button
                    key={ico.id}
                    onClick={() => onInsert(ico.url, 40, 40)}
                    title={`Click to insert ${ico.label}`}
                    className="group relative aspect-square p-2 rounded-xl border border-app-border bg-white dark:bg-slate-800 flex items-center justify-center hover:border-teal-500 hover:shadow-md transition-all"
                  >
                    <img
                      src={ico.url}
                      alt={ico.label}
                      className="w-7 h-7 object-contain transition-transform group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        const imgEl = e.currentTarget;
                        if (imgEl.src.includes("api.iconify.design")) {
                          imgEl.src = imgEl.src.replace("api.iconify.design", "api.simplesvg.com");
                        } else if (imgEl.src.includes("api.simplesvg.com")) {
                          imgEl.src = imgEl.src.replace("api.simplesvg.com", "api.unisvg.com");
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: UNSPLASH STOCK PHOTOS LIBRARY */}
      {activeSubTab === "photos" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-app-border space-y-2 bg-app-surface/30 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={photoQuery}
                onChange={(e) => setPhotoQuery(e.target.value)}
                placeholder="Search stock photos..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-app-bg border border-app-border text-xs font-medium text-app-text placeholder:text-slate-400 focus:outline-none focus:border-brand-primary transition-all"
              />
              {photoQuery && (
                <button
                  onClick={() => setPhotoQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10px]">
              {POPULAR_PHOTO_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setPhotoQuery(chip)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold border transition-all ${
                    photoQuery.toLowerCase() === chip
                      ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                      : "bg-app-surface border-app-border text-slate-500 hover:border-slate-400 hover:text-app-text"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Results Grid with Mandatory Unsplash Attribution */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {loadingPhotos ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-teal-500" />
                <span className="text-[11px] font-semibold">Searching Photo Library...</span>
              </div>
            ) : photoResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
                <Camera size={28} className="mb-2 opacity-30" />
                <p className="text-xs font-semibold">No photos found for "{photoQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photoResults.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl border border-app-border bg-white dark:bg-slate-800 overflow-hidden flex flex-col hover:border-teal-500 hover:shadow-md transition-all"
                  >
                    <div
                      onClick={() => handleSelectUnsplashPhoto(photo)}
                      className="aspect-[4/3] w-full overflow-hidden cursor-pointer relative"
                    >
                      <img
                        src={photo.thumbUrl}
                        alt={photo.alt}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold tracking-wide">ADD TO CANVAS</span>
                      </div>
                    </div>

                    {/* Mandatory Unsplash Photographer Attribution */}
                    <div className="p-1.5 bg-app-surface border-t border-app-border/60 text-[9px] text-app-text-muted flex items-center justify-between truncate">
                      <span className="truncate">
                        Photo by{" "}
                        <a
                          href={`${photo.user.profileUrl}?utm_source=resumagic&utm_medium=referral`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-app-text hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {photo.user.name}
                        </a>
                      </span>
                      <a
                        href="https://unsplash.com/?utm_source=resumagic&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[8px] font-semibold text-slate-400 hover:text-teal-500 shrink-0 ml-1 flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Unsplash
                        <ExternalLink size={8} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MY UPLOADS */}
      {activeSubTab === "uploads" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-app-border shrink-0">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !user}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-teal-500/20"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploading ? `Uploading ${uploadProgress}%` : "Upload Custom Asset"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!user ? (
              <div className="p-6 flex flex-col items-center justify-center h-full text-slate-400 text-center">
                <ImageIcon size={36} className="mb-3 opacity-40" />
                <h4 className="font-bold text-xs text-app-text-secondary mb-1">Login Required</h4>
                <p className="text-[10px]">Please log in to upload and save custom assets.</p>
              </div>
            ) : assets.length === 0 && !isUploading ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
                <ImageIcon size={32} className="mb-3 opacity-30" />
                <p className="text-[11px] font-semibold">No assets uploaded yet</p>
                <p className="text-[10px] text-slate-400 mt-1">Upload logos, signatures, or photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {assets.map((asset) => (
                  <div 
                    key={asset.id} 
                    onClick={() => onInsert(asset.url)}
                    className="group relative aspect-square rounded-xl border border-app-border bg-white dark:bg-slate-800 overflow-hidden cursor-pointer hover:border-teal-500 transition-all shadow-sm"
                  >
                    <img 
                      src={asset.url} 
                      alt={asset.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                      <span className="text-white text-[10px] font-bold tracking-wide">INSERT</span>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(asset, e)}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getFallbackUnsplashPhotos(queryStr: string): UnsplashPhoto[] {
  const curated = [
    {
      id: "u1",
      alt: "Professional Headshot Portrait",
      thumbUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
      regularUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80",
      downloadLocation: "",
      user: { name: "Joseph Gonzalez", username: "josephgonzalez", profileUrl: "https://unsplash.com/@josephgonzalez" },
    },
    {
      id: "u2",
      alt: "Corporate Business Portrait",
      thumbUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60",
      regularUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80",
      downloadLocation: "",
      user: { name: "Jonas Kakaroto", username: "jonaskakaroto", profileUrl: "https://unsplash.com/@jonaskakaroto" },
    },
    {
      id: "u3",
      alt: "Modern Executive Headshot",
      thumbUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60",
      regularUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80",
      downloadLocation: "",
      user: { name: "Christina @ wocintechchat.com", username: "wocintechchat", profileUrl: "https://unsplash.com/@wocintechchat" },
    },
    {
      id: "u4",
      alt: "Minimalist Workspace Setup",
      thumbUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=60",
      regularUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80",
      downloadLocation: "",
      user: { name: "Alex Kotliarskyi", username: "alexkotliarskyi", profileUrl: "https://unsplash.com/@alexkotliarskyi" },
    },
    {
      id: "u5",
      alt: "Software Engineer Coding Workspace",
      thumbUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60",
      regularUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80",
      downloadLocation: "",
      user: { name: "Clement H", username: "clementh", profileUrl: "https://unsplash.com/@clementh" },
    },
    {
      id: "u6",
      alt: "Creative Designer Studio Desk",
      thumbUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60",
      regularUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80",
      downloadLocation: "",
      user: { name: "Annie Spratt", username: "anniespratt", profileUrl: "https://unsplash.com/@anniespratt" },
    },
  ];
  return curated;
}
