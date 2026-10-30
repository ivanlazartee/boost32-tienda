import { getProducts, totalStock } from "../../services/productService.js";
import { getCategories } from "../../services/categoryService.js";
import { getSettings } from "../../services/settingsService.js";
import { productGrid, discountPercent } from "../components.js";
import { money } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { imageUrl, thumb } from "../../utils/image.js";
import { esc } from "../../utils/dom.js";
import { toast, loadingView } from "../../utils/ui.js";

const HERO_IMAGE = "N7lIJLtAegc"; // Air Force 1 negras + buzo gris
const HERO_PRODUCT = "p003";

export async function render(container) {
  container.innerHTML = loadingView();
  const [all, categories, settings] = await Promise.all([getProducts(), getCategories(), getSettings()]);
  const products = all.filter((p) => p.active);

  const bestSellers = [...products].filter((p) => totalStock(p) > 0).sort((a, b) => b.sold - a.sold).slice(0, 8);
  const deals = products.filter((p) => discountPercent(p) > 0 && totalStock(p) > 0).slice(0, 4);
  const maxOff = Math.max(...deals.map(discountPercent), 0);
  const heroProduct = products.find((p) => p.id === HERO_PRODUCT);
  const featuredCats = ["zapatillas", "buzos", "camperas", "jeans", "remeras", "accesorios"]
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean);
  const brands = ["Nike", "Adidas", "Vans", "Lacoste", "Levi's", "BoosT32"];

  container.innerHTML = `
    <!-- HERO -->
    <section class="hero">
      <div class="container hero__grid">
        <div>
          <span class="hero__kicker">● Nueva temporada · Primavera / Verano</span>
          <h1 class="hero__title">
            La calle<br><span class="outline">tiene</span><br><span class="accent">código.</span>
          </h1>
          <p class="hero__text">
            Sneakers y streetwear originales de las marcas que se usan en la calle.
            Desde Tucumán, envíos a todo el país.
          </p>
          <div class="hero__cta">
            <a href="#/tienda" class="btn btn--primary btn--lg">Comprar ahora ${icon("arrowRight")}</a>
            <a href="#/tienda?cat=zapatillas" class="btn btn--ghost btn--lg">Ver zapatillas</a>
          </div>
        </div>

        <div class="hero__media">
          <div class="hero__img" data-fallback="B32">
            <img src="${esc(imageUrl(HERO_IMAGE, 1100))}" alt="Zapatillas Nike Air Force 1 negras con buzo gris" fetchpriority="high">
          </div>
          ${
            heroProduct
              ? `<a class="hero__tag" href="#/producto?id=${heroProduct.id}">
                  <span class="text-muted">${esc(heroProduct.brand)}</span>
                  <strong>${esc(heroProduct.name)}</strong>
                  <span class="text-accent">${money(heroProduct.price)}</span>
                </a>`
              : ""
          }
          ${maxOff ? `<div class="hero__sticker"><div>Hasta<strong>${maxOff}%</strong>off</div></div>` : ""}
        </div>
      </div>
    </section>

    <!-- MARCAS -->
    <div class="brands" aria-label="Marcas">
      <div class="brands__track">
        ${[...brands, ...brands, ...brands, ...brands].map((b) => `<span>${esc(b)}</span>`).join("")}
      </div>
    </div>

    <!-- CATEGORÍAS -->
    <section class="section container">
      <div class="section-head">
        <h2 class="section-head__title">Comprá por <em>categoría</em></h2>
        <a href="#/tienda" class="link-more">Ver todo</a>
      </div>
      <div class="cats">
        ${featuredCats
          .map((c) => {
            const count = products.filter((p) => p.category === c.id).length;
            return `
            <a class="cat-card" href="#/tienda?cat=${c.id}">
              <div class="cat-card__bg" data-fallback="">
                ${c.coverImage ? `<img src="${esc(imageUrl(c.coverImage, 800))}" alt="" loading="lazy">` : ""}
              </div>
              <span class="cat-card__arrow">${icon("arrowRight")}</span>
              <h3 class="cat-card__name">${esc(c.name)}</h3>
              <p class="cat-card__meta">${count} productos</p>
            </a>`;
          })
          .join("")}
      </div>
    </section>

    <!-- MÁS VENDIDOS -->
    <section class="section container">
      <div class="section-head">
        <h2 class="section-head__title">Lo más <em>vendido</em></h2>
        <a href="#/tienda?orden=vendidos" class="link-more">Ver todos</a>
      </div>
      ${productGrid(bestSellers)}
    </section>

    <!-- PROMO -->
    <section class="container" style="padding: var(--sp-6) 0">
      <div class="promo">
        <div>
          <h2 class="promo__title">10% off<br>en tu compra</h2>
          <p class="promo__text">Usá el código en el carrito. Y si pagás con transferencia, sumás ${settings.transferDiscount}% off extra.</p>
        </div>
        <div class="promo__code">
          <button id="copy-code" aria-label="Copiar código BOOST10">BOOST10</button>
          <small>Tocá para copiar</small>
        </div>
      </div>
    </section>

    ${
      deals.length
        ? `<section class="section container">
            <div class="section-head">
              <h2 class="section-head__title"><em>Ofertas</em> de la semana</h2>
              <a href="#/tienda?ofertas=1" class="link-more">Ver ofertas</a>
            </div>
            ${productGrid(deals)}
          </section>`
        : ""
    }

    <!-- BENEFICIOS -->
    <section class="container" style="padding: var(--sp-6) 0">
      <div class="perks">
        <div class="perk">${icon("truck")}<div><strong>Envíos a todo el país</strong><span>Gratis desde ${money(settings.freeShippingFrom)}</span></div></div>
        <div class="perk">${icon("card")}<div><strong>${settings.installments} cuotas sin interés</strong><span>Con todas las tarjetas</span></div></div>
        <div class="perk">${icon("refresh")}<div><strong>Cambios sin cargo</strong><span>Dentro de los 30 días</span></div></div>
        <div class="perk">${icon("shield")}<div><strong>100% originales</strong><span>Compra protegida</span></div></div>
      </div>
    </section>

    <!-- COMUNIDAD -->
    <section class="section container">
      <div class="community">
        <div>
          <h2 class="section-head__title">Sumate a la <em>comunidad</em></h2>
          <p class="text-2" style="margin: var(--sp-4) 0 var(--sp-6); max-width: 380px">
            Lanzamientos, drops y descuentos exclusivos primero en Instagram.
            Etiquetanos en tus fotos con ${esc(settings.instagram)}.
          </p>
          <a href="https://instagram.com/${esc(settings.instagram.replace("@", ""))}" target="_blank" rel="noopener" class="btn btn--ghost btn--lg">
            ${icon("instagram")} Seguinos
          </a>
        </div>
        <div class="community__grid">
          ${bestSellers.slice(0, 6).map((p) => `<a href="#/producto?id=${p.id}">${thumb(p, { width: 400 })}</a>`).join("")}
        </div>
      </div>
    </section>
  `;

  container.querySelector("#copy-code").addEventListener("click", async () => {
    await navigator.clipboard?.writeText("BOOST10").catch(() => {});
    toast("Código BOOST10 copiado");
  });
}
