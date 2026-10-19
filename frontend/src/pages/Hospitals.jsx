
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { getHospitals, createHospital } from "../services/api";
import "./Hospitals.css";

const initialForm = {
  name: "",
  city: "",
  latitude: "",
  longitude: "",
  contact_number: "",
};

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadHospitals() {
    try {
      setError("");
      const data = await getHospitals();
      setHospitals(data);
    } catch (err) {
      setError(err.message || "Unable to load hospitals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHospitals();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.city.trim() ||
      form.latitude.trim() === "" ||
      form.longitude.trim() === ""
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    const hospitalData = {
      name: form.name.trim(),
      city: form.city.trim(),
      latitude,
      longitude,
      contact_number: form.contact_number.trim() || null,
    };

    try {
      setSaving(true);

      await createHospital(hospitalData);

      setForm(initialForm);
      setSuccess("Hospital registered successfully!");

      await loadHospitals();
    } catch (err) {
      setError(err.message || "Failed to register hospital.");
    } finally {
      setSaving(false);
    }
  }

  const uniqueCities = new Set(
    hospitals.map((hospital) => hospital.city.trim().toLowerCase())
  ).size;

  return (
    <div className="page">
      <Header
        title="Hospital Management"
        subtitle="Register hospitals and manage transplant center locations"
      />

      <main className="hospitals-content">
        <section className="hospital-stats">
          <div className="hospital-stat-card">
            <span className="hospital-stat-icon">🏥</span>
            <div>
              <p>Total Hospitals</p>
              <h2>{hospitals.length}</h2>
            </div>
          </div>

          <div className="hospital-stat-card">
            <span className="hospital-stat-icon">📍</span>
            <div>
              <p>Cities Covered</p>
              <h2>{uniqueCities}</h2>
            </div>
          </div>
        </section>

        <section className="hospital-panel">
          <div className="hospital-panel-heading">
            <div>
              <h2>Register a Hospital</h2>
              <p>Add hospital details and geographic coordinates.</p>
            </div>
            <span className="hospital-heading-icon">＋</span>
          </div>

          {error && (
            <div className="hospital-message hospital-error">
              {error}
            </div>
          )}

          {success && (
            <div className="hospital-message hospital-success">
              {success}
            </div>
          )}

          <form className="hospital-form" onSubmit={handleSubmit}>
            <div className="hospital-field">
              <label htmlFor="hospital-name">Hospital Name *</label>
              <input
                id="hospital-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Apollo Hospital"
                required
              />
            </div>

            <div className="hospital-field">
              <label htmlFor="hospital-city">City *</label>
              <input
                id="hospital-city"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Chennai"
                required
              />
            </div>

            <div className="hospital-field">
              <label htmlFor="hospital-latitude">Latitude *</label>
              <input
                id="hospital-latitude"
                name="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                value={form.latitude}
                onChange={handleChange}
                placeholder="e.g. 13.0827"
                required
              />
            </div>

            <div className="hospital-field">
              <label htmlFor="hospital-longitude">Longitude *</label>
              <input
                id="hospital-longitude"
                name="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                value={form.longitude}
                onChange={handleChange}
                placeholder="e.g. 80.2707"
                required
              />
            </div>

            <div className="hospital-field hospital-full-width">
              <label htmlFor="hospital-contact">
                Contact Number
              </label>
              <input
                id="hospital-contact"
                name="contact_number"
                type="tel"
                value={form.contact_number}
                onChange={handleChange}
                placeholder="Hospital contact number (optional)"
              />
            </div>

            <div className="hospital-form-actions hospital-full-width">
              <button
                type="button"
                className="hospital-reset-btn"
                onClick={() => {
                  setForm(initialForm);
                  setError("");
                  setSuccess("");
                }}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="hospital-submit-btn"
                disabled={saving}
              >
                {saving ? "Registering..." : "Register Hospital"}
              </button>
            </div>
          </form>
        </section>

        <section className="hospital-panel">
          <div className="hospital-panel-heading">
            <div>
              <h2>Registered Hospitals</h2>
              <p>Hospitals currently stored in your database.</p>
            </div>
            <span className="hospital-count">
              {hospitals.length} hospitals
            </span>
          </div>

          {loading ? (
            <p className="hospital-empty">Loading hospitals...</p>
          ) : hospitals.length === 0 ? (
            <div className="hospital-empty">
              <span>🏥</span>
              <h3>No hospitals registered yet</h3>
              <p>Register your first hospital using the form above.</p>
            </div>
          ) : (
            <div className="hospital-table-wrapper">
              <table className="hospital-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hospital</th>
                    <th>City</th>
                    <th>Coordinates</th>
                    <th>Contact</th>
                  </tr>
                </thead>

                <tbody>
                  {hospitals.map((hospital) => (
                    <tr key={hospital.id}>
                      <td>HSP-{String(hospital.id).padStart(4, "0")}</td>
                      <td className="hospital-name-cell">
                        {hospital.name}
                      </td>
                      <td>{hospital.city}</td>
                      <td>
                        {hospital.latitude}, {hospital.longitude}
                      </td>
                      <td>{hospital.contact_number || "Not provided"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
