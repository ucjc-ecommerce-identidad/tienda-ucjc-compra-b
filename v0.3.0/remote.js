// src/ucjc-compra.js
var e = "ucjc:descubrimiento:anadir-al-carrito@1", t = "ucjc:identidad:sesion-cambiada@1", n = "ucjc:descubrimiento:campana-cambiada@1", r = (e) => `${e.toFixed(2).replace(".", ",")} €`, i = (e) => String(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), a = "\n  :host { display:block; font:16px/1.5 Arial,Helvetica,sans-serif; color:#222; }\n  header { background:#1f3a63; color:#fff; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; }\n  header h1 { margin:0; font-size:20px; }\n  .chip { font-size:13px; padding:2px 10px; border-radius:999px; background:#e3f1e7; color:#14532d; font-weight:700; }\n  .chip.sin { background:#ffe7c2; color:#6b3d00; }\n  main { max-width:640px; margin:24px auto; padding:0 16px; }\n  ol.pasos { display:flex; gap:6px; list-style:none; padding:0; margin:0 0 14px; font-size:13px; }\n  ol.pasos li { flex:1; text-align:center; padding:4px; border-radius:6px; background:#eef1f6; color:#555; }\n  ol.pasos li.hecho { background:#1f3a63; color:#fff; font-weight:700; }\n  h2 { font-size:20px; margin:0 0 4px; }\n  .sub { margin:0 0 16px; color:#555; font-size:14px; }\n  .box { background:#fff; border:1px solid #ccc; border-radius:10px; padding:16px; }\n  .lista { max-height:240px; overflow-y:auto; border-bottom:1px solid #eee; }\n  table { width:100%; border-collapse:collapse; }\n  th { position:sticky; top:0; background:#fff; text-align:left; font-size:13px; color:#555; border-bottom:1px solid #d5d9e0; padding:6px 4px; }\n  td { padding:8px 4px; border-bottom:1px solid #eee; vertical-align:middle; }\n  .r { text-align:right; }\n  .ud { display:block; font-size:12px; color:#666; }\n  .cant { display:inline-flex; align-items:center; gap:6px; }\n  .cant button { width:30px; height:30px; padding:0; border-radius:50%; font-size:16px; line-height:1; }\n  .quitar { padding:2px 8px; font-size:13px; }\n  .vacio { color:#555; font-style:italic; text-align:center; padding:18px 4px; }\n  .total { text-align:right; font-size:18px; margin:14px 0; }\n  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }\n  button { font:inherit; font-size:15px; padding:8px 16px; border:1px solid #c4c4c4; border-radius:8px; background:#ececec; color:#222; cursor:pointer; }\n  button.main { background:#1f3a63; color:#fff; border-color:#1f3a63; margin-left:auto; }\n  button:disabled { background:#e6e6e6; color:#6b6b6b; border-color:#d0d0d0; cursor:not-allowed; }\n  button:focus-visible { outline:3px solid #f2a900; outline-offset:2px; }\n  .motivo { margin:10px 0 0; font-size:14px; color:#6b3d00; text-align:right; }\n  .campana { margin:0 0 14px; padding:10px 14px; border-radius:8px; background:#111; color:#ffd400; font-weight:700; text-align:center; }\n  .ok { margin:12px 0 0; font-size:14px; color:#1d6b2f; min-height:1.2em; }\n", o = class extends HTMLElement {
	#e = [];
	#t = null;
	#n = "";
	#r = null;
	#i = (e) => {
		let t = e.detail || {};
		if (!t.productoId) return;
		let n = Math.max(1, Number(t.cantidad) || 1), r = this.#e.find((e) => e.productoId === String(t.productoId));
		r ? r.cantidad += n : this.#e.push({
			productoId: String(t.productoId),
			nombre: String(t.nombre ?? "Producto"),
			precio: Number(t.precio) || 0,
			cantidad: n
		}), this.#n = `Añadido: ${t.nombre || t.productoId}`, this.#d();
	};
	#a = (e) => {
		let t = e.detail || {}, n = this.#t;
		this.#t = t.autenticado === !0 && t.usuario ? t.usuario.id ?? null : null, n !== this.#t && (this.#n = ""), this.#d();
	};
	#o = (e) => {
		let t = e.detail || {};
		typeof t.activa == "boolean" && (this.#r = t.activa ? {
			codigo: String(t.codigo ?? ""),
			etiqueta: String(t.etiqueta || t.codigo || "Campaña activa")
		} : null, this.#d());
	};
	connectedCallback() {
		this.shadowRoot || this.attachShadow({ mode: "open" }), window.addEventListener(e, this.#i), window.addEventListener(t, this.#a), window.addEventListener(n, this.#o), this.#d();
	}
	disconnectedCallback() {
		window.removeEventListener(e, this.#i), window.removeEventListener(t, this.#a), window.removeEventListener(n, this.#o);
	}
	#s() {
		return this.#e.reduce((e, t) => e + t.precio * t.cantidad, 0);
	}
	#c() {
		return this.#e.length ? this.#t ? null : "Inicia sesión en Identidad para confirmar el pedido." : "El carrito está vacío: añade un producto del catálogo para poder confirmar.";
	}
	#l() {
		if (this.#c()) return;
		let e = `PED-${Date.now()}`, t = this.#e.map(({ productoId: e, nombre: t, precio: n, cantidad: r }) => ({
			productoId: e,
			nombre: t,
			precio: n,
			cantidad: r
		})), n = {
			pedidoId: e,
			usuarioId: this.#t,
			creadoEn: (/* @__PURE__ */ new Date()).toISOString(),
			total: Number(this.#s().toFixed(2)),
			lineas: t
		};
		window.dispatchEvent(new CustomEvent("ucjc:compra:pedido-confirmado@1", { detail: n })), this.#e = [], this.#n = `Pedido ${e} confirmado (${r(n.total)})`, this.#d();
	}
	#u(e, t) {
		let n = this.#e.find((t) => t.productoId === e);
		n && (n.cantidad += t, n.cantidad < 1 && (this.#e = this.#e.filter((e) => e !== n)), this.#n = "", this.#d());
	}
	#d() {
		let e = this.#c(), t = this.#e.length > 0, n = t ? this.#e.map((e) => {
			let t = i(e.nombre), n = i(e.productoId);
			return `<tr>
              <td>${t}<span class="ud">${r(e.precio)} / ud.</span></td>
              <td class="r"><span class="cant">
                <button type="button" data-menos="${n}" aria-label="Quitar una unidad de ${t}">−</button>
                <span>${e.cantidad}</span>
                <button type="button" data-mas="${n}" aria-label="Añadir una unidad de ${t}">+</button>
              </span></td>
              <td class="r">${r(e.precio * e.cantidad)}</td>
              <td class="r"><button type="button" class="quitar" data-quitar="${n}" aria-label="Quitar ${t} del carrito">Quitar</button></td>
            </tr>`;
		}).join("") : "<tr><td colspan=\"4\" class=\"vacio\">Tu carrito está vacío. Añade productos desde el catálogo.</td></tr>";
		this.shadowRoot.innerHTML = `
      <style>${a}</style>
      <header>
        <h1>UCJC Compra</h1>
        <span class="chip ${this.#t ? "" : "sin"}">${this.#t ? `Sesión: ${i(this.#t)}` : "Sin sesión"}</span>
      </header>
      <main>
        ${this.#r ? `<p class="campana" role="status" data-campana="${i(this.#r.codigo)}">${i(this.#r.etiqueta)}</p>` : ""}
        <ol class="pasos" aria-label="Progreso de la compra">
          <li class="${t ? "hecho" : ""}">1. Carrito</li>
          <li class="${this.#t ? "hecho" : ""}">2. Sesión</li>
          <li class="${e ? "" : "hecho"}">3. Confirmar</li>
        </ol>
        <h2>Carrito</h2>
        <p class="sub">Revisa los productos antes de confirmar el pedido.</p>
        <div class="box">
          <div class="lista"><table>
            <tr><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th><span hidden>Acciones</span></th></tr>
            ${n}
          </table></div>
          <p class="total"><b>Total: <span data-total>${r(this.#s())}</span></b></p>
          <div class="row">
            <button type="button" data-a="vaciar" ${t ? "" : "disabled"}>Vaciar</button>
            <button type="button" data-a="ok" class="main" ${e ? "disabled aria-describedby=\"motivo\"" : ""}>Confirmar pedido</button>
          </div>
          ${e ? `<p id="motivo" class="motivo">${e}</p>` : ""}
          <p class="ok" role="status">${i(this.#n)}</p>
        </div>
      </main>`;
		let o = this.shadowRoot;
		o.querySelector("[data-a=\"ok\"]").onclick = () => this.#l(), o.querySelector("[data-a=\"vaciar\"]").onclick = () => {
			this.#e = [], this.#n = "Carrito vacío", this.#d();
		}, o.querySelectorAll("[data-mas]").forEach((e) => e.onclick = () => this.#u(e.dataset.mas, 1)), o.querySelectorAll("[data-menos]").forEach((e) => e.onclick = () => this.#u(e.dataset.menos, -1)), o.querySelectorAll("[data-quitar]").forEach((e) => e.onclick = () => this.#u(e.dataset.quitar, -Infinity));
	}
};
customElements.get("ucjc-compra") || customElements.define("ucjc-compra", o);
// src/main.js
var s = {
	nombre: "compra",
	version: "0.3.0"
};
export { s as default };
