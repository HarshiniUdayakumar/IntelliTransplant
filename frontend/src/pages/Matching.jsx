
import { useEffect, useState } from "react";
import Header from "../components/Header";
import {
  findBestMatch,
  getAvailableOrgans,
  getRecipients,
} from "../services/api";
import "./Matching.css";

export default function Matching() {
  const [organs, setOrgans] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [organId, setOrganId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [organData, recipientData] = await Promise.all([
        getAvailableOrgans(),
        getRecipients(),
      ]);

      const available = organData.filter(
        (organ) => organ.status?.toLowerCase() === "available"
      );

      setOrgans(available);
      setRecipients(
        recipientData.filter(
          (recipient) => recipient.status?.toLowerCase() === "waiting"
        )
      );

      setOrganId((current) =>
        available.some((organ) => String(organ.id) === current)
          ? current
          : ""
      );
    } catch (err) {
      setError(err.message || "Unable to load matching data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleMatch() {
    if (!organId) {
      setError("Please select an available organ first.");
      return;
    }

    setMatching(true);
    setError("");
    setResult(null);

    try {
      const data = await findBestMatch(organId);
      setResult(data);
    } catch (err) {
      setError(err.message || "Matching request failed.");
    } finally {
      setMatching(false);
    }
  }

  const matchedRecipient = result?.recipient_id != null
    ? recipients.find(
        (recipient) => recipient.id === result.recipient_id
      )
    : null;

  const score = Number(result?.compatibility_score ?? 0);
  const isRecommended = result?.decision === "recommended";

  return (
    <div className="page">
      <Header
        title="AI Matching"
        subtitle="Knowledge-based eligibility and constraint-based organ allocation"
      />

      <main className="matching-content">
        <section className="matching-stats">
          <div className="matching-stat-card">
            <span className="matching-stat-icon">🫀</span>
            <div>
              <p>Available Organs</p>
              <h2>{loading ? "—" : organs.length}</h2>
            </div>
          </div>

          <div className="matching-stat-card">
            <span className="matching-stat-icon">👥</span>
            <div>
              <p>Waiting Recipients</p>
              <h2>{loading ? "—" : recipients.length}</h2>
            </div>
          </div>

          <div className="matching-stat-card">
            <span className="matching-stat-icon">🧠</span>
            <div>
              <p>Matching Engine</p>
              <h2 className="matching-engine-status">
                {loading ? "Loading" : "Ready"}
              </h2>
            </div>
          </div>
        </section>

        <section className="matching-panel">
          <div className="matching-panel-heading">
            <div>
              <h2>Find Best Match</h2>
              <p>
                Choose an available organ to run the backend matching engine.
              </p>
            </div>
            <span className="matching-ai-icon">✦ AI</span>
          </div>

          {error && (
            <div className="matching-message matching-error">
              {error}
            </div>
          )}

          <div className="matching-controls">
            <div className="matching-field">
              <label htmlFor="matching-organ">Select Available Organ</label>
              <select
                id="matching-organ"
                value={organId}
                onChange={(event) => {
                  setOrganId(event.target.value);
                  setResult(null);
                  setError("");
                }}
                disabled={loading || organs.length === 0 || matching}
              >
                <option value="">Choose an organ...</option>
                {organs.map((organ) => (
                  <option key={organ.id} value={organ.id}>
                    {organ.organ_type} · {organ.blood_group} · ID #{organ.id}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="matching-run-btn"
              onClick={handleMatch}
              disabled={loading || matching || !organId}
            >
              {matching ? "Finding Match..." : "✦ Find Best Match"}
            </button>
          </div>

          {!loading && organs.length === 0 && (
            <p className="matching-hint">
              No available organs found. Register an organ first in Organ
              Management.
            </p>
          )}

          {!loading && organs.length > 0 && recipients.length === 0 && (
            <p className="matching-hint">
              No waiting recipients are currently listed. Register a recipient
              before running matching.
            </p>
          )}
        </section>

        {result && (
          <section className="matching-panel matching-result-panel">
            <div className="matching-panel-heading">
              <div>
                <h2>Matching Result</h2>
                <p>Actual response from your FastAPI matching endpoint.</p>
              </div>

              <span
                className={`matching-decision ${
                  isRecommended ? "decision-recommended" : "decision-none"
                }`}
              >
                {isRecommended ? "Recommended" : "No Match"}
              </span>
            </div>

            <div className="matching-score-section">
              <div>
                <p className="matching-muted">Compatibility Score</p>
                <h2>{Number.isFinite(score) ? score : 0}</h2>
                <span className="matching-muted">
                  Score returned by CSP assignment
                </span>
              </div>

              <div className="matching-score-track">
                <div
                  className="matching-score-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, score))}%`,
                  }}
                />
              </div>
            </div>

            <div className="matching-result-grid">
              <div className="matching-result-item">
                <span>Organ ID</span>
                <strong>{result.organ_id}</strong>
              </div>

              <div className="matching-result-item">
                <span>Recipient ID</span>
                <strong>{result.recipient_id ?? "Not assigned"}</strong>
              </div>

              <div className="matching-result-item">
                <span>Blood Group</span>
                <strong>{result.blood_group_match}</strong>
              </div>

              <div className="matching-result-item">
                <span>PRA Score</span>
                <strong>{result.pra_score}%</strong>
              </div>
            </div>

            {matchedRecipient && (
              <div className="matching-recipient-card">
                <span className="matching-recipient-avatar">👤</span>
                <div>
                  <p className="matching-muted">Matched Recipient</p>
                  <h3>{matchedRecipient.name}</h3>
                  <p>
                    {matchedRecipient.organ_type} · Blood Group{" "}
                    {matchedRecipient.blood_group}
                  </p>
                </div>
              </div>
            )}

            {result.reason && (
              <div className="matching-reason">
                <h3>Decision Explanation</h3>
                <p>{result.reason}</p>
              </div>
            )}

            <button
              className="matching-secondary-btn"
              onClick={() => {
                setResult(null);
                loadData();
              }}
            >
              Refresh Matching Data
            </button>
          </section>
        )}

        <section className="matching-info">
          <h3>How the matching engine works</h3>
          <div className="matching-info-grid">
            <div>
              <span>01</span>
              <strong>Eligibility Rules</strong>
              <p>Checks candidates using your knowledge engine.</p>
            </div>
            <div>
              <span>02</span>
              <strong>CSP + Backtracking</strong>
              <p>Searches for the best assignment using your CSP engine.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Decision Output</strong>
              <p>Displays the selected recipient, score, and reason returned by the backend.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
