import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
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

interface AssetsPanelProps {
  onInsert: (url: string) => void;
}

export function AssetsPanel({ onInsert }: AssetsPanelProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      setUploadProgress(30);

      // Get signature from backend
      const folderPath = `users/${user.uid}/assets`;
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderPath })
      });
      
      if (!signRes.ok) throw new Error("Failed to get upload signature");
      const signData = await signRes.json();
      setUploadProgress(50);

      // Upload to Cloudinary securely
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

      // Save to Firestore
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
      // 1. Delete from Cloudinary via backend
      // Extract public_id from the Cloudinary URL (or we could save it in Firestore initially)
      // The public_id is usually folder/filename without extension
      // To keep it simple, we can extract it from the secure_url or path
      const urlParts = asset.url.split('/');
      const filename = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `users/${user.uid}/assets/${filename}`;

      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId })
      });

      // 2. Delete from Firestore
      await deleteDoc(doc(db, "users", user.uid, "assets", asset.id));
    } catch (err) {
      console.error(err);
      alert("Error removing asset.");
    }
  };

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-slate-400 text-center">
        <ImageIcon size={40} className="mb-4 opacity-50" />
        <h4 className="font-bold text-sm text-app-text-secondary mb-1">Login Required</h4>
        <p className="text-[10px]">Please log in to upload and manage assets.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-surface/50">
      <div className="p-4 border-b border-app-border shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">My Assets</h3>
        
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleUpload} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {isUploading ? `Uploading ${uploadProgress}%` : "Upload Image"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {assets.length === 0 && !isUploading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
            <ImageIcon size={32} className="mb-3 opacity-30" />
            <p className="text-[10px]">No assets uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {assets.map(asset => (
              <div 
                key={asset.id} 
                onClick={() => onInsert(asset.url)}
                className="group relative aspect-square rounded-xl border border-app-border bg-white dark:bg-slate-800 overflow-hidden cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors shadow-sm"
              >
                <img 
                  src={asset.url} 
                  alt={asset.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                  <span className="text-white text-[10px] font-bold tracking-wide">USE IMAGE</span>
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
  );
}
