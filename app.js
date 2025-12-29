const API_URL = "https://script.google.com/macros/s/AKfycbxwTBIwv4dpN5_Y3vy8G9RLR8NXMRnmnqFRdTPsGYP6h3d2k08BD_gbkgfNQyjpJGtQ/exec";

const gridEl = document.getElementById("grid");
const detailsEl = document.getElementById("details");
const almacenSelect = document.getElementById("almacenSelect");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

let allLocations = [];

function norm(v) {
  return String(v ?? "").toLowerCase().trim();
}

function pick(row, candidates) {
  for (const k of candidates) {
    if (row && row[k] !== undefined && row[k] !== null) return row[k];
  }
  return "";
}

function getRowFields(row) {
  return {
    almacen: pick(row, ["ALMACEN", "almacen"]),
    fila: pick(row, ["FILA", "fila"]),
    columna: pick(row, ["COLUMNA", "columna"]),
    code: pick(row, ["UBICACIÓN_CÓDIGO", "UBICACION_CODIGO", "ubicacion_codigo"]),
    producto: pick(row, ["PRODUCTO", "producto"]),
    cantidad: pick(row, ["CANTIDAD", "cantidad"]),
    unidad: pick(row, ["UNIDAD", "unidad"]),
    lote: pick(row, ["LOTE", "lote"]),
    estado: pick(row, ["ESTADO", "estado"]),
    obs: pick(row, ["OBSERVACIONES", "observaciones"]),
  };
}

async function fetchAllLocations() {
  const url = `${API_URL}?action=locations`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Error al cargar datos");
  return json.data || [];
}

function renderGrid(rows) {
  gridEl.innerHTML = "";

  // si no hay nada, lo mostramos en el panel
  if (!rows.length) {
    detailsEl.innerHTML = `<p style="color:#b00"><strong>No hay datos</strong> para este almacén.</p>`;
    return;
  }

  const order = { A: 1, B: 2, C: 3, D: 4 };

  const mapped = rows.map(r => {
    const f = getRowFields(r);
    return {
      raw: r,
      ...f,
      filaKey: String(f.fila).trim().toUpperCase(),
      colNum: Number(String(f.columna).trim()) || 0,
      estadoKey: norm(f.estado) || "vacio",
      cantNum: Number(String(f.cantidad).replace(",", ".").trim()) || 0,
    };
  });

  mapped.sort((a, b) => {
    const ra = order[a.filaKey] ?? 99;
    const rb = order[b.filaKey] ?? 99;
    if (ra !== rb) return ra - rb;
    return a.colNum - b.colNum;
  });

  for (const item of mapped) {
    const cell = document.createElement("div");
    cell.className = `cell ${item.estadoKey}`;
    cell.innerHTML = `
      <div class="code">${item.code || "SIN_CODIGO"}</div>
      <div class="meta">${item.producto ? item.producto : "—"} · ${item.cantNum} ${item.unidad || ""}</div>
    `;
    cell.addEventListener("click", () => showDetails(item));
    gridEl.appendChild(cell);
  }
}

function showDetails(item) {
  detailsEl.innerHTML = `
    <p><strong>Código:</strong> ${item.code || "—"}</p>
    <p><strong>Producto:</strong> ${item.producto || "—"}</p>
    <p><strong>Cantidad:</strong> ${item.cantNum} ${item.unidad || ""}</p>
    <p><strong>Lote:</strong> ${item.lote || "—"}</p>
    <p><strong>Estado:</strong> <span class="badge">${item.estado || "VACIO"}</span></p>
    <p><strong>Observaciones:</strong> ${item.obs || "—"}</p>
  `;
}

function applySearch(rows, text) {
  const q = norm(text);
  if (!q) return rows;
  return rows.filter(r => {
    const f = getRowFields(r);
    return (
      norm(f.almacen).includes(q) ||
      norm(f.fila).includes(q) ||
      norm(f.columna).includes(q) ||
      norm(f.code).includes(q) ||
      norm(f.producto).includes(q) ||
      norm(f.lote).includes(q)
    );
  });
}

async function load() {
  try {
    detailsEl.innerHTML = "<p>Cargando...</p>";

    // 1) cargar todo (solo la primera vez o si refrescas)
    allLocations = await fetchAllLocations();

    // 2) filtrar por almacen en frontend
    const almacen = almacenSelect.value;
    let rows = allLocations.filter(r => String(pick(r, ["ALMACEN", "almacen"])).trim() === almacen);

    // 3) aplicar búsqueda
    rows = applySearch(rows, searchInput.value);

    // 4) pintar
    renderGrid(rows);

    // si hay datos, deja el panel listo
    if (rows.length) detailsEl.innerHTML = "<p>Haz click en un hueco.</p>";
  } catch (err) {
    detailsEl.innerHTML = `<p style="color:#b00"><strong>Error:</strong> ${err.message}</p>`;
  }
}

almacenSelect.addEventListener("change", load);
searchInput.addEventListener("input", load);
refreshBtn.addEventListener("click", load);

load();
