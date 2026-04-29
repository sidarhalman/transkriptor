'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';

const ACCEPTED = new Set(['.mp3', '.mp4', '.m4a', '.wav', '.ogg']);

function validFile(file: File) {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ACCEPTED.has(ext);
}

interface Props {
  onUpload: (jobId: string, filename: string) => void;
}

export default function UploadZone({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!validFile(file)) { setError(`Unsupported format: ${file.name}`); return; }
    setError('');
    setSelected(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validFile(file)) { setError(`Unsupported format: ${file.name}`); return; }
    setError('');
    setSelected(file);
  }

  async function handleUpload(cleanup: boolean) {
    if (!selected || uploading) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('audio', selected);
      form.append('cleanup', String(cleanup));
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const { jobId } = await res.json();
      onUpload(jobId, selected.name);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setUploading(false);
    }
  }

  const disabled = !selected || uploading;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onClick={() => !selected && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.mp4,.m4a,.wav,.ogg"
          className="hidden"
          onChange={handleChange}
        />
        {selected ? (
          <p className="text-gray-700 font-medium truncate">{selected.name}</p>
        ) : (
          <>
            <p className="text-gray-500 text-sm">Drag & drop or click to select</p>
            <p className="text-gray-400 text-xs mt-1">mp3 · mp4 · m4a · wav · ogg</p>
          </>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleUpload(false)}
          disabled={disabled}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors
            bg-blue-600 text-white hover:bg-blue-700
            disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading…' : 'Transcribe'}
        </button>
        <button
          onClick={() => handleUpload(true)}
          disabled={disabled}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors
            bg-purple-600 text-white hover:bg-purple-700
            disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading…' : 'Transcribe & AI Cleanup'}
        </button>
      </div>
    </div>
  );
}
