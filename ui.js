// assets/js/ui.js
// UI: maneja eventos de productos, carrito, buscador, menú y checkout.
// Requiere: Cart (cart.js) y Checkout (checkout.js) ya cargados.

const UI = (() => {
  // Helpers cortos
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const money = (n) => `$${(n || 0).toLocaleString("es-AR")}`;

  // -----------------------------
  // Parseo de producto (mantiene tu lógica)
  // -----------------------------
  function detectarUnidad(nombre, precioTexto) {
    let unidad = "1 kilo";
    const n = (nombre || "").toLowerCase();

    if (n.includes("garrapiñada")) {
      if (/250\s*g/.test(precioTexto)) unidad = "250 gramos";
      else if (/500\s*g/.test(precioTexto)) unidad = "500 gramos";
    } else if (n.includes("snack")) {
      if (/100\s*g/.test(precioTexto)) unidad = "100 gramos";
      else if (/200\s*g/.test(precioTexto)) unidad = "200 gramos";
    } else {
      if (/½\s*kg/.test(precioTexto)) unidad = "½ kilo";
      if (/2\s*kg/.test(precioTexto)) unidad = "2 kilos";
    }
    return unidad;
  }

  function parsePrecio(precioTexto) {
    const m = (precioTexto || "").match(/\$\s*([\d.]+)/);
    return m ? parseInt(m[1].replace(/\./g, ""), 10) : 0;
  }

  // --------------------------------
  // Toast "Producto agregado al carrito"
  // --------------------------------
  let toastTimer;
  function showToast(msg = "Producto agregado al carrito ✅") {
    // Si ya existe el toast, lo usamos; si no, lo creamos on the fly
    let el = $(".mensaje-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "mensaje-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("mostrar");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("mostrar"), 1800);
  }

  // -----------------------------
  // Carrito: render lista + total
  // -----------------------------
  function renderCarrito(cart) {
    const lista = $("#lista-carrito");
    const total = $("#total-carrito");
    if (!lista || !total) return; // si no están en la página, salimos sin romper

    // Pintar items
    lista.innerHTML = "";
    cart.items().forEach(({ clave, cantidad, precioUnitario, subtotal }) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${cantidad} x ${clave} — ${money(subtotal)}
        <span class="eliminar-item" data-producto="${clave}" title="Quitar uno">❌</span>
      `;
      lista.appendChild(li);
    });

    // Total
    total.textContent = cart.totalAmount().toLocaleString("es-AR");

    // Eventos para eliminar 1 unidad
    $$(".eliminar-item", lista).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const clave = btn.getAttribute("data-producto");
        cart.dec(clave);
        renderCarrito(cart);
      });
    });
  }

  // ------------------------------------
  // Clicks en cards de productos (agregar)
  // ------------------------------------
  function initClicksProductos(cart) {
    // Soporta dos variantes de marcado:
    // 1) elementos con clase .clickable-producto
    // 2) elementos .producto (cada uno con h3 y .precio)
    const clickables = $$(".clickable-producto");
    const productos = clickables.length ? clickables : $$(".producto");

    if (!productos.length) return;

    const onClick = (prodEl) => {
      const nombre = $("h3", prodEl)?.textContent?.trim() || "Producto";
      const precioTexto = $(".precio", prodEl)?.textContent || "";
      const unidad = detectarUnidad(nombre, precioTexto);
      const precio = parsePrecio(precioTexto);
      const clave = `${unidad} de ${nombre}`;

      cart.add(clave, precio);
      renderCarrito(cart);
      showToast();
    };

    productos.forEach((el) => {
      el.addEventListener("click", (e) => {
        // Evitamos que botones internos (como "Agregar") rompan el flujo
        if (e.target.closest(".eliminar-item")) return;
        onClick(el);
      });
    });
  }

  // -----------------------------
  // Buscador simple + scroll suave
  // -----------------------------
  function initBuscador() {
    const buscador = $("#buscador");
    const contenedorProd = $("#productos") || document.body;
    const tarjetas = $$(".producto");

    if (!buscador) return;

    buscador.addEventListener("input", () => {
      const valor = buscador.value.toLowerCase();

      if (contenedorProd && contenedorProd.scrollIntoView) {
        contenedorProd.scrollIntoView({ behavior: "smooth" });
      }

      if (!tarjetas.length) return;
      tarjetas.forEach((p) => {
        const txt = p.textContent.toLowerCase();
        p.style.display = txt.includes(valor) ? "" : "none";
      });
    });
  }

  // -----------------------------
  // Abrir/cerrar widget del carrito
  // -----------------------------
  function initToggleCarrito() {
    const abrir = $("#abrir-carrito");
    const cerrar = $("#cerrar-carrito");
    const box = $("#carrito");

    if (!box) return;

    if (abrir) {
      abrir.addEventListener("click", (e) => {
        e.preventDefault();
        box.style.display =
          box.style.display === "none" || !box.style.display ? "block" : "none";
      });
    }
    if (cerrar) {
      cerrar.addEventListener("click", () => (box.style.display = "none"));
    }
  }

  // -----------------------------
  // Menú lateral móvil (si existe)
  // -----------------------------
  function initMenuLateral() {
    const toggle = $("#menu-toggle") || $(".hamburger"); // soporte dos variantes
    const panel = $("#menu-lateral") || $(".panel-menu");
    const fondo = $("#fondo-menu");
    const cerrar = $("#cerrar-menu");

    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      panel.classList.add("open");
      if (fondo) fondo.classList.add("activo");
    });

    const close = () => {
      panel.classList.remove("open");
      if (fondo) fondo.classList.remove("activo");
    };

    if (cerrar) cerrar.addEventListener("click", close);
    if (fondo) fondo.addEventListener("click", close);
  }

  // ---------------------------------------
  // Mostrar/ocultar formulario de Servicios
  // ---------------------------------------
  function initToggleServicios() {
    // Expone función global (si tu HTML llama a mostrarFormulario())
    window.mostrarFormulario = function () {
      const form = $("#formulario-cliente");
      if (!form) return;
      form.style.display =
        form.style.display === "none" || !form.style.display ? "block" : "none";
    };
  }

  // -----------------------------------------------
  // Modal de Finalizar compra + integración Checkout
  // -----------------------------------------------
  function initCheckout(cart) {
    // Abrir/cerrar modal (usados por botones del HTML)
    window.mostrarModalCheckout = function () {
      const modal = $("#modal-checkout");
      if (modal) modal.style.display = "flex";
    };
    window.cerrarModalCheckout = function () {
      const modal = $("#modal-checkout");
      if (modal) modal.style.display = "none";
    };

   const formEl = document.getElementById("form-checkout");
    if (!formEl) return;
try{
  const perf = JSON.parse(localStorage.getItem("nogalia_profile_v1")||"null");
  if (perf){
    const $=(s,c=document)=>c.querySelector(s);
    $("#nombre")    && ($("#nombre").value    = perf.nombre || "");
    $("#contacto")  && ($("#contacto").value  = perf.contacto || "");
    $("#direccion") && ($("#direccion").value = perf.direccion || "");
  }
}catch{}



    // Evitar listeners duplicados si se re-inicializa
    if (formEl._onSubmitBound) {
      formEl.removeEventListener("submit", formEl._onSubmitBound);
    }

  const onSubmit = (event) => {
  event.preventDefault();

  const nombre = $("#nombre")?.value.trim();
  let contactoRaw = $("#contacto")?.value.trim() || "";
  const direccion = $("#direccion")?.value.trim();
  const metodo = ($("#metodo")?.value || "").toLowerCase();

  // limpiar todo lo que no sea dígito o '+'
  const contacto = contactoRaw
    .replace(/\s+/g, "")     // sin espacios
    .replace(/[^\d+]/g, ""); // permitir sólo dígitos y '+' inicial

  const soloDigitos = contacto.startsWith("+")
    ? contacto.slice(1)
    : contacto;

  const largoOk = soloDigitos.length >= 7 && soloDigitos.length <= 15;
  const todoOk = nombre && direccion && metodo && largoOk && (/^\+?\d{7,15}$/.test(contacto));

  if (!todoOk) {
    alert("Revisá los datos.\n- Teléfono: sólo números (7 a 15 dígitos).");
    return;
  }

  // Cerrar modal
  const modal = $("#modal-checkout");
  if (modal) modal.style.display = "none";

  // Seguir al pago / confirmación
  Checkout.pagar(cart, { nombre, contacto, direccion, metodo });
};

    formEl.addEventListener("submit", onSubmit);
    formEl._onSubmitBound = onSubmit;
  }

  // -----------------------------
  // Init maestro
  // -----------------------------
  function init(cart) {
    initClicksProductos(cart);
    initBuscador();
    initToggleCarrito();
    initMenuLateral();
    initToggleServicios();
    initCheckout(cart);
    renderCarrito(cart); // primera pintura del carrito
  }

  return {
    init,
    renderCarrito,
    showToast
  };
})();


