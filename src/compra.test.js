import { beforeEach, describe, expect, it, vi } from 'vitest';
import mod from './main.js';

const SES = 'ucjc:identidad:sesion-cambiada@1';
const ADD = 'ucjc:descubrimiento:anadir-al-carrito@1';
const PED = 'ucjc:compra:pedido-confirmado@1';

const emitir = (tipo, detail) => window.dispatchEvent(new CustomEvent(tipo, { detail }));
const entrar = () => emitir(SES, { autenticado: true, usuario: { id: 'u-demo', email: 'demo@alumno.ucjc.edu' } });
const salir = () => emitir(SES, { autenticado: false, usuario: null });
const camiseta = { productoId: 'p-1', nombre: 'Camiseta', precio: 19.99, cantidad: 1 };

describe('ucjc-compra (Compra B)', () => {
  let el;
  const $ = (s) => el.shadowRoot.querySelector(s);
  const confirmar = () => $('[data-a="confirmar"]');

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('ucjc-compra');
    document.body.appendChild(el);
  });

  it('exporta los metadatos de carga de Compra', () => {
    expect(mod).toEqual({ nombre: 'compra', version: '0.1.0' });
    expect(customElements.get('ucjc-compra')).toBeDefined();
  });

  it('con el carrito vacío, confirmar está desactivado y explica por qué', () => {
    entrar();
    expect(confirmar().disabled).toBe(true);
    expect($('#motivo').textContent).toContain('carrito está vacío');
    expect(confirmar().getAttribute('aria-describedby')).toBe('motivo');
  });

  it('sin sesión no deja confirmar aunque haya productos', () => {
    emitir(ADD, camiseta);
    expect(confirmar().disabled).toBe(true);
    expect($('#motivo').textContent).toContain('Inicia sesión');
  });

  it('suma cantidades del mismo producto y calcula el total', () => {
    emitir(ADD, camiseta);
    emitir(ADD, { ...camiseta, cantidad: 2 });
    expect(el.shadowRoot.querySelectorAll('ul.lineas li').length).toBe(1);
    expect($('[data-total]').textContent).toBe('59,97 €');
  });

  it('confirma con el contrato pedido-confirmado@1 y el usuario de Identidad', () => {
    const spy = vi.fn();
    window.addEventListener(PED, spy);
    entrar();
    emitir(ADD, camiseta);
    emitir(ADD, { productoId: 'p-2', nombre: 'Taza', precio: 7.5, cantidad: 2 });
    confirmar().click();
    const d = spy.mock.calls.at(-1)[0].detail;
    expect(Object.keys(d).sort()).toEqual(['creadoEn', 'lineas', 'pedidoId', 'total', 'usuarioId']);
    expect(d).toMatchObject({ usuarioId: 'u-demo', total: 34.99 });
    expect(d.lineas[1]).toEqual({ productoId: 'p-2', nombre: 'Taza', precio: 7.5, cantidad: 2 });
    expect(new Date(d.creadoEn).toISOString()).toBe(d.creadoEn);
    expect(el.shadowRoot.querySelectorAll('ul.lineas li').length).toBe(0);
    window.removeEventListener(PED, spy);
  });

  it('al cerrar sesión vuelve a bloquear la confirmación', () => {
    entrar();
    emitir(ADD, camiseta);
    expect(confirmar().disabled).toBe(false);
    salir();
    expect(confirmar().disabled).toBe(true);
    expect($('.chip').textContent).toBe('Sin sesión');
  });

  it('los botones + y − cambian la cantidad y quitan la línea al llegar a 0', () => {
    emitir(ADD, camiseta);
    $('[data-mas="p-1"]').click();
    expect($('[data-total]').textContent).toBe('39,98 €');
    $('[data-menos="p-1"]').click();
    $('[data-menos="p-1"]').click();
    expect($('.vacio')).not.toBeNull();
  });

  it('el nombre del producto se muestra como texto, no como HTML', () => {
    emitir(ADD, { ...camiseta, nombre: '<img src=x>' });
    expect(el.shadowRoot.querySelector('ul img')).toBeNull();
  });

  it('al quitarlo del DOM deja de escuchar eventos', () => {
    el.remove();
    emitir(ADD, camiseta);
    document.body.appendChild(el);
    expect($('.vacio')).not.toBeNull();
  });
});
