/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadedFile } from '../types';

interface FileUploadProps {
  onUpload: (file: File) => void;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const isAllowed = (file: File) =>
    ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type) ||
    file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.txt');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach(file => {
      if (isAllowed(file)) simulateUpload(file);
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        if (isAllowed(file)) simulateUpload(file);
      });
    }
  };

  const simulateUpload = (file: File) => {
    const newFile: UploadedFile = {
      name: file.name,
      status: 'uploading',
      progress: 0
    };

    setFiles(prev => [...prev, newFile]);
    onUpload(file);

    // Simulate progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 30;
      if (prog >= 100) {
        prog = 100;
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: 100, status: 'completed' } : f));
        clearInterval(interval);
      } else {
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: Math.min(prog, 99) } : f));
      }
    }, 400);
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer
          ${isDragging
            ? 'border-accent-blue bg-accent-blue/5 scale-[1.02]'
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
          }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileInput}
          multiple
        />
        <Upload className="w-5 h-5 text-white/50" />
        <p className="text-white/70 text-xs text-center">Drop PDF, DOCX, or TXT here</p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <motion.div
                key={file.name + idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10"
              >
                <FileText className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[11px] font-medium text-white/70 truncate max-w-[120px]">{file.name}</span>
                {file.status === 'uploading' ? (
                  <span className="text-[10px] text-accent-blue animate-pulse">{Math.round(file.progress)}%</span>
                ) : (
                  <button
                    onClick={() => removeFile(file.name)}
                    className="p-0.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
