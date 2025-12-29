// ================== CONFIG ==================
const API_URL = "https://script.google.com/macros/s/AKfycbz7AQqdqKSNmoieSJkK92t_uAFiM1OcgRQKRhcoFqjmaf7fIXzqMkLNuMhqW4ZB9qLV/exec";

// ================== STATE ==================
let locations = [];
let selected = null;

// ================== LOAD DATA (JSONP) ==================
function loadLocations() {
  const almacen = document.getElementById("almacen").value;
  const callbackName = "cb_" + Date.now();

  window[callbackName] = function (res) {
    delete window[callbackName];
    document.body.removeChild(script);

    if (!res.ok) {
      showError("Error cargando datos");
      return;
    }

    locations = res.data;
    renderGrid();
  };

  const script = document.createElement("script");
  script.src = `${API_URL}?action=locations&almacen=${encodeURIComponent(almacen)}&callback=${callbackName}`;
  script.onerror = () => showError("No se pudo cargar Apps Script (JSONP)");
  document.body.appendChild(script);
}

// ================== RENDER GRID ==================
function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  locations.forEach(loc => {
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = `${loc.UBICACIÓN_CÓDIGO}\n${loc.PRODUCTO || "—"} · ${loc.CANTIDAD || 0}`;
    div.onclick = () => showDetails(loc);
    grid.appendChild(div);
  });
}

// ================== DETAILS ==================
function showDetails(loc) {
  selected = loc;
  const d = document.getElementById("details");

  d.innerHTML = `
    <h3>${loc.UBICACIÓN_CÓDIGO}</h3>
    <p><b>Producto:</b> ${loc.PRODUCTO || "-"}</p>
    <p><b>Cantidad:</b> ${loc.CANTIDAD || 0} ${loc.UNIDAD || ""}</p>
    <p><b>Estado:</b> ${loc.ESTADO || "-"}</p>
    <p><b>Lote:</b> ${loc.LOTE || "-"}</p>
  `;
}

// ================== ERROR ==================
function showError(msg) {
  const d = document.getElementById("details");
  d.innerHTML = `<p style="color:red">${msg}</p>`;
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refresh").onclick = loadLocations;
  loadLocations();
});

