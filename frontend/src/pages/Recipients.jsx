
import { useEffect, useState } from "react";
import Header from "../components/Header";
import {
  getRecipients,
  createRecipient,
  getHospitals,
} from "../services/api";
import "./Recipients.css";

const initialForm = {
  name: "",
  age: "",
  organ_type: "Kidney",
  blood_group: "O+",
  urgency_level: "3",
  pra_percentage: "0",
  hospital_id: "",
};

function Recipients() {
  const [recipients, setRecipients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [hospitalLoading, setHospitalLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load recipients from the backend
  async function loadRecipients() {
    try {
      setError("");
      const data = await getRecipients();
      setRecipients(data);
    } catch (err) {
      setError(err.message || "Unable to load recipients.");
    } finally {
      setLoading(false);
    }
  }

  // Load hospitals from the backend
  async function loadHospitals() {
    try {
      const data = await getHospitals();
      setHospitals(data);
    } catch (err) {
      setError(err.message || "Unable to load hospitals.");
    } finally {
      setHospitalLoading(false);
    }
  }

  useEffect(() => {
    loadRecipients();
    loadHospitals();
  }, []);

  // Match a hospital ID with its name and city
  function getHospitalName(hospitalId) {
    const hospital = hospitals.find(
      (item) => Number(item.id) === Number(hospitalId)
    );

    return hospital
      ? `${hospital.name}, ${hospital.city}`
      : `Hospital ID: ${hospitalId}`;
  }

  // Handle form inputs
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Register a recipient
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const recipientData = {
      name: form.name.trim(),
      age: Number(form.age),
      organ_type: form.organ_type,
      blood_group: form.blood_group,
      urgency_level: Number(form.urgency_level),
      pra_percentage: Number(form.pra_percentage),
      hospital_id: Number(form.hospital_id),
    };

    if (!recipientData.name) {
      setError("Please enter the recipient's name.");
      return;
    }

    if (
      !Number.isInteger(recipientData.age) ||
      recipientData.age < 1 ||
      recipientData.age > 120
    ) {
      setError("Age must be between 1 and 120.");
      return;
    }

    if (
      !Number.isInteger(recipientData.urgency_level) ||
      recipientData.urgency_level < 1 ||
      recipientData.urgency_level > 5
    ) {
      setError("Urgency level must be between 1 and 5.");
      return;
    }

    if (
      !Number.isFinite(recipientData.pra_percentage) ||
      recipientData.pra_percentage < 0 ||
      recipientData.pra_percentage > 100
    ) {
      setError("PRA percentage must be between 0 and 100.");
      return;
    }

    const selectedHospital = hospitals.find(
      (hospital) => Number(hospital.id) === recipientData.hospital_id
    );

    if (!selectedHospital) {
      setError("Please select a valid registered hospital.");
      return;
    }

    setSaving(true);

    try {
      await createRecipient(recipientData);

      setForm(initialForm);
      setSuccess("Recipient registered successfully!");

      await loadRecipients();
    } catch (err) {
      setError(err.message || "Unable to register recipient.");
    } finally {
      setSaving(false);
    }
  }

  const urgentCount = recipients.filter(
    (recipient) => recipient.urgency_level >= 4
  ).length;

  const waitingCount = recipients.filter(
    (recipient) =>
      recipient.status?.toLowerCase() === "waiting"
  ).length;

  return (
    <div className="page">
      <Header
        title="Recipient Management"
        subtitle="Register recipients and manage transplant waiting lists"
      />

      <main className="recipients-content">
        {/* Statistics */}
        <section className="recipient-stats">
          <div className="recipient-stat-card">
            <span>Total Recipients</span>
            <h2>{recipients.length}</h2>
            <p>Registered recipients</p>
          </div>

          <div className="recipient-stat-card">
            <span>Waiting List</span>
            <h2>{waitingCount}</h2>
            <p>Awaiting transplantation</p>
          </div>

          <div className="recipient-stat-card">
            <span>High Urgency</span>
            <h2>{urgentCount}</h2>
            <p>Urgency level 4 or 5</p>
          </div>
        </section>

        {/* Registration form */}
        <section className="recipient-form-card">
          <div className="recipient-section-heading">
            <div>
              <h2>Register Recipient</h2>
              <p>
                Enter the recipient's medical and hospital details.
              </p>
            </div>

            <span className="recipient-heading-icon">＋</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="recipient-form-grid">
              <div className="recipient-field">
                <label htmlFor="recipient-name">Full Name</label>
                <input
                  id="recipient-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter recipient name"
                  required
                />
              </div>

              <div className="recipient-field">
                <label htmlFor="recipient-age">Age</label>
                <input
                  id="recipient-age"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  required
                />
              </div>

              <div className="recipient-field">
                <label htmlFor="recipient-organ">Required Organ</label>
                <select
                  id="recipient-organ"
                  name="organ_type"
                  value={form.organ_type}
                  onChange={handleChange}
                  required
                >
                  <option value="Kidney">Kidney</option>
                  <option value="Liver">Liver</option>
                  <option value="Heart">Heart</option>
                  <option value="Lung">Lung</option>
                  <option value="Pancreas">Pancreas</option>
                  <option value="Cornea">Cornea</option>
                </select>
              </div>

              <div className="recipient-field">
                <label htmlFor="recipient-blood">Blood Group</label>
                <select
                  id="recipient-blood"
                  name="blood_group"
                  value={form.blood_group}
                  onChange={handleChange}
                  required
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                    (group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="recipient-field">
                <label htmlFor="recipient-urgency">
                  Urgency Level (1–5)
                </label>
                <select
                  id="recipient-urgency"
                  name="urgency_level"
                  value={form.urgency_level}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1 - Low</option>
                  <option value="2">2 - Moderate-Low</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - High</option>
                  <option value="5">5 - Critical</option>
                </select>
              </div>

              <div className="recipient-field">
                <label htmlFor="recipient-pra">
                  PRA Percentage (%)
                </label>
                <input
                  id="recipient-pra"
                  name="pra_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.pra_percentage}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Dynamic hospital dropdown */}
              <div className="recipient-field recipient-hospital-field">
                <label htmlFor="recipient-hospital">
                  Select Hospital
                </label>

                <select
                  id="recipient-hospital"
                  name="hospital_id"
                  value={form.hospital_id}
                  onChange={handleChange}
                  required
                  disabled={hospitalLoading || hospitals.length === 0}
                >
                  <option value="">
                    {hospitalLoading
                      ? "Loading hospitals..."
                      : hospitals.length === 0
                        ? "No hospitals available"
                        : "Choose a hospital"}
                  </option>

                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name} — {hospital.city}
                    </option>
                  ))}
                </select>

                <small>
                  Select a registered hospital from the list.
                </small>
              </div>
            </div>

            {error && (
              <div
                className="recipient-message recipient-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="recipient-message recipient-success"
                role="status"
              >
                {success}
              </div>
            )}

            <div className="recipient-form-actions">
              <button
                type="button"
                className="recipient-reset-btn"
                onClick={() => {
                  setForm(initialForm);
                  setError("");
                  setSuccess("");
                }}
              >
                Reset
              </button>

              <button
                type="submit"
                className="recipient-submit-btn"
                disabled={saving || hospitalLoading || hospitals.length === 0}
              >
                {saving ? "Registering..." : "＋ Register Recipient"}
              </button>
            </div>
          </form>
        </section>

        {/* Recipient table */}
        <section className="recipient-list-card">
          <div className="recipient-section-heading">
            <div>
              <h2>Registered Recipients</h2>
              <p>Recipient records retrieved from your database.</p>
            </div>

            <button
              className="recipient-refresh-btn"
              type="button"
              onClick={loadRecipients}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="recipient-empty">
              Loading recipients...
            </div>
          ) : recipients.length === 0 ? (
            <div className="recipient-empty">
              <span>♧</span>
              <h3>No recipients registered yet</h3>
              <p>Register your first recipient using the form above.</p>
            </div>
          ) : (
            <div className="recipient-table-wrapper">
              <table className="recipient-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Recipient</th>
                    <th>Age</th>
                    <th>Required Organ</th>
                    <th>Blood Group</th>
                    <th>Urgency</th>
                    <th>PRA</th>
                    <th>Hospital</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recipients.map((recipient) => (
                    <tr key={recipient.id}>
                      <td>
                        REC-{String(recipient.id).padStart(4, "0")}
                      </td>

                      <td className="recipient-name-cell">
                        {recipient.name}
                      </td>

                      <td>{recipient.age}</td>
                      <td>{recipient.organ_type}</td>

                      <td>
                        <span className="recipient-blood-badge">
                          {recipient.blood_group}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`recipient-urgency urgency-${recipient.urgency_level}`}
                        >
                          {recipient.urgency_level}/5
                        </span>
                      </td>

                      <td>{recipient.pra_percentage}%</td>

                      <td>
                        {getHospitalName(recipient.hospital_id)}
                      </td>

                      <td>
                        <span className="recipient-status">
                          {recipient.status}
                        </span>
                      </td>
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

export default Recipients;
