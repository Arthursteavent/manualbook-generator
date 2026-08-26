import { useState, useCallback } from 'react';
import { ParserService, type AiGenerateResult } from '../services/ParserService';
import type { ManualDocument } from '../types/manual.types';

export interface UploadedFile {
  file: File;
  status: 'idle' | 'parsing' | 'done' | 'error';
  error?: string;
  progressMsg?: string;
}

export function useFileUpload(
  onParsed?: (doc: ManualDocument) => void,
  onAiParsed?: (aiResult: AiGenerateResult) => void
) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const isDocx = file.name.toLowerCase().endsWith('.docx');
      setUploadedFile({ file, status: 'parsing', progressMsg: 'Preparing file...' });
      setIsParsing(true);

      try {
        if (isDocx && onAiParsed) {
          const aiRes = await ParserService.parseDocxViaAi(file, (msg: string) => {
            setUploadedFile((prev) => (prev ? { ...prev, progressMsg: msg } : null));
          });
          setUploadedFile({ file, status: 'done' });
          onAiParsed(aiRes);
        } else if (onParsed) {
          const doc = await ParserService.parse(file);
          setUploadedFile({ file, status: 'done' });
          onParsed(doc);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process file';
        setUploadedFile({ file, status: 'error', error: message });
      } finally {
        setIsParsing(false);
      }
    },
    [onParsed, onAiParsed]
  );

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFile(acceptedFiles[0]);
      }
    },
    [handleFile]
  );

  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  return {
    uploadedFile,
    isParsing,
    handleFile,
    handleDrop,
    removeFile,
  };
}
