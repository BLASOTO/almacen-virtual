const API_URL = "https://script.google.com/macros/s/AKfycbxwTBIwv4dpN5_Y3vy8G9RLR8NXMRnmnqFRdTPsGYP6h3d2k08BD_gbkgfNQyjpJGtQ/exec";

const grid = document.getElementById("grid");
const details = document.getElementById("details");
const almacenSelect = document.getElementById("almacenSelect");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

function norm(v) { return String(v ?? "").toLowerCase().trim(); }

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

function render(rows) {
  grid.innerHTML = "";
  const order = { A: 0, B: 1, C: 2, D: 3 };

  rows.sort((a, b) => {
    const fa = String(a.FILA || "").toUpperCase();
    const fb = String(b.FILA || "").toUpperCase();
    const ca = Number(a.COLUMNA) || 0;
    const cb = Number(b.COLUMNA) || 0;
    return (order[fa] ?? 99) - (order[fb] ?? 99) || ca - cb;
  });

  rows.forEach(r => {
    const code = r["UBICACIÓN_CÓDIGO"] || r["UBICACION_CODIGO"] || "SIN_CODIGO";
    const prod = r.PRODUCTO || "—";
    const cant = r.CANTIDAD || 0;
    const uni = r.UNIDAD || "";

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerHTML = `<div class="code">${code}</div><div class="meta">${prod} · ${cant} ${uni}</div>`;

    cell.onclick = () => {
      details.innerHTML = `
        <p><strong>Código:</strong> ${code}</p>
        <p><strong>Producto:</strong> ${prod}</p>
        <p><strong>Cantidad:</strong> ${cant} ${uni}</p>
        <p><strong>Lote:</strong> ${r.LOTE || "—"}</p>
        <p><strong>Estado:</strong> ${r.ESTADO || "VACIO"}</p>
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

    // Pedimos al backend ya filtrado (y si no filtra, igual funcionaría)
    const res = await jsonp(`${API_URL}?action=locations&almacen=${encodeURIComponent(almacen)}`);

    if (!res.ok) throw new Error(res.error || "Error");

    let rows = res.data || [];

    if (q) {
      rows = rows.filter(r => {
        const code = norm(r["UBICACIÓN_CÓDIGO"] || r["UBICACION_CODIGO"]);
        const prod = norm(r.PRODUCTO);
        const lote = norm(r.LOTE);
        return code.includes(q) || prod.includes(q) || lote.includes(q);
      });
    }

    render(rows);
    details.innerHTML = "<p>Haz click en un hueco.</p>";
  } catch (err) {
    details.innerHTML = `<p style="color:#b00"><strong>Error:</strong> ${err.message}</p>`;
  }
}

almacenSelect.onchange = load;
searchInput.oninput = load;
refreshBtn.onclick = load;

load();
