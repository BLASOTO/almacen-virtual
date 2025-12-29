// 🔴 PEGA AQUÍ TU URL DE APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycbx28dxuUPaRDMHb9_Najve5mGyFjOTYz1iWSy2ccBFXRInLlJBJFH3LCRIj3Bgku-zM/exec";

const grid = document.getElementById("grid");
const details = document.getElementById("details");
const almacenSelect = document.getElementById("almacenSelect");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

refreshBtn.onclick = loadData;
almacenSelect.onchange = loadData;

async function loadData() {
  grid.innerHTML = "Cargando...";
  details.innerHTML = "<h2>Hueco</h2><p>Haz click en un hueco.</p>";

  const almacen = almacenSelect.value;
  const url = `${API_URL}?action=locations&almacen=${almacen}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.ok) {
      grid.innerHTML = "Error al cargar datos";
      return;
    }

    renderGrid(json.data);
  } catch (e) {
    grid.innerHTML = "Error de conexión con Apps Script";
  }
}

function renderGrid(data) {
  grid.innerHTML = "";

  data.forEach(row => {
    const div = document.createElement("div");
    div.className = "cell";

    div.innerHTML = `
      <strong>${row.UBICACIÓN_CÓDIGO}</strong><br>
      ${row.PRODUCTO || "—"}<br>
      ${row.CANTIDAD || 0}
    `;

    div.onclick = () => showDetails(row);
    grid.appendChild(div);
  });
}

function showDetails(row) {
  details.innerHTML = `
    <h2>${row.UBICACIÓN_CÓDIGO}</h2>
    <p><b>Producto:</b> ${row.PRODUCTO || "—"}</p>
    <p><b>Cantidad:</b> ${row.CANTIDAD || 0} ${row.UNIDAD || ""}</p>
    <p><b>Estado:</b>
      <span class="${row.ESTADO === "OK" ? "ok" : "vacio"}">
        ${row.ESTADO}
      </span>
    </p>
  `;
}

// Primera carga
loadData();
