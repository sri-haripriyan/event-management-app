/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useCallback } from "react";
import Spinner from "./Spinner";

const ImageCropModal = ({
  isOpen,
  imageSrc,
  fileName = "avatar.jpg",
  onClose,
  onCropComplete,
  isUploading = false,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);
  const viewportRef = useRef(null);

  // Reset state when a new image is loaded or modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Drag handlers for mouse
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Drag handlers for touch devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Global mouse up / touch end listener
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  // Generate cropped circular avatar
  const handleSave = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const outputSize = 400; // 400x400 high-res output
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Create a circular clipping path
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Map viewport coordinates to canvas
    const viewportSize = 240; // Preview viewport width/height in px
    const scaleFactor = outputSize / viewportSize;

    ctx.save();
    // Center of canvas
    ctx.translate(outputSize / 2, outputSize / 2);
    // Apply pan offset
    ctx.translate(position.x * scaleFactor, position.y * scaleFactor);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply zoom
    ctx.scale(scale, scale);

    // Calculate aspect fit size
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = viewportSize * scaleFactor;
    let drawHeight = viewportSize * scaleFactor;

    if (imgAspect > 1) {
      drawWidth = drawHeight * imgAspect;
    } else {
      drawHeight = drawWidth / imgAspect;
    }

    ctx.drawImage(
      img,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Adjust Profile Picture
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Drag to reposition and zoom to fit the circle
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Viewport / Crop Canvas Area */}
        <div className="flex flex-col items-center justify-center p-6 bg-surface-container-low select-none">
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative w-[240px] h-[240px] rounded-full overflow-hidden cursor-grab active:cursor-grabbing border-4 border-primary-container shadow-inner bg-slate-900 flex items-center justify-center"
          >
            {imageSrc ? (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Avatar preview"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  pointerEvents: "none",
                }}
                className="w-full h-full object-cover transition-transform duration-75"
              />
            ) : null}

            {/* Visual Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-full border border-white/20"></div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-base">pan_tool</span>
            <span>Click and drag image to reposition</span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="px-6 py-4 flex flex-col gap-3 bg-surface-container-lowest border-t border-surface-container-high">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
              disabled={scale <= 1 || isUploading}
              className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
              title="Zoom out"
            >
              <span className="material-symbols-outlined text-lg">zoom_out</span>
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              disabled={isUploading}
              className="flex-1 accent-primary-container h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
              disabled={scale >= 3 || isUploading}
              className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
              title="Zoom in"
            >
              <span className="material-symbols-outlined text-lg">zoom_in</span>
            </button>

            <span className="w-12 text-right font-label-sm text-label-sm text-outline font-mono">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Quick Actions (Rotate, Reset) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
              >
                <span className="material-symbols-outlined text-base">rotate_right</span>
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>

            <span className="text-outline text-xs truncate max-w-[150px]" title={fileName}>
              {fileName}
            </span>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-container-low border-t border-surface-container-high">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-surface-tint font-label-md text-label-md font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 min-w-[130px]"
          >
            {isUploading ? (
              <>
                <Spinner size="sm" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                <span>Save & Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
