const API_BASE_URL = "http://localhost:8000";

export async function getOrgans() {
  const response = await fetch(`${API_BASE_URL}/organs/`);

  if (!response.ok) {
    throw new Error("Failed to fetch organs");
  }

  return response.json();
}

export async function createOrgan(organData) {
  const response = await fetch(`${API_BASE_URL}/organs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(organData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create organ");
  }

  return response.json();
}


export async function getRecipients() {
  const response = await fetch(`${API_BASE_URL}/recipients/`);

  if (!response.ok) {
    throw new Error("Failed to fetch recipients");
  }

  return response.json();
}

export async function createRecipient(recipientData) {
  const response = await fetch(`${API_BASE_URL}/recipients/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipientData),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      Array.isArray(error.detail)
        ? error.detail.map((item) => item.msg).join(", ")
        : error.detail || "Failed to register recipient"
    );
  }

  return response.json();
}


export async function getHospitals() {
  const response = await fetch(`${API_BASE_URL}/hospitals/`);

  if (!response.ok) {
    throw new Error("Failed to fetch hospitals");
  }

  return response.json();
}

export async function createHospital(hospitalData) {
  const response = await fetch(`${API_BASE_URL}/hospitals/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(hospitalData),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      Array.isArray(error.detail)
        ? error.detail.map((item) => item.msg).join(", ")
        : error.detail || "Failed to register hospital"
    );
  }

  return response.json();
}

export async function findBestMatch(organId) {
  const response = await fetch(
    `${API_BASE_URL}/matching/find-best-match/${organId}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : "Failed to find the best match"
    );
  }

  return response.json();
}

export async function getAvailableOrgans() {
  const response = await fetch(`${API_BASE_URL}/organs/`);

  if (!response.ok) {
    throw new Error("Failed to fetch organs");
  }

  return response.json();
}



export async function optimizeTransportAStar(organId, destinationHospitalId) {
  const response = await fetch(
    `${API_BASE_URL}/transport/optimize/${organId}/${destinationHospitalId}`,
    { method: "POST" }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : "A* transport optimization failed."
    );
  }

  return response.json();
}

export async function optimizeTransportUCS(organId, destinationHospitalId) {
  const response = await fetch(
    `${API_BASE_URL}/transport/ucs/${organId}/${destinationHospitalId}`,
    { method: "POST" }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : "UCS transport optimization failed."
    );
  }

  return response.json();
}
