'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import JobStatus from '@/components/JobStatus';

interface JobEntry {
  jobId: string;
  filename: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<JobEntry[]>([]);

  function handleUpload(jobId: string, filename: string) {
    setJobs((prev) => [{ jobId, filename }, ...prev]);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Transkriptor</h1>
          <p className="text-sm text-gray-400 mt-1">Local audio transcription</p>
        </div>

        <UploadZone onUpload={handleUpload} />

        {jobs.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Jobs ({jobs.length})
            </h2>
            {jobs.map((j) => (
              <JobStatus key={j.jobId} jobId={j.jobId} filename={j.filename} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
