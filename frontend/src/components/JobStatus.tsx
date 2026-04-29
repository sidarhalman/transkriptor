'use client';

import { useEffect, useState } from 'react';

interface Job {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  originalName: string;
  text: string | null;
  cleanedText: string | null;
  aiCleanup: boolean;
  error: string | null;
}

interface Props {
  jobId: string;
  filename: string;
}

const STATUS_LABEL: Record<Job['status'], string> = {
  queued: 'Queued',
  processing: 'Processing…',
  done: 'Done',
  error: 'Error',
};

const STATUS_COLOR: Record<Job['status'], string> = {
  queued: 'bg-gray-100 text-gray-600',
  processing: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-600',
};

function Spinner() {
  return (
    <span className="inline-block w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-1" />
  );
}

export default function JobStatus({ jobId, filename }: Props) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data: Job = await res.json();
        if (active) setJob(data);
        if (data.status === 'done' || data.status === 'error') return;
        setTimeout(poll, 2000);
      } catch {
        if (active) setTimeout(poll, 3000);
      }
    }

    poll();
    return () => { active = false; };
  }, [jobId]);

  const status = job?.status ?? 'queued';
  const basename = filename.replace(/\.[^.]+$/, '');
  const preview = job?.cleanedText || job?.text;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{filename}</p>
          {job?.cleanedText && (
            <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
              AI Cleaned
            </span>
          )}
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLOR[status]}`}>
          {status === 'processing' && <Spinner />}
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'error' && job?.error && (
        <p className="text-xs text-red-500">{job.error}</p>
      )}

      {status === 'done' && (
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/api/output/${jobId}/txt`}
            download={`${basename}.txt`}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            TXT
          </a>
          <a
            href={`/api/output/${jobId}/docx`}
            download={`${basename}.docx`}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
          >
            DOCX
          </a>
          <a
            href={`/api/output/${jobId}/pdf`}
            download={`${basename}.pdf`}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors"
          >
            PDF
          </a>
          {preview && (
            <p className="w-full text-xs text-gray-500 italic mt-1 line-clamp-2">{preview}</p>
          )}
        </div>
      )}
    </div>
  );
}
