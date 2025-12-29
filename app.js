// 1) Pega aquí tu URL /exec de Apps Script
const API_URL = "PEGA_AQUI_TU_URL_EXEC";

// DOM
const grid = document.getElementById("grid");
const details = document.getElementById("details");
const almacenSelect = document.getElementById("almacenSelect");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const modeSelect = document.getElementById("modeSelect");
const dateSelect = document.getElementById("dateSelect");
const statusEl = document.getElementById("status");

function norm(v) { return String(v ?? "").toLowerCase().trim(); }

function getCode(r) {
  return r["UBICACIÓN_CÓDIGO"] || r["UBICACION_CODIGO"] || r["UBICACIÓN_CODIGO"] || r["UBICACION"] || "";
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
    const code = getCode(r) || "SIN_CODIGO";
    const prod = r.PRODUCTO || "—";
    const cant = r.CANTIDAD || 0;
    const uni = r.UNIDAD || "";
    const estado = r.ESTADO || "—";

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerHTML = `
      <div class="code">${code}</div>
      <div class="meta">${prod} · ${cant} ${uni}</div>
      <div class="meta">Estado: ${estado}</div>
    `;

    cell.onclick = () => {
      details.innerHTML = `
        <h2>Hueco</h2>
        <p><strong>Código:</strong> ${code}</p>
        <p><strong>Producto:</strong> ${prod}</p>
        <p><strong>Cantidad:</strong> ${cant} ${uni}</p>
        <p><strong>Lote:</strong> ${r.LOTE || "—"}</p>
        <p><strong>Fecha entrada:</strong> ${r.FECHA_ENTRADA || "—"}</p>
        <p><strong>Estado:</strong> ${estado}</p>
        <p><strong>Observaciones:</strong> ${r.OBSERVACIONES || "—"}</p>
        <p><strong>Última actualización:</strong> ${r.ULTIMA_ACTUALIZACION || r.ULTIMA_ACTUALIZACION || "—"}</p>
      `;
    };

    grid.appendChild(cell);
  });

  details.innerHTML = "<h2>Hueco</h2><p>Haz click en un hueco.</p>";
}

async function loadHistoryDates() {
  const res = await jsonp(`${API_URL}?action=history_dates`);
  if (!res.ok) throw new Error(res.error || "Error cargando fechas");
  dateSelect.innerHTML = `<option value="">Selecciona una fecha...</option>` +
    res.dates.map(d => `<option value="${d}">${d}</option>`).join("");
}

async function load() {
  try {
    statusEl.textContent = "Cargando...";
    grid.innerHTML = "";
    details.innerHTML = "<h2>Hueco</h2><p>Cargando...</p>";

    const almacen = almacenSelect.value;
    const q = norm(searchInput.value);

    const mode = modeSelect.value;

    let res;
    if (mode === "today") {
      dateSelect.disabled = true;
      res = await jsonp(`${API_URL}?action=locations&almacen=${encodeURIComponent(almacen)}`);
    } else {
      dateSelect.disabled = false;
      const fecha = dateSelect.value;
      if (!fecha) {
        statusEl.textContent = "Elige una fecha.";
        grid.innerHTML = "";
        details.innerHTML = "<h2>Hueco</h2><p>Selecciona una fecha del histórico.</p>";
        return;
      }
      res = await jsonp(`${API_URL}?action=history&fecha=${encodeURIComponent(fecha)}&almacen=${encodeURIComponent(almacen)}`);
    }

    if (!res || !res.ok) throw new Error(res?.error || "Respuesta inválida");

    let rows = res.data || [];
    if (q) {
      rows = rows.filter(r => {
        const code = norm(getCode(r));
        const prod = norm(r.PRODUCTO);
        const lote = norm(r.LOTE);
        return code.includes(q) || prod.includes(q) || lote.includes(q);
      });
    }

    render(rows);
    statusEl.textContent = `OK (${rows.length} huecos)`;
  } catch (err) {
    statusEl.textContent = "";
    details.innerHTML = `<h2>Hueco</h2><p style="color:red"><strong>Error:</strong> ${err.message}</p>`;
  }
}

modeSelect.addEventListener("change", async () => {
  if (modeSelect.value === "history") {
    await loadHistoryDates();
  }
  load();
});

dateSelect.addEventListener("change", load);
almacenSelect.addEventListener("change", load);
searchInput.addEventListener("input", load);
refreshBtn.addEventListener("click", load);

// Init
(async () => {
  if (modeSelect.value === "history") await loadHistoryDates();
  load();
})();
