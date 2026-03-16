"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  selectedFile: File | null;
  error: string | null;
}

export function FileUpload({ onFileSelect, onFileClear, selectedFile, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      // Reset input so the same file can be re-selected after clearing
      e.target.value = "";
    },
    [onFileSelect]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {selectedFile ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={onFileClear}
            className="shrink-0 rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload CV file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" || e.key === " " ? inputRef.current?.click() : undefined}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:border-muted-foreground hover:bg-muted",
          ].join(" ")}
        >
          <Upload
            className={["h-8 w-8", isDragging ? "text-primary" : "text-muted-foreground"].join(" ")}
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              Drag and drop your file here, or{" "}
              <span className="text-primary underline underline-offset-2">browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX, up to 5 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
