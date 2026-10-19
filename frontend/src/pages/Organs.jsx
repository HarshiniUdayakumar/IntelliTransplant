import { useEffect, useState } from "react";
import Header from "../components/Header";
import { getOrgans, createOrgan } from "../services/api";
import "./Organs.css";

function Organs() {
  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    organ_type: "",
    blood_group: "",
    donor_name: "",
    donor_contact: "",
    hospital_id: "",
  });

  const loadOrgans = async () => {
    try {
      setLoading(true);

      const data = await getOrgans();

      setOrgans(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgans();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await createOrgan({
        ...form,
        hospital_id: Number(form.hospital_id),
      });

      setMessage("Organ added successfully.");

      setForm({
        organ_type: "",
        blood_group: "",
        donor_name: "",
        donor_contact: "",
        hospital_id: "",
      });

      await loadOrgans();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page">
      <Header
        title="Organ Management"
        subtitle="Register and monitor available organs"
      />

      <main className="organs-content">

        {/* Add Organ Section */}
        <section className="organ-form-card">
          <div className="section-heading">
            <div>
              <h2>Add New Organ</h2>
              <p>Register an available donor organ</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="organ-form">

            {/* Organ Type */}
            <div className="form-group">
              <label>Organ Type</label>

              <select
                name="organ_type"
                value={form.organ_type}
                onChange={handleChange}
                required
              >
                <option value="">Select organ</option>
                <option value="Kidney">Kidney</option>
                <option value="Liver">Liver</option>
                <option value="Heart">Heart</option>
                <option value="Lung">Lung</option>
                <option value="Pancreas">Pancreas</option>
              </select>
            </div>

            {/* Blood Group */}
            <div className="form-group">
              <label>Blood Group</label>

              <select
                name="blood_group"
                value={form.blood_group}
                onChange={handleChange}
                required
              >
                <option value="">Select blood group</option>
                <option value="O-">O-</option>
                <option value="O+">O+</option>
                <option value="A-">A-</option>
                <option value="A+">A+</option>
                <option value="B-">B-</option>
                <option value="B+">B+</option>
                <option value="AB-">AB-</option>
                <option value="AB+">AB+</option>
              </select>
            </div>

            {/* Donor Name */}
            <div className="form-group">
              <label>Donor Name</label>

              <input
                type="text"
                name="donor_name"
                value={form.donor_name}
                onChange={handleChange}
                placeholder="Enter donor name"
                required
              />
            </div>

            {/* Donor Contact */}
            <div className="form-group">
              <label>Donor Contact</label>

              <input
                type="tel"
                name="donor_contact"
                value={form.donor_contact}
                onChange={handleChange}
                placeholder="Enter contact number"
                pattern="[0-9]{10}"
                maxLength="10"
                required
              />
            </div>

            {/* Hospital ID */}
            <div className="form-group">
              <label>Hospital ID</label>

              <input
                type="number"
                name="hospital_id"
                value={form.hospital_id}
                onChange={handleChange}
                placeholder="Enter hospital ID"
                min="1"
                required
              />
            </div>

            <button type="submit" className="add-organ-btn">
              + Add Organ
            </button>

          </form>

          {message && (
            <div className="organ-message">
              {message}
            </div>
          )}
        </section>

        {/* Registered Organs Section */}
        <section className="organ-list-card">

          <div className="section-heading">
            <div>
              <h2>Registered Organs</h2>
              <p>Currently registered organs in the system</p>
            </div>

            <span className="organ-count">
              {organs.length} organs
            </span>
          </div>

          {loading ? (
            <div className="table-message">
              Loading organs...
            </div>
          ) : organs.length === 0 ? (
            <div className="table-message">
              No organs registered yet.
            </div>
          ) : (
            <div className="table-container">

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Organ</th>
                    <th>Blood Group</th>
                    <th>Donor ID</th>
                    <th>Donor Name</th>
                    <th>Contact</th>
                    <th>Hospital</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {organs.map((organ) => (
                    <tr key={organ.id}>

                      <td>
                        #{organ.id}
                      </td>

                      <td>
                        <strong>{organ.organ_type}</strong>
                      </td>

                      <td>
                        <span className="blood-badge">
                          {organ.blood_group}
                        </span>
                      </td>

                      <td>
                        <span className="donor-id">
                          {organ.donor_id}
                        </span>
                      </td>

                      <td>
                        {organ.donor_name || "—"}
                      </td>

                      <td>
                        {organ.donor_contact || "—"}
                      </td>

                      <td>
                        Hospital #{organ.hospital_id}
                      </td>

                      <td>
                        <span className="status-badge">
                          {organ.status}
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

export default Organs;