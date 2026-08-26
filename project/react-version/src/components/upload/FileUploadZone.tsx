import { useDropzone } from 'react-dropzone';
import type { UploadedFile } from '../../hooks/useFileUpload';

interface Props {
  onDrop: (files: File[]) => void;
  uploadedFile: UploadedFile | null;
  onRemove: () => void;
  isParsing: boolean;
}

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (ext === 'docx') return '📝';
  if (ext === 'json') return '🗂️';
  return '📎';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({ onDrop, uploadedFile, onRemove, isParsing }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
    },
    multiple: false,
    disabled: isParsing,
  });

  if (uploadedFile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: uploadedFile.status === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(0,210,255,0.06)', border: `1px solid ${uploadedFile.status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(0,210,255,0.25)'}`, borderRadius: 10, transition: 'all 0.2s' }}>
        <span style={{ fontSize: 24 }}>{fileIcon(uploadedFile.file.name)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uploadedFile.file.name}</div>
          <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>
            {formatBytes(uploadedFile.file.size)} •{' '}
            {uploadedFile.status === 'parsing' && <span style={{ color: '#00d2ff' }}>{uploadedFile.progressMsg || 'Processing via AI Pipeline...'}</span>}
            {uploadedFile.status === 'done' && <span style={{ color: '#00e676' }}>✓ AI Document ready</span>}
            {uploadedFile.status === 'error' && <span style={{ color: '#ff5555' }}>⚠ {uploadedFile.error}</span>}
          </div>
        </div>
        <button onClick={onRemove} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#a0aec0', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? '#00d2ff' : 'rgba(0,210,255,0.3)'}`,
        borderRadius: 12,
        padding: '28px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: isDragActive ? 'rgba(0,210,255,0.08)' : 'rgba(0,210,255,0.03)',
        transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      <input {...getInputProps()} />
      <div style={{ fontSize: 32, marginBottom: 10 }}>⬆️</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
        {isDragActive ? 'Drop your file here' : 'Drag & Drop or Click to Upload'}
      </div>
      <div style={{ fontSize: 12, color: '#718096' }}>Supports .docx, .pdf, .json</div>
    </div>
  );
}
