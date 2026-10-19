
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import {
  getOrgans,
  getRecipients,
  getHospitals,
} from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    organs: 0,
    recipients: 0,
    hospitals: 0,
    transports: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [organsData, recipientsData, hospitalsData] =
          await Promise.all([
            getOrgans(),
            getRecipients(),
            getHospitals(),
          ]);

        if (!active) return;

        const organs = Array.isArray(organsData)
          ? organsData
          : organsData?.organs || [];

        const recipients = Array.isArray(recipientsData)
          ? recipientsData
          : recipientsData?.recipients || [];

        const hospitals = Array.isArray(hospitalsData)
          ? hospitalsData
          : hospitalsData?.hospitals || [];

        setStats({
          organs: organs.filter(
            (organ) =>
              organ.status?.toLowerCase() === "available"
          ).length,

          recipients: recipients.filter(
            (recipient) =>
              recipient.status?.toLowerCase() === "waiting"
          ).length,

          hospitals: hospitals.length,

          // No transport-list endpoint is currently defined in api.js.
          transports: null,
        });
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load dashboard statistics."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <Header
        title="Dashboard"
        subtitle="Overview of the transplant coordination system"
      />

      <main className="dashboard-content">
        {error && (
          <div className="dashboard-error">
            {error}
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            title="Available Organs"
            value={loading ? "..." : stats.organs}
            description="Organs currently available"
            icon="♡"
          />

          <StatCard
            title="Waiting Recipients"
            value={loading ? "..." : stats.recipients}
            description="Recipients awaiting transplant"
            icon="♙"
          />

          <StatCard
            title="Hospitals"
            value={loading ? "..." : stats.hospitals}
            description="Registered hospitals"
            icon="⌂"
          />

          <StatCard
            title="Active Transports"
            value={
              stats.transports === null
                ? "—"
                : stats.transports
            }
            description="Planned transport routes"
            icon="➜"
          />
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h3>Recent Matches</h3>
                <p>Latest organ-recipient recommendations</p>
              </div>

              <button onClick={() => navigate("/matching")}>
                View Matching
              </button>
            </div>

            <div className="empty-state">
              <div className="empty-icon">⇄</div>
              <h4>Match history unavailable</h4>
              <p>
                Open Matching to generate an organ-recipient
                recommendation. Recent match history can be
                connected when a match-list API is available.
              </p>
              <button
                className="dashboard-action-btn"
                onClick={() => navigate("/matching")}
              >
                Find a Match
              </button>
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h3>AI Engines</h3>
                <p>Configured decision-support components</p>
              </div>
            </div>

            <div className="engine-list">
              {[
                "Knowledge Engine",
                "CSP Engine",
                "A* / UCS Engine",
                "Bayesian Engine",
                "Coordination Agent",
              ].map((engine) => (
                <div className="engine" key={engine}>
                  <span className="engine-dot"></span>
                  <span>{engine}</span>
                  <strong>Configured</strong>
                </div>
              ))}
            </div>

            <p className="engine-note">
              These labels indicate configured components, not
              live health checks of each engine.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
