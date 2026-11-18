// Compra B: misma etiqueta y mismos eventos que Compra A; solo cambia el aspecto.
const EVT_SESION = 'ucjc:identidad:sesion-cambiada@1';
const EVT_ANADIR = 'ucjc:descubrimiento:anadir-al-carrito@1';
const EVT_PEDIDO = 'ucjc:compra:pedido-confirmado@1';

const euros = (n) => `${n.toFixed(2).replace('.', ',')} €`;
const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const css = `
  :host { display:block; font:15px/1.45 system-ui,sans-serif; color:#1d2b22; }
  .tarjeta { background:#fff; border:2px solid #1f6f4a; border-radius:14px; overflow:hidden; max-width:34rem; }
  .cab { display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; background:#1f6f4a; color:#fff; padding:.7rem 1rem; }
  .cab h2 { margin:0; font-size:1.05rem; letter-spacing:.02em; }
  .chip { font-size:.8rem; padding:.15rem .6rem; border-radius:999px; background:#fff; color:#1f6f4a; font-weight:600; }
  .chip.sin { background:#ffe7c2; color:#6b3d00; }
  .cuerpo { padding:.9rem 1rem 1rem; }
  ol.pasos { display:flex; gap:.4rem; list-style:none; padding:0; margin:0 0 .8rem; font-size:.78rem; }
  ol.pasos li { flex:1; text-align:center; padding:.25rem; border-radius:6px; background:#eef3ef; color:#4a5a50; }
  ol.pasos li.hecho { background:#d4eddf; color:#1f6f4a; font-weight:600; }
  ul.lineas { list-style:none; margin:0; padding:0; display:grid; gap:.45rem; }
  ul.lineas li { display:grid; grid-template-columns:1fr auto auto; gap:.6rem; align-items:center; padding:.5rem .6rem; border:1px solid #d8e2db; border-radius:10px; }
  .nombre { font-weight:600; }
  .cant { display:flex; align-items:center; gap:.3rem; }
  .cant button { width:1.9rem; height:1.9rem; padding:0; border-radius:50%; }
  .vacio { margin:0; padding:1rem; text-align:center; color:#4a5a50; border:1px dashed #b7c7bc; border-radius:10px; }
  .total { display:flex; justify-content:space-between; margin:.8rem 0 0; padding-top:.6rem; border-top:2px solid #1f6f4a; font-size:1.05rem; font-weight:700; }
  .acciones { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.8rem; }
  button { font:inherit; border:0; border-radius:8px; padding:.5rem .9rem; cursor:pointer; background:#1f6f4a; color:#fff; }
  button.sec { background:#eef3ef; color:#1d2b22; }
  button:disabled { background:#c9d3cc; color:#4a5a50; cursor:not-allowed; }
  button:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }
  .motivo { margin:.5rem 0 0; font-size:.88rem; color:#6b3d00; }
  .aviso { margin:.6rem 0 0; padding:.5rem .6rem; border-radius:8px; background:#d4eddf; color:#14532d; }
`;

export class UcjcCompra extends HTMLElement {
  #usuarioId = null;
  #lineas = []; // { productoId, nombre, precio, cantidad }
  #aviso = '';

  #onSesion = (e) => {
    const d = e.detail || {};
    this.#usuarioId = d.autenticado === true && d.usuario ? d.usuario.id : null;
    // Sin sesión no se deja el aviso de un pedido de otro usuario a la vista.
    if (!this.#usuarioId) this.#aviso = '';
    this.#pintar();
  };

