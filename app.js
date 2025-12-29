const API_URL = "https://script.google.com/macros/s/AKfycbx28dxuUPaRDMHb9_Najve5mGyFjOTYz1iWSy2ccBFXRInLlJBJFH3LCRIj3Bgku-zM/exec";

const grid = document.getElementById("grid");
const details = document.getElementById("details");
const almacenSelect = document.getElementById("almacenSelect");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const statusEl = document.getElementById("status");

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
      reject(new Error("No se pudo cargar Apps Script"));
    };

    script.src = url + "?callback=" + cb;
    document.body.appendChild(script);
  });
}

function render(rows) {
  grid.innerHTML = "";
  rows.forEach(r => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerHTML = `
      <div class="code">${r["UBICACIÓN_CÓDIGO"]}</div>
      <div class="meta">${r.PRODUCTO || "—"} · ${r.CANTIDAD || 0} ${r.UNIDAD || ""}</div>
      <div class="meta">Estado: ${r.ESTADO}</div>
    `;
    cell.onclick = () => {
      details.innerHTML = `
        <h2>Hueco</h2>
        <p><strong>Código:</strong> ${r["UBICACIÓN_CÓDIGO"]}</p>
        <p><strong>Producto:</strong> ${r.PRODUCTO || "—"}</p>
        <p><strong>Cantidad:</strong> ${r.CANTIDAD || 0} ${r.UNIDAD || ""}</p>
        <p><strong>Estado:</strong> ${r.ESTADO}</p>
        <p><strong>Observaciones:</strong> ${r.OBSERVACIONES || "—"}</p>
      `;
    };
    grid.appendChild(cell);
  });
}

async function load() {
  try {
    statusEl.textContent = "Cargando…";
    const almacen = almacenSelect.value;
    const res = await jsonp(`${API_URL}?action=locations&almacen=${almacen}`);
    if (!res.ok) throw new Error(res.error);
    render(res.data);
    statusEl.textContent = `OK (${res.data.length} huecos)`;
  } catch (e) {
    details.innerHTML = `<p style="color:red">${e.message}</p>`;
    statusEl.textContent = "Error";
  }
}

almacenSelect.addEventListener("change", load);
refreshBtn.addEventListener("click", load);

load();
