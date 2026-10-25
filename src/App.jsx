import { useState } from "react";

const API_URL = "http://localhost:8000";

const RISK_STYLES = {
  low: "bg-emerald-100 text-emerald-900",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-orange-200 text-orange-950",
  critical: "bg-red-200 text-red-950",
};

function Badge({ level }) {
  return (
    <span className={`rounded px-2 py-0.5 text-sm font-semibold ${RISK_STYLES[level] ?? "bg-stone-200"}`}>
      {level}
    </span>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch(`${API_URL}/analyze-safety`, { method: "POST", body });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `Request failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message === "Failed to fetch"
        ? "Can't reach the API. Is uvicorn running on port 8000?"
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b-8 border-yellow-400 bg-stone-800 px-6 py-5 text-stone-50">
        <h1 className="mx-auto max-w-5xl text-2xl font-bold">Site Safety Check</h1>
        <p className="mx-auto max-w-5xl text-stone-300">Upload a site photo to check hardhats, scaffolding and other PPE compliance.</p>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-2">
        {/* Upload column */}
        <section className="space-y-4">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="block w-full rounded border border-stone-300 bg-white p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-yellow-400 file:px-3 file:py-1.5 file:font-semibold file:text-stone-900"
          />
          {preview ? (
            <img src={preview} alt="Selected site" className="w-full rounded border border-stone-300 object-cover" />
          ) : (
            <div className="flex h-56 items-center justify-center rounded border-2 border-dashed border-stone-300 text-stone-500">
              Choose an image to begin
            </div>
          )}
          <button
            onClick={analyze}
            disabled={!file || loading}
            className="w-full rounded bg-yellow-400 px-4 py-2.5 font-bold text-stone-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analyzing…" : "Analyze safety"}
          </button>
          {error && <p className="rounded bg-red-100 p-3 text-red-900">{error}</p>}
        </section>

        {/* Results column */}
        <section className="space-y-4">
          {!result && !loading && !error && (
            <p className="text-stone-500">Results will appear here.</p>
          )}

          {result && (
            <>
              <div className="rounded bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Summary</h2>
                  <Badge level={result.overall_risk} />
                </div>
                <p className="mb-3">{result.summary}</p>
                <p className="text-sm text-stone-600">
                  Compliance score: <b>{result.compliance_score}/100</b> · Workers detected: <b>{result.workers_detected}</b>
                </p>
              </div>

              <div className="rounded bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-lg font-bold">Violations ({result.violations.length})</h2>
                <ul className="space-y-3">
                  {result.violations.map((v, i) => (
                    <li key={i} className="border-l-4 border-orange-400 pl-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{v.type.replaceAll("_", " ")}</span>
                        <Badge level={v.severity} />
                      </div>
                      <p>{v.description}</p>
                      <p className="text-sm text-stone-500">
                        {v.location} · {Math.round(v.confidence * 100)}% confidence
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-lg font-bold">Recommendations</h2>
                <ul className="list-disc space-y-1 pl-5">
                  {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>

              <details className="rounded bg-white p-4 shadow-sm">
                <summary className="cursor-pointer font-semibold">Raw JSON</summary>
                <pre className="mt-3 overflow-x-auto rounded bg-stone-100 p-3 text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
