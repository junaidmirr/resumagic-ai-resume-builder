import React, { useState, useRef } from "react";
import { X, Check, Search, Maximize } from "lucide-react";
import { cropAndCompressImage } from "../../utils/image";

interface ImageCropModalProps {
  imageSrc: string;
  onCrop: (compressedData: string) => void;
  onClose: () => void;
}

export function ImageCropModal({
  imageSrc,
  onCrop,
  onClose,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleDone = async () => {
    if (!imageRef.current || !containerRef.current) return;

    // Calculate the crop relative to the physical image
    const img = imageRef.current;
    const viewSize = 320; // The fixed size of our crop window in the UI

    // Native dimensions of the image
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    // Display dimensions of the image on screen
    const displayWidth = img.width * zoom;
    const displayHeight = img.height * zoom;

    // Calculate scale bitween display and natural
    const scaleX = nw / displayWidth;
    const scaleY = nh / displayHeight;

    // The top-left of the original image relative to the center of the crop window
    // (viewSize/2) - (img.width*zoom/2) + offset.x is the center pos
    // But let's simplify:
    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Find where the crop window (containerRect) is relative to the image (rect)
    const cropX = (containerRect.left - rect.left) * scaleX;
    const cropY = (containerRect.top - rect.top) * scaleY;
    const cropWidth = viewSize * scaleX;
    const cropHeight = viewSize * scaleY;

    try {
      const dataUrl = await cropAndCompressImage(
        imageSrc,
        { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
        0.7, // Quality
        800, // Target Size
      );
      onCrop(dataUrl);
    } catch (err) {
      console.error("Crop failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500">
              <Maximize size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                Square Crop
              </h3>
              <p className="text-xs text-slate-500">
                Perfect for professional resumes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center gap-8">
          {/* Crop Viewport */}
          <div
            ref={containerRef}
            className="w-80 h-80 rounded-2xl overflow-hidden relative border-4 border-white dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950 flex items-center justify-center cursor-move touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="To crop"
              className="max-w-none pointer-events-none transition-transform duration-75 select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />
            {/* Guide Overlay */}
            <div className="absolute inset-0 border-2 border-teal-500/30 rounded-lg pointer-events-none pointer-events-none border-dashed" />
          </div>

          {/* Controls */}
          <div className="w-full space-y-6">
            <div className="flex items-center gap-4">
              <Search size={16} className="text-slate-400" />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-teal-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-500 w-8">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl text-slate-600 dark:text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="flex-[2] py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Finish & Compress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
