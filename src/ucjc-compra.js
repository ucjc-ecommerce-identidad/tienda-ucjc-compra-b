// Compra B: parte del código de Compra A (tienda-ucjc-compra/tienda-ucjc-compra, gh-pages v0.2.0/remote.js)
// y lo mejora. Misma etiqueta y mismos eventos @1; cambia el aspecto y se corrigen fallos.
const EVT_ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const EVT_SES = 'ucjc:identidad:sesion-cambiada@1';
const EVT_PED = 'ucjc:compra:pedido-confirmado@1';
// Black Friday (contrato en `propuesto` desde el 23/11): solo se escucha para mostrar un aviso.
// No cambia el carrito, los precios ni el pedido-confirmado@1.
const EVT_CAMP = 'ucjc:descubrimiento:campana-cambiada@1';

const euros = (n) => `${n.toFixed(2).replace('.', ',')} €`;
// El nombre del producto viene de otra pieza: se escapa antes de meterlo en innerHTML.
const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const css = `
  :host { display:block; font:16px/1.5 Arial,Helvetica,sans-serif; color:#222; }
  header { background:#1f3a63; color:#fff; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; }
  header h1 { margin:0; font-size:20px; }
  .chip { font-size:13px; padding:2px 10px; border-radius:999px; background:#e3f1e7; color:#14532d; font-weight:700; }
  .chip.sin { background:#ffe7c2; color:#6b3d00; }
  main { max-width:640px; margin:24px auto; padding:0 16px; }
  ol.pasos { display:flex; gap:6px; list-style:none; padding:0; margin:0 0 14px; font-size:13px; }
  ol.pasos li { flex:1; text-align:center; padding:4px; border-radius:6px; background:#eef1f6; color:#555; }
  ol.pasos li.hecho { background:#1f3a63; color:#fff; font-weight:700; }
  h2 { font-size:20px; margin:0 0 4px; }
  .sub { margin:0 0 16px; color:#555; font-size:14px; }
  .box { background:#fff; border:1px solid #ccc; border-radius:10px; padding:16px; }
  .lista { max-height:240px; overflow-y:auto; border-bottom:1px solid #eee; }
  table { width:100%; border-collapse:collapse; }
  th { position:sticky; top:0; background:#fff; text-align:left; font-size:13px; color:#555; border-bottom:1px solid #d5d9e0; padding:6px 4px; }
  td { padding:8px 4px; border-bottom:1px solid #eee; vertical-align:middle; }
  .r { text-align:right; }
  .ud { display:block; font-size:12px; color:#666; }
  .cant { display:inline-flex; align-items:center; gap:6px; }
  .cant button { width:30px; height:30px; padding:0; border-radius:50%; font-size:16px; line-height:1; }
  .quitar { padding:2px 8px; font-size:13px; }
  .vacio { color:#555; font-style:italic; text-align:center; padding:18px 4px; }
  .total { text-align:right; font-size:18px; margin:14px 0; }
  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  button { font:inherit; font-size:15px; padding:8px 16px; border:1px solid #c4c4c4; border-radius:8px; background:#ececec; color:#222; cursor:pointer; }
  button.main { background:#1f3a63; color:#fff; border-color:#1f3a63; margin-left:auto; }
  button:disabled { background:#e6e6e6; color:#6b6b6b; border-color:#d0d0d0; cursor:not-allowed; }
  button:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }
  .motivo { margin:10px 0 0; font-size:14px; color:#6b3d00; text-align:right; }
  .campana { margin:0 0 14px; padding:10px 14px; border-radius:8px; background:#111; color:#ffd400; font-weight:700; text-align:center; }
  .ok { margin:12px 0 0; font-size:14px; color:#1d6b2f; min-height:1.2em; }
`;

class UcjcCompra extends HTMLElement {
  #lineas = [];
  #usuarioId = null;
  #flash = '';
  #campana = null; // { codigo, etiqueta } mientras haya una campaña encendida

