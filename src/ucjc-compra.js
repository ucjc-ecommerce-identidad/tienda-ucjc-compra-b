// Código original de Compra A, tal como está publicado en la tienda:
// tienda-ucjc-compra/tienda-ucjc-compra, rama gh-pages, v0.2.0/remote.js (rediseño del 17/11).
// Nombres de variables recuperados de su src/main.js (tag v0.2.0). Sin cambios de comportamiento.
const EVT_ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const EVT_SES = 'ucjc:identidad:sesion-cambiada@1';
const EVT_PED = 'ucjc:compra:pedido-confirmado@1';

const css = `
  :host { display:block; font:16px/1.5 Arial,Helvetica,sans-serif; color:#222; }
  header { background:#1f3a63; color:#fff; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; }
  header h1 { margin:0; font-size:20px; }
  header span { font-size:14px; }
  main { max-width:640px; margin:28px auto; padding:0 16px; }
  h2 { font-size:20px; margin:0 0 4px; }
  .sub { margin:0 0 16px; color:#555; font-size:14px; }
  .box { background:#fff; border:1px solid #ccc; border-radius:10px; padding:16px; }
  .lista { height:180px; overflow-y:auto; border-bottom:1px solid #eee; }
  .lista::-webkit-scrollbar { width:10px; }
  .lista::-webkit-scrollbar-track { background:#f0f0f0; border-radius:5px; }
  .lista::-webkit-scrollbar-thumb { background:#b5bcc8; border-radius:5px; }
  table { width:100%; border-collapse:collapse; }
  th { position:sticky; top:0; background:#fff; text-align:left; font-size:13px; color:#555; border-bottom:1px solid #d5d9e0; padding:6px 4px; }
  td { padding:8px 4px; border-bottom:1px solid #eee; }
  .r { text-align:right; }
  .vacio { color:#777; font-style:italic; }
  .total { text-align:right; font-size:18px; margin:14px 0; }
  .row { display:flex; flex-wrap:wrap; gap:8px; }
  button { font:inherit; font-size:15px; padding:8px 16px; border:1px solid #c4c4c4; border-radius:8px; background:#ececec; color:#222; cursor:pointer; }
  button.main { background:#1f3a63; color:#fff; border-color:#1f3a63; margin-left:auto; }
  button:disabled { opacity:.45; cursor:not-allowed; }
  .ok { margin:12px 0 0; font-size:14px; color:#1d6b2f; min-height:1.2em; }
`;

class UcjcCompra extends HTMLElement {
  #lineas = [];
  #usuarioId = null;
  #flash = '';

  #onAdd = (e) => {
    const d = e.detail || {};
    this.#lineas.push({
      productoId: String(d.productoId ?? ''),
      nombre: String(d.nombre ?? 'Producto'),
      precio: Number(d.precio) || 0,
      cantidad: Math.max(1, Number(d.cantidad) || 1),
    });
    this.#flash = `Añadido: ${d.nombre || d.productoId}`;
    this.#pintar();
  };

  #onSes = (e) => {
    const d = e.detail || {};
    this.#usuarioId = d.autenticado ? d.usuario?.id ?? null : null;
    this.#pintar();
  };

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    window.addEventListener(EVT_ADD, this.#onAdd);
    window.addEventListener(EVT_SES, this.#onSes);
    this.#pintar();
  }

  disconnectedCallback() {
    window.removeEventListener(EVT_ADD, this.#onAdd);
    window.removeEventListener(EVT_SES, this.#onSes);
  }

  #total() {
    return this.#lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  }

  #confirmar() {
    if (!this.#usuarioId || !this.#lineas.length) return;
    const pedidoId = `PED-${Date.now()}`;
    const lineas = this.#lineas.map((l) => ({ ...l }));
    const detail = {
      pedidoId,
      usuarioId: this.#usuarioId,
      creadoEn: new Date().toISOString(),
      total: Number(this.#total().toFixed(2)),
      lineas,
    };
    window.dispatchEvent(new CustomEvent(EVT_PED, { detail }));
    this.#lineas = [];
    this.#flash = `Pedido ${pedidoId} confirmado (${detail.total.toFixed(2)} €)`;
    this.#pintar();
  }

  #pintar() {
    const ses = this.#usuarioId ? `Sesión: ${this.#usuarioId}` : 'Sin sesión — inicia sesión en Identidad para confirmar';
    const filas = this.#lineas.length
      ? this.#lineas
          .map((l) => `<tr><td>${l.nombre}</td><td class="r">${l.cantidad}</td><td class="r">${(l.precio * l.cantidad).toFixed(2)} €</td></tr>`)
          .join('')
      : '<tr><td colspan="3" class="vacio">Carrito vacío — espera un «añadir» de Descubrimiento o usa el botón demo</td></tr>';

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      <header><h1>UCJC Compra</h1><span>${ses}</span></header>
      <main>
        <h2>Carrito</h2>
        <p class="sub">Revisa los productos antes de confirmar el pedido.</p>
        <div class="box">
          <div class="lista"><table>
            <tr><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th></tr>
            ${filas}
          </table></div>
          <p class="total"><b>Total: ${this.#total().toFixed(2)} €</b></p>
          <div class="row">
            <button type="button" data-a="demo">+ Producto demo</button>
            <button type="button" data-a="vaciar" ${this.#lineas.length ? '' : 'disabled'}>Vaciar</button>
            <button type="button" data-a="ok" class="main" ${this.#usuarioId && this.#lineas.length ? '' : 'disabled'}>Confirmar pedido</button>
          </div>
          <p class="ok">${this.#flash}</p>
        </div>
      </main>`;

    this.shadowRoot.querySelector('[data-a="demo"]').onclick = () => {
      this.#onAdd({ detail: { productoId: 'prod-demo', nombre: 'Camiseta UCJC (demo)', precio: 19.99, cantidad: 1 } });
    };
    this.shadowRoot.querySelector('[data-a="ok"]').onclick = () => this.#confirmar();
    this.shadowRoot.querySelector('[data-a="vaciar"]').onclick = () => {
      this.#lineas = [];
      this.#flash = 'Carrito vacío';
      this.#pintar();
    };
  }
}

customElements.define('ucjc-compra', UcjcCompra);
