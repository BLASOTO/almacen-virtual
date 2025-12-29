const API_URL = "https://script.google.com/macros/s/AKfycbxwTBIwv4dpN5_Y3vy8G9RLR8NXMRnmnqFRdTPsGYP6h3d2k08BD_gbkgfNQyjpJGtQ/exec";

const gridEl = document.getElementById("grid");
const detailsEl = document.getElementById("details");
const almacenSelect = document.getElementById("almacenSelect");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

let allLocations = [];

// Normaliza texto
function norm(v) {
  return String(v || "").toLowerCase().trim();
}

// Obtiene ubicaciones del almacén seleccionado
async function fetchLocations(almacen) {
  const res = await fetch(`${API_URL}?action=locations&almacen=${almacen}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Error al cargar datos");
  return json.data;
}

// Dibuja la cuadrícula 4x4
function renderGrid(rows) {
  gridEl.innerHTML = "";

  // Ordenar por fila A-D y columna 1-4
  const order = { A: 1, B: 2, C: 3, D: 4 };

  rows
    .sort((a, b) => {
      if (order[a.FILA] !== order[b.FILA]) {
        return order[a.FILA] - order[b.FILA];
      }
      return a.COLUMNA - b.COLUMNA;
    })
    .forEach(row => {
      const cell = document.createElement("div");
      const estado = norm(row.ESTADO) || "vacio";

      cell.className = `cell ${estado}`;
      cell.innerHTML = `
        <div class="code">${row["UBICACIÓN_CÓDIGO"]}</div>
        <div class="meta">
          ${row.PRODUCTO || "—"} · ${row.CANTIDAD || 0} ${row.UNIDAD || ""}
        </div>
      `;

      cell.addEventListener("click", () => showDetails(row));
      gridEl.appendChild(cell);
    });
}

// Muestra detalles del hueco
function showDetails(row) {
  detailsEl.innerHTML = `
    <p><strong>Código:</strong> ${row["UBICACIÓN_CÓDIGO"]}</p>
    <p><strong>Producto:</strong> ${row.PRODUCTO || "—"}</p>
    <p><strong>Cantidad:</strong> ${row.CANTIDAD || 0} ${row.UNIDAD || ""}</p>
    <p><strong>Lote:</strong> ${row.LOTE || "—"}</p>
    <p><strong>Estado:</strong> <span class="badge">${row.ESTADO}</span></p>
    <p><strong>Observaciones:</strong> ${row.OBSERVACIONES || "—"}</p>
  `;
}

// Filtra por buscador
function applySearch(rows, text) {
  if (!text) return rows;
  return rows.filter(r =>
    norm(r["UBICACIÓN_CÓDIGO"]).includes(norm(text)) ||
    norm(r.PRODUCTO).includes(norm(text)) ||
    norm(r.LOTE).includes(norm(text))
  );
}

// Carga general
async function load() {
  try {
    detailsEl.innerHTML = "<p>Cargando...</p>";
    const almacen = almacenSelect.value;
    const data = await fetchLocations(almacen);
    allLocations = data;

    const filtered = applySearch(allLocations, searchInput.value);
    renderGrid(filtered);

    detailsEl.innerHTML = "<p>Haz click en un hueco.</p>";
  } catch (err) {
    detailsEl.innerHTML = `<p style="color:red">${err.message}</p>`;
  }
}

// Eventos
almacenSelect.addEventListener("change", load);
searchInput.addEventListener("input", load);
refreshBtn.addEventListener("click", load);

// Arranque inicial
load();