  #onAnadir = (e) => {
    const d = e.detail || {};
    if (!d.productoId) return;
    const cantidad = Math.max(1, Number(d.cantidad) || 1);
    const existente = this.#lineas.find((l) => l.productoId === d.productoId);
    if (existente) existente.cantidad += cantidad;
    else this.#lineas.push({ productoId: d.productoId, nombre: String(d.nombre ?? d.productoId), precio: Number(d.precio) || 0, cantidad });
    this.#aviso = '';
    this.#pintar();
  };

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    window.addEventListener(EVT_SESION, this.#onSesion);
    window.addEventListener(EVT_ANADIR, this.#onAnadir);
    this.#pintar();
  }

  disconnectedCallback() {
    window.removeEventListener(EVT_SESION, this.#onSesion);
    window.removeEventListener(EVT_ANADIR, this.#onAnadir);
  }

  #total() {
    return Number(this.#lineas.reduce((s, l) => s + l.precio * l.cantidad, 0).toFixed(2));
  }

  // Por qué no se puede confirmar todavía (null si se puede).
  #motivoBloqueo() {
    if (!this.#lineas.length) return 'El carrito está vacío: añade un producto desde el catálogo para poder confirmar.';
    if (!this.#usuarioId) return 'Inicia sesión para confirmar el pedido.';
    return null;
  }

  #confirmar() {
    if (this.#motivoBloqueo()) return;
    const detail = {
      pedidoId: `PED-B-${Date.now()}`,
      usuarioId: this.#usuarioId,
      creadoEn: new Date().toISOString(),
      total: this.#total(),
      lineas: this.#lineas.map(({ productoId, nombre, precio, cantidad }) => ({ productoId, nombre, precio, cantidad })),
    };
    window.dispatchEvent(new CustomEvent(EVT_PEDIDO, { detail }));
    this.#lineas = [];
    this.#aviso = `Pedido ${detail.pedidoId} confirmado por ${euros(detail.total)}.`;
    this.#pintar();
  }

  #cambiar(productoId, delta) {
    const l = this.#lineas.find((x) => x.productoId === productoId);
    if (!l) return;
    l.cantidad += delta;
    if (l.cantidad < 1) this.#lineas = this.#lineas.filter((x) => x !== l);
    this.#pintar();
  }

  #pintar() {
    const motivo = this.#motivoBloqueo();
    const hayLineas = this.#lineas.length > 0;
    const lineas = hayLineas
      ? `<ul class="lineas">${this.#lineas
          .map(
            (l) => `
          <li>
            <span><span class="nombre">${esc(l.nombre)}</span><br><small>${euros(l.precio)} / ud.</small></span>
            <span class="cant">
              <button type="button" data-menos="${esc(l.productoId)}" aria-label="Quitar una unidad de ${esc(l.nombre)}">−</button>
              <span aria-label="Cantidad">${l.cantidad}</span>
              <button type="button" data-mas="${esc(l.productoId)}" aria-label="Añadir una unidad de ${esc(l.nombre)}">+</button>
            </span>
            <b>${euros(l.precio * l.cantidad)}</b>
          </li>`,
          )
          .join('')}</ul>`
      : '<p class="vacio">Tu carrito está vacío.</p>';

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      <section class="tarjeta" aria-labelledby="titulo">
        <div class="cab">
          <h2 id="titulo">Tu compra</h2>
          <span class="chip ${this.#usuarioId ? '' : 'sin'}">${this.#usuarioId ? `Sesión: ${esc(this.#usuarioId)}` : 'Sin sesión'}</span>
        </div>
        <div class="cuerpo">
          <ol class="pasos" aria-label="Progreso de la compra">
            <li class="${hayLineas ? 'hecho' : ''}">1. Carrito</li>
            <li class="${this.#usuarioId ? 'hecho' : ''}">2. Sesión</li>
            <li class="${motivo ? '' : 'hecho'}">3. Confirmar</li>
          </ol>
          ${lineas}
          <p class="total"><span>Total</span><span data-total>${euros(this.#total())}</span></p>
          <div class="acciones">
            <button type="button" data-a="confirmar" ${motivo ? 'disabled aria-describedby="motivo"' : ''}>Confirmar pedido</button>
            <button type="button" data-a="vaciar" class="sec" ${hayLineas ? '' : 'disabled'}>Vaciar carrito</button>
          </div>
          ${motivo ? `<p id="motivo" class="motivo">${motivo}</p>` : ''}
          <div role="status">${this.#aviso ? `<p class="aviso">${esc(this.#aviso)}</p>` : ''}</div>
        </div>
      </section>`;

    const r = this.shadowRoot;
    r.querySelector('[data-a="confirmar"]').onclick = () => this.#confirmar();
    r.querySelector('[data-a="vaciar"]').onclick = () => {
      this.#lineas = [];
      this.#pintar();
    };
    r.querySelectorAll('[data-mas]').forEach((b) => (b.onclick = () => this.#cambiar(b.dataset.mas, +1)));
    r.querySelectorAll('[data-menos]').forEach((b) => (b.onclick = () => this.#cambiar(b.dataset.menos, -1)));
  }
}

if (!customElements.get('ucjc-compra')) {
  customElements.define('ucjc-compra', UcjcCompra);
}
