'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import JobStatus from '@/components/JobStatus';

interface JobEntry {
  jobId: string;
  filename: string;
}

const CLEANUP_PROMPT = `You are an expert transcript correction editor.

The input is a raw automatic speech-to-text transcript.
It may contain:
- misheard words
- phonetic errors
- broken sentences
- incorrect technical or proper nouns

Context:
This is a university lecture from Freie Universität Berlin (FU Berlin),
Department of Iranian Studies (Iranistik).
The content is academic and may include religious, historical, and regional terminology.

Your task:
- Correct transcription errors (misheard or incorrect words)
- Fix grammar, punctuation, and capitalization
- Slightly improve readability WITHOUT changing structure
- Replace clearly wrong words with the most probable correct ones based on context

CRITICAL RULES:
- This is NOT a rewriting task
- This is NOT a summarization task
- DO NOT shorten the text
- DO NOT remove repetitions
- DO NOT merge or compress sentences
- DO NOT change the structure into academic prose
- DO NOT expand or explain anything

- Keep the original sentence flow as much as possible
- Keep the length close to the original
- Keep all ideas and content, even if repetitive
- Only fix what is clearly wrong

- If a word is obviously incorrect → fix it
- If unsure → keep it close to original
- If very unclear → keep original or mark as [unclear]

- Do NOT hallucinate or invent information

Return ONLY the corrected transcript.`;

function PromptPanel() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(CLEANUP_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ChatGPT Cleanup Prompt</p>
        <button
          onClick={copy}
          className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea
        readOnly
        value={CLEANUP_PROMPT}
        rows={5}
        className="text-xs text-gray-500 bg-gray-50 rounded p-2 resize-none focus:outline-none font-mono leading-relaxed"
      />
    </div>
  );
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

        <PromptPanel />

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
