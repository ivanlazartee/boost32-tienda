# BoosT32 — Demo tienda de ropa urbana

Demo de tienda online + panel de administración para mostrar a tiendas de ropa.
HTML, CSS y JavaScript puro (módulos ES), sin frameworks ni build.

## Cómo verlo

Los módulos de JS necesitan un servidor (no funcionan abriendo el archivo con doble clic).

- **VS Code:** extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Terminal:** `npx serve .` o `python3 -m http.server` y abrir `http://localhost:3000` / `:8000`.

- Tienda: `/` (inicio, catálogo con filtros, ficha de producto, carrito, checkout)
- Panel: `/admin/`

Para probar el checkout: agregá productos, usá el cupón `BOOST10` y pagá con transferencia.

## Estructura

```
├── index.html              Tienda online (vista de cliente)
├── admin/index.html        Panel de administración
├── css/
│   ├── store.css           Estilos de la tienda (importa todo)
│   ├── admin.css           Estilos del panel (importa todo)
│   ├── base/               Variables (colores, tipografía), reset, textos
│   ├── layout/             Sidebar + topbar
│   ├── components/         Botones, cards, tablas, formularios, modal, badges
│   └── pages/              Estilos propios de cada pantalla
└── js/
    ├── data/               Datos de ejemplo (productos, pedidos, clientes…)
    ├── services/           Capa de datos ← acá se conecta Firebase
    ├── utils/              Formatos ($, fechas), íconos, modal, toasts
    ├── store/              Tienda: carrito, drawer, vistas (home, catálogo, producto, checkout)
    └── admin/
        ├── main.js         Arranque del panel
        ├── router.js       Navegación por #hash
        └── views/          Una pantalla por archivo
```

## Paleta

| Uso | Color |
|---|---|
| Fondo | `#0A0A0A` |
| Superficies | `#161616` / `#1F1F1F` |
| Bordes | `#2A2A2A` |
| Texto | `#F5F5F5` / `#9A9A9A` |
| Acento | `#C6FF00` (verde ácido) |

Todo sale de `css/base/variables.css`: cambiar la marca para otro cliente es editar ese archivo.

## Datos

Hoy los datos viven **en memoria** (`js/services/db.js`): se pueden crear, editar y borrar
productos, cambiar estados de pedidos, etc., y todo vuelve a cero al recargar.

Todas las funciones de `services/` son `async`, igual que Firestore. Para pasar a Firebase
se reemplaza el contenido de esos archivos y las vistas quedan iguales.

## Fotos

Fotos de [Unsplash](https://unsplash.com) (licencia libre). Cada producto guarda el ID de la foto.
Si una foto no carga, se muestra un recuadro con las iniciales de la marca.
Para un cliente real, se reemplazan por sus propias fotos.

## Próximas etapas

1. Repo en GitHub
2. Firebase (Firestore + Auth + Storage)
3. Deploy en Vercel
