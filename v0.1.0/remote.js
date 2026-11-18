// src/ucjc-compra.js
var e = "ucjc:identidad:sesion-cambiada@1", t = "ucjc:descubrimiento:anadir-al-carrito@1", n = (e) => `${e.toFixed(2).replace(".", ",")} €`, r = (e) => String(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), i = "\n  :host { display:block; font:15px/1.45 system-ui,sans-serif; color:#1d2b22; }\n  .tarjeta { background:#fff; border:2px solid #1f6f4a; border-radius:14px; overflow:hidden; max-width:34rem; }\n  .cab { display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; background:#1f6f4a; color:#fff; padding:.7rem 1rem; }\n  .cab h2 { margin:0; font-size:1.05rem; letter-spacing:.02em; }\n  .chip { font-size:.8rem; padding:.15rem .6rem; border-radius:999px; background:#fff; color:#1f6f4a; font-weight:600; }\n  .chip.sin { background:#ffe7c2; color:#6b3d00; }\n  .cuerpo { padding:.9rem 1rem 1rem; }\n  ol.pasos { display:flex; gap:.4rem; list-style:none; padding:0; margin:0 0 .8rem; font-size:.78rem; }\n  ol.pasos li { flex:1; text-align:center; padding:.25rem; border-radius:6px; background:#eef3ef; color:#4a5a50; }\n  ol.pasos li.hecho { background:#d4eddf; color:#1f6f4a; font-weight:600; }\n  ul.lineas { list-style:none; margin:0; padding:0; display:grid; gap:.45rem; }\n  ul.lineas li { display:grid; grid-template-columns:1fr auto auto; gap:.6rem; align-items:center; padding:.5rem .6rem; border:1px solid #d8e2db; border-radius:10px; }\n  .nombre { font-weight:600; }\n  .cant { display:flex; align-items:center; gap:.3rem; }\n  .cant button { width:1.9rem; height:1.9rem; padding:0; border-radius:50%; }\n  .vacio { margin:0; padding:1rem; text-align:center; color:#4a5a50; border:1px dashed #b7c7bc; border-radius:10px; }\n  .total { display:flex; justify-content:space-between; margin:.8rem 0 0; padding-top:.6rem; border-top:2px solid #1f6f4a; font-size:1.05rem; font-weight:700; }\n  .acciones { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.8rem; }\n  button { font:inherit; border:0; border-radius:8px; padding:.5rem .9rem; cursor:pointer; background:#1f6f4a; color:#fff; }\n  button.sec { background:#eef3ef; color:#1d2b22; }\n  button:disabled { background:#c9d3cc; color:#4a5a50; cursor:not-allowed; }\n  button:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }\n  .motivo { margin:.5rem 0 0; font-size:.88rem; color:#6b3d00; }\n  .aviso { margin:.6rem 0 0; padding:.5rem .6rem; border-radius:8px; background:#d4eddf; color:#14532d; }\n", a = class extends HTMLElement {
	#e = null;
	#t = [];
	#n = "";
	#r = (e) => {
		let t = e.detail || {};
		this.#e = t.autenticado === !0 && t.usuario ? t.usuario.id : null, this.#e || (this.#n = ""), this.#l();
	};
	#i = (e) => {
		let t = e.detail || {};
		if (!t.productoId) return;
		let n = Math.max(1, Number(t.cantidad) || 1), r = this.#t.find((e) => e.productoId === t.productoId);
		r ? r.cantidad += n : this.#t.push({
			productoId: t.productoId,
			nombre: String(t.nombre ?? t.productoId),
			precio: Number(t.precio) || 0,
			cantidad: n
		}), this.#n = "", this.#l();
	};
	connectedCallback() {
		this.shadowRoot || this.attachShadow({ mode: "open" }), window.addEventListener(e, this.#r), window.addEventListener(t, this.#i), this.#l();
	}
	disconnectedCallback() {
		window.removeEventListener(e, this.#r), window.removeEventListener(t, this.#i);
	}
	#a() {
		return Number(this.#t.reduce((e, t) => e + t.precio * t.cantidad, 0).toFixed(2));
	}
	#o() {
		return this.#t.length ? this.#e ? null : "Inicia sesión para confirmar el pedido." : "El carrito está vacío: añade un producto desde el catálogo para poder confirmar.";
	}
	#s() {
		if (this.#o()) return;
		let e = {
			pedidoId: `PED-B-${Date.now()}`,
			usuarioId: this.#e,
			creadoEn: (/* @__PURE__ */ new Date()).toISOString(),
			total: this.#a(),
			lineas: this.#t.map(({ productoId: e, nombre: t, precio: n, cantidad: r }) => ({
				productoId: e,
				nombre: t,
				precio: n,
				cantidad: r
			}))
		};
		window.dispatchEvent(new CustomEvent("ucjc:compra:pedido-confirmado@1", { detail: e })), this.#t = [], this.#n = `Pedido ${e.pedidoId} confirmado por ${n(e.total)}.`, this.#l();
	}
	#c(e, t) {
		let n = this.#t.find((t) => t.productoId === e);
		n && (n.cantidad += t, n.cantidad < 1 && (this.#t = this.#t.filter((e) => e !== n)), this.#l());
	}
	#l() {
		let e = this.#o(), t = this.#t.length > 0, a = t ? `<ul class="lineas">${this.#t.map((e) => `
          <li>
            <span><span class="nombre">${r(e.nombre)}</span><br><small>${n(e.precio)} / ud.</small></span>
            <span class="cant">
              <button type="button" data-menos="${r(e.productoId)}" aria-label="Quitar una unidad de ${r(e.nombre)}">−</button>
              <span aria-label="Cantidad">${e.cantidad}</span>
              <button type="button" data-mas="${r(e.productoId)}" aria-label="Añadir una unidad de ${r(e.nombre)}">+</button>
            </span>
            <b>${n(e.precio * e.cantidad)}</b>
          </li>`).join("")}</ul>` : "<p class=\"vacio\">Tu carrito está vacío.</p>";
		this.shadowRoot.innerHTML = `
      <style>${i}</style>
      <section class="tarjeta" aria-labelledby="titulo">
        <div class="cab">
          <h2 id="titulo">Tu compra</h2>
          <span class="chip ${this.#e ? "" : "sin"}">${this.#e ? `Sesión: ${r(this.#e)}` : "Sin sesión"}</span>
        </div>
        <div class="cuerpo">
          <ol class="pasos" aria-label="Progreso de la compra">
            <li class="${t ? "hecho" : ""}">1. Carrito</li>
            <li class="${this.#e ? "hecho" : ""}">2. Sesión</li>
            <li class="${e ? "" : "hecho"}">3. Confirmar</li>
          </ol>
          ${a}
          <p class="total"><span>Total</span><span data-total>${n(this.#a())}</span></p>
          <div class="acciones">
            <button type="button" data-a="confirmar" ${e ? "disabled aria-describedby=\"motivo\"" : ""}>Confirmar pedido</button>
            <button type="button" data-a="vaciar" class="sec" ${t ? "" : "disabled"}>Vaciar carrito</button>
          </div>
          ${e ? `<p id="motivo" class="motivo">${e}</p>` : ""}
          <div role="status">${this.#n ? `<p class="aviso">${r(this.#n)}</p>` : ""}</div>
        </div>
      </section>`;
		let o = this.shadowRoot;
		o.querySelector("[data-a=\"confirmar\"]").onclick = () => this.#s(), o.querySelector("[data-a=\"vaciar\"]").onclick = () => {
			this.#t = [], this.#l();
		}, o.querySelectorAll("[data-mas]").forEach((e) => e.onclick = () => this.#c(e.dataset.mas, 1)), o.querySelectorAll("[data-menos]").forEach((e) => e.onclick = () => this.#c(e.dataset.menos, -1));
	}
};
customElements.get("ucjc-compra") || customElements.define("ucjc-compra", a);
// src/main.js
var o = {
	nombre: "compra",
	version: "0.1.0"
};
export { o as default };
