# tienda-ucjc-compra-b

Segunda versión de la pieza **Compra** de la Tienda UCJC (prueba A/B del shell). La mantiene el equipo Identidad.
Compra A es [`tienda-ucjc-compra/tienda-ucjc-compra`](https://github.com/tienda-ucjc-compra/tienda-ucjc-compra).

Custom element: `<ucjc-compra>` (el mismo que Compra A, para que el shell pueda cambiar una por otra sin romper nada).

## Qué cambia respecto a Compra A

Compra B **parte del código de Compra A** (lo que la tienda carga hoy: `gh-pages`, `v0.2.0/remote.js`, rediseño del 17/11; ver el primer commit de este repo) y lo mejora sin tocar etiqueta ni eventos:

| Compra A | Compra B |
|---|---|
| Confirmar desactivado sin explicación | Texto que dice por qué no se puede confirmar (carrito vacío o sin sesión) |
| El mismo producto repetido ocupa varias filas | Se agrupa en una fila y suma cantidad |
| Sin forma de cambiar cantidades | Botones + y − y «Quitar» por línea |
| Botón «+ Producto demo» en la tienda real | Quitado |
| Nombre del producto metido en HTML sin escapar | Escapado (un nombre con `<img>` se ve como texto) |
| `attachShadow` en cada `connectedCallback`: falla si el shell mueve el elemento | Se crea una sola vez |
| Tras cerrar sesión sigue visible el pedido del usuario anterior | Se limpia al cambiar de usuario |
| — | Pasos Carrito · Sesión · Confirmar, foco visible y avisos con `role="status"` |

## Equipo

| Nombre | Correo | GitHub |
|---|---|---|
| Sebastián Blanco (responsable) | sebastianmarcelo.blanco@alumno.ucjc.edu | [@sebasxblanco](https://github.com/sebasxblanco) |
| Olivia Troitiño Frydrych | olivia.troitinofrydrych@alumno.ucjc.edu | [@oliviatroitino](https://github.com/oliviatroitino) |
| Ingrid Carvalhais Silva | ingrid.carvalhaissilva@alumno.ucjc.edu | |
| Fernando Melero Muñoz | fmeleromunoz@gmail.com | [@FerMelero](https://github.com/FerMelero) |
| Giordano Fabio Castilla García | giordano.fcg@gmail.com | [@Giordano-jpg](https://github.com/Giordano-jpg) |

## Eventos (contratos `@1` firmados en [tienda-ucjc-contratos](https://github.com/cesar-andress/tienda-ucjc-contratos))

| Evento | Rol | Uso |
|---|---|---|
| `ucjc:identidad:sesion-cambiada@1` | escucha | Guarda `usuario.id`; solo deja confirmar si `autenticado === true` |
| `ucjc:descubrimiento:anadir-al-carrito@1` | escucha | Añade la línea (o suma cantidad si el producto ya está) |
| `ucjc:compra:pedido-confirmado@1` | emite | `pedidoId`, `usuarioId`, `creadoEn`, `total`, `lineas[]` |

## Cómo arrancarlo

```bash
npm install
npm run dev
npm test
```

## Cómo se publica

Igual que el resto de piezas: `npm run build` genera `dist/remote.js`; al empujar un tag `vX.Y.Z` el workflow `release.yml` lo publica en la rama `gh-pages` bajo `vX.Y.Z/`.

- Para el shell: `https://ucjc-ecommerce-identidad.github.io/tienda-ucjc-compra-b/vX.Y.Z/remote.js`
- Página propia: `https://ucjc-ecommerce-identidad.github.io/tienda-ucjc-compra-b/vX.Y.Z/`

Un tag no se mueve nunca: si hay que corregir algo, se publica una versión nueva. Exporta `{ nombre: 'compra', version }`.