  #onAdd = (e) => {
    const d = e.detail || {};
    if (!d.productoId) return;
    const cantidad = Math.max(1, Number(d.cantidad) || 1);
    // Mejora: el mismo producto suma cantidad en su línea en vez de repetir filas.
    const existente = this.#lineas.find((l) => l.productoId === String(d.productoId));
    if (existente) existente.cantidad += cantidad;
    else
      this.#lineas.push({
        productoId: String(d.productoId),
        nombre: String(d.nombre ?? 'Producto'),
        precio: Number(d.precio) || 0,
        cantidad,
      });
    this.#flash = `Añadido: ${d.nombre || d.productoId}`;
    this.#pintar();
  };

  #onSes = (e) => {
    const d = e.detail || {};
    const antes = this.#usuarioId;
    this.#usuarioId = d.autenticado === true && d.usuario ? d.usuario.id ?? null : null;
    // Corrección: al cambiar de usuario no se deja a la vista el pedido confirmado por el anterior.
    if (antes !== this.#usuarioId) this.#flash = '';
    this.#pintar();
  };

  #onCamp = (e) => {
    const d = e.detail || {};
    // Payload que no cumple el contrato (activa no booleana): se ignora y se queda como estaba.
    if (typeof d.activa !== 'boolean') return;
    this.#campana = d.activa
      ? { codigo: String(d.codigo ?? ''), etiqueta: String(d.etiqueta || d.codigo || 'Campaña activa') }
      : null;
    this.#pintar();
  };

  connectedCallback() {
    // Corrección: el shell puede quitar y volver a poner el elemento; attachShadow dos veces lanza error.
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    window.addEventListener(EVT_ADD, this.#onAdd);
    window.addEventListener(EVT_SES, this.#onSes);
    window.addEventListener(EVT_CAMP, this.#onCamp);
    this.#pintar();
  }

  disconnectedCallback() {
    window.removeEventListener(EVT_ADD, this.#onAdd);
    window.removeEventListener(EVT_SES, this.#onSes);
    window.removeEventListener(EVT_CAMP, this.#onCamp);
  }

  #total() {
    return this.#lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  }

  // Mejora: el botón desactivado dice por qué (null si se puede confirmar).
  #motivo() {
    if (!this.#lineas.length) return 'El carrito está vacío: añade un producto del catálogo para poder confirmar.';
    if (!this.#usuarioId) return 'Inicia sesión en Identidad para confirmar el pedido.';
    return null;
  }

  #confirmar() {
    if (this.#motivo()) return;
    const pedidoId = `PED-${Date.now()}`;
    const lineas = this.#lineas.map(({ productoId, nombre, precio, cantidad }) => ({ productoId, nombre, precio, cantidad }));
    const detail = {
      pedidoId,
      usuarioId: this.#usuarioId,
      creadoEn: new Date().toISOString(),
      total: Number(this.#total().toFixed(2)),
      lineas,
    };
    window.dispatchEvent(new CustomEvent(EVT_PED, { detail }));
    this.#lineas = [];
    this.#flash = `Pedido ${pedidoId} confirmado (${euros(detail.total)})`;
    this.#pintar();
  }

  #cambiar(productoId, delta) {
    const l = this.#lineas.find((x) => x.productoId === productoId);
    if (!l) return;
    l.cantidad += delta;
    if (l.cantidad < 1) this.#lineas = this.#lineas.filter((x) => x !== l);
    this.#flash = '';
    this.#pintar();
  }

  #pintar() {
    const motivo = this.#motivo();
    const hay = this.#lineas.length > 0;
    const filas = hay
      ? this.#lineas
          .map((l) => {
            const n = esc(l.nombre);
            const id = esc(l.productoId);
            return `<tr>
              <td>${n}<span class="ud">${euros(l.precio)} / ud.</span></td>
              <td class="r"><span class="cant">
                <button type="button" data-menos="${id}" aria-label="Quitar una unidad de ${n}">−</button>
                <span>${l.cantidad}</span>
                <button type="button" data-mas="${id}" aria-label="Añadir una unidad de ${n}">+</button>
              </span></td>
              <td class="r">${euros(l.precio * l.cantidad)}</td>
              <td class="r"><button type="button" class="quitar" data-quitar="${id}" aria-label="Quitar ${n} del carrito">Quitar</button></td>
            </tr>`;
          })
          .join('')
      : '<tr><td colspan="4" class="vacio">Tu carrito está vacío. Añade productos desde el catálogo.</td></tr>';

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      <header>
        <h1>UCJC Compra</h1>
        <span class="chip ${this.#usuarioId ? '' : 'sin'}">${this.#usuarioId ? `Sesión: ${esc(this.#usuarioId)}` : 'Sin sesión'}</span>
      </header>
      <main>
        ${this.#campana ? `<p class="campana" role="status" data-campana="${esc(this.#campana.codigo)}">${esc(this.#campana.etiqueta)}</p>` : ''}
        <ol class="pasos" aria-label="Progreso de la compra">
          <li class="${hay ? 'hecho' : ''}">1. Carrito</li>
          <li class="${this.#usuarioId ? 'hecho' : ''}">2. Sesión</li>
          <li class="${motivo ? '' : 'hecho'}">3. Confirmar</li>
        </ol>
        <h2>Carrito</h2>
        <p class="sub">Revisa los productos antes de confirmar el pedido.</p>
        <div class="box">
          <div class="lista"><table>
            <tr><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${filas}
          </table></div>
          <p class="total"><b>Total: <span data-total>${euros(this.#total())}</span></b></p>
          <div class="row">
            <button type="button" data-a="vaciar" ${hay ? '' : 'disabled'}>Vaciar</button>
            <button type="button" data-a="ok" class="main" ${motivo ? 'disabled aria-describedby="motivo"' : ''}>Confirmar pedido</button>
          </div>
          ${motivo ? `<p id="motivo" class="motivo">${motivo}</p>` : ''}
          <p class="ok" role="status">${esc(this.#flash)}</p>
        </div>
      </main>`;

    const r = this.shadowRoot;
    r.querySelector('[data-a="ok"]').onclick = () => this.#confirmar();
    r.querySelector('[data-a="vaciar"]').onclick = () => {
      this.#lineas = [];
      this.#flash = 'Carrito vacío';
      this.#pintar();
    };
    r.querySelectorAll('[data-mas]').forEach((b) => (b.onclick = () => this.#cambiar(b.dataset.mas, +1)));
    r.querySelectorAll('[data-menos]').forEach((b) => (b.onclick = () => this.#cambiar(b.dataset.menos, -1)));
    r.querySelectorAll('[data-quitar]').forEach((b) => (b.onclick = () => this.#cambiar(b.dataset.quitar, -Infinity)));
  }
}

if (!customElements.get('ucjc-compra')) {
  customElements.define('ucjc-compra', UcjcCompra);
}
