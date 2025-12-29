// ================== CONFIG ==================
const API_URL = "https://script.google.com/macros/s/AKfycbz7AQqdqKSNmoieSJkK92t_uAFiM1OcgRQKRhcoFqjmaf7fIXzqMkLNuMhqW4ZB9qLV/exec";

// ================== HELPERS ==================
function norm(v) {
  return String(v ?? "").toLowerCase().trim();
}

function getCode(row) {
  return row["UBICACIÓN_CÓDIGO"] || row["UBICACION_CODIGO"] || "";
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");

    window[cb] = (data) => {
      delete window[cb];
      script.remove();
      resolve(data);
    };

    script.onerror = () => {
      delete window[cb];
      script.remove();
      reject(new Error("No se pudo cargar Apps Script (JSONP)."));
    };

    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
    document.body.appendChild(script);
  });
}

// ================== DOM ==================
const grid = document.getElementById("grid");
const details = document.getElementById("details");
const almacenSelect = document.getElementById("almacenSelect");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

// ================== UI ==================
function render(rows) {
  grid.innerHTML = "";

  // Orden A->D y 1->4
  const order = { A: 0, B: 1, C: 2, D: 3 };
  rows.sort((a, b) => {
    const fa = String(a.FILA || "").toUpperCase();
    const fb = String(b.FILA || "").toUpperCase();
    const ca = Number(a.COLUMNA) || 0;
    const cb = Number(b.COLUMNA) || 0;
    return (order[fa] ?? 99) - (order[fb] ?? 99) || ca - cb;
  });

  rows.forEach(r => {
    const code = getCode(r) || "SIN_CODIGO";
    const prod = r.PRODUCTO || "—";
    const cant = r.CANTIDAD || 0;
    const uni = r.UNIDAD || "";

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerHTML = `
      <div class="code">${code}</div>
      <div class="meta">${prod} · ${cant} ${uni}</div>
    `;

    cell.onclick = () => {
      details.innerHTML = `
        <h2>Hueco</h2>
        <p><strong>Código:</strong> ${code}</p>
        <p><strong>Producto:</strong> ${prod}</p>
        <p><strong>Cantidad:</strong> ${cant} ${uni}</p>
        <p><strong>Lote:</strong> ${r.LOTE || "—"}</p>
        <p><strong>Estado:</strong> ${r.ESTADO || "—"}</p>
        <p><strong>Observaciones:</strong> ${r.OBSERVACIONES || "—"}</p>
      `;
    };

    grid.appendChild(cell);
  });
}

async function load() {
  try {
    details.innerHTML = "<p>Cargando...</p>";
    grid.innerHTML = "";

    const almacen = almacenSelect.value;
    const q = norm(searchInput.value);

