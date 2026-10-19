
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { getOrgans, getHospitals } from "../services/api";
import {
  optimizeTransportAStar,
  optimizeTransportUCS,
} from "../services/api";
import "./TransportOptimization.css";

function TransportOptimization() {
  const [organs, setOrgans] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [organId, setOrganId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [algorithm, setAlgorithm] = useState("astar");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [organData, hospitalData] = await Promise.all([
          getOrgans(),
          getHospitals(),
        ]);

        setOrgans(organData.filter(
          (organ) => organ.status?.toLowerCase() === "available"
        ));
        setHospitals(hospitalData);
      } catch (err) {
        setError(err.message || "Could not load organs and hospitals.");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  const selectedOrgan = organs.find(
    (organ) => String(organ.id) === organId
  );

  const optimize = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!organId || !destinationId) {
      setError("Select an organ and destination hospital.");
      return;
    }

    if (
      selectedOrgan &&
      String(selectedOrgan.hospital_id) === destinationId
    ) {
      setError("Destination must differ from the source hospital.");
      return;
    }

    setLoading(true);

    try {
      const run = algorithm === "astar"
        ? optimizeTransportAStar
        : optimizeTransportUCS;

      const data = await run(organId, destinationId);
      setResult(data);
    } catch (err) {
      setError(err.message || "Transport optimization failed.");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value, digits = 1) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : "—";
  };

  const risk = Number(result?.bayesian_analysis?.risk_probability);
  const success = Number(result?.bayesian_analysis?.success_probability);
  const coordination = result?.coordination;

  return (
    <div className="page">
      <Header
        title="Transport Optimization"
        subtitle="Plan organ transportation and compare search algorithms"
      />

      <main className="transport-content">
        <section className="transport-hero">
          <div>
            <span className="transport-eyebrow">INTELLITRANSPLANT · LOGISTICS</span>
            <h2>Every minute matters.</h2>
            <p>
              Plan a route between hospitals and review the estimated journey,
              transport risk, and coordination recommendation.
            </p>
          </div>
          <div className="transport-hero-icon">↗</div>
        </section>

        <section className="transport-panel">
          <div className="transport-section-heading">
            <div>
              <h2>Plan a transport</h2>
              <p>Choose an available organ, destination, and algorithm.</p>
            </div>
            <span className="transport-live-badge">ROUTE PLANNER</span>
          </div>

          {loadingData ? (
            <p className="transport-message">Loading organs and hospitals...</p>
          ) : (
            <form className="transport-form" onSubmit={optimize}>
              <div className="transport-field">
                <label htmlFor="transport-organ">Available organ</label>
                <select
                  id="transport-organ"
                  value={organId}
                  onChange={(event) => {
                    setOrganId(event.target.value);
                    setResult(null);
                  }}
                  required
                >
                  <option value="">Choose an organ</option>
                  {organs.map((organ) => (
                    <option key={organ.id} value={organ.id}>
                      #{organ.id} · {organ.organ_type} · {organ.blood_group}
                      {" · Donor: "}{organ.donor_name || organ.donor_id}
                    </option>
                  ))}
                </select>
                {selectedOrgan && (
                  <small>
                    Source hospital: #{selectedOrgan.hospital_id}
                  </small>
                )}
              </div>

              <div className="transport-field">
                <label htmlFor="transport-destination">
                  Destination hospital
                </label>
                <select
                  id="transport-destination"
                  value={destinationId}
                  onChange={(event) => {
                    setDestinationId(event.target.value);
                    setResult(null);
                  }}
                  required
                >
                  <option value="">Choose destination</option>
                  {hospitals
                    .filter(
                      (hospital) =>
                        String(hospital.id) !==
                        String(selectedOrgan?.hospital_id ?? "")
                    )
                    .map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        #{hospital.id} · {hospital.name} · {hospital.city}
                      </option>
                    ))}
                </select>
              </div>

              <div className="transport-field">
                <label htmlFor="transport-algorithm">Search algorithm</label>
                <select
                  id="transport-algorithm"
                  value={algorithm}
                  onChange={(event) => {
                    setAlgorithm(event.target.value);
                    setResult(null);
                  }}
                >
                  <option value="astar">A* Search</option>
                  <option value="ucs">Uniform Cost Search (UCS)</option>
                </select>
                <small>
                  A* uses a heuristic; UCS prioritizes cumulative route cost.
                </small>
              </div>

              <button
                className="transport-submit"
                type="submit"
                disabled={loading || !organs.length || !hospitals.length}
              >
                {loading ? "Calculating route..." : "↗ Optimize transport"}
              </button>
            </form>
          )}

          {error && <div className="transport-error">{error}</div>}
        </section>

        {result && (
          <>
            <section className="transport-result-banner">
              <div>
                <span className="transport-eyebrow">OPTIMIZATION COMPLETE</span>
                <h2>Transport #{result.transport_id}</h2>
                <p>
                  {result.source_hospital} <span>→</span>{" "}
                  {result.destination_hospital}
                </p>
              </div>
              <span className="transport-status">
                {result.status || "planned"}
              </span>
            </section>

            <section className="transport-metrics">
              <article className="transport-metric">
                <span>Distance</span>
                <strong>{formatNumber(result.distance_km)} km</strong>
                <small>Calculated route distance</small>
              </article>
              <article className="transport-metric">
                <span>Estimated travel</span>
                <strong>{result.estimated_time_minutes ?? "—"} min</strong>
                <small>Backend estimate, not live traffic</small>
              </article>
              <article className="transport-metric">
                <span>Risk probability</span>
                <strong>
                  {Number.isFinite(risk) ? `${formatNumber(risk)}%` : "—"}
                </strong>
                <small>Model-estimated transport risk</small>
              </article>
              <article className="transport-metric">
                <span>Success probability</span>
                <strong>
                  {Number.isFinite(success)
                    ? `${formatNumber(success)}%`
                    : "—"}
                </strong>
                <small>Model estimate</small>
              </article>
            </section>

            <section className="transport-panel">
              <div className="transport-section-heading">
                <div>
                  <h2>Recommended route</h2>
                  <p>{result.algorithm}</p>
                </div>
              </div>

              <div className="transport-route">
                {(result.route || []).map((name, index) => (
                  <div className="transport-route-stop" key={`${name}-${index}`}>
                    <span className="transport-route-number">
                      {index + 1}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <small>
                        {index === 0
                          ? "Departure"
                          : index === result.route.length - 1
                            ? "Destination"
                            : "Route stop"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="transport-panel">
              <div className="transport-section-heading">
                <div>
                  <h2>Bayesian risk analysis</h2>
                  <p>Values returned by your existing backend engine.</p>
                </div>
              </div>
              <div className="transport-analysis-grid">
                {Object.entries(result.bayesian_analysis || {}).map(
                  ([key, value]) => (
                    <div className="transport-analysis-item" key={key}>
                      <span>
                        {key.replaceAll("_", " ")}
                      </span>
                      <strong>
                        {typeof value === "number" ? value : String(value)}
                        {key.includes("probability") ||
                        key.includes("factor")
                          ? (typeof value === "number" ? "%" : "")
                          : ""}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="transport-panel">
              <div className="transport-section-heading">
                <div>
                  <h2>Coordination decision</h2>
                  <p>Recommendation returned by your coordination agent.</p>
                </div>
                <span className="transport-decision">
                  {coordination?.decision || "Not available"}
                </span>
              </div>

              <div className="transport-analysis-grid">
                {Object.entries(coordination || {})
                  .filter(([key]) => key !== "recommended_actions")
                  .map(([key, value]) => (
                    <div className="transport-analysis-item" key={key}>
                      <span>{key.replaceAll("_", " ")}</span>
                      <strong>
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </strong>
                    </div>
                  ))}
              </div>

              {coordination?.recommended_actions?.length > 0 && (
                <div className="transport-actions">
                  <h3>Recommended actions</h3>
                  <ul>
                    {coordination.recommended_actions.map((action, index) => (
                      <li key={`${action}-${index}`}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}

        {!loadingData && organs.length === 0 && (
          <p className="transport-message">
            No available organs found. Register an available organ first.
          </p>
        )}
      </main>
    </div>
  );
}

export default TransportOptimization;
