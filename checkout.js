// === CONFIG MP ===
// Pegá aquí tu link real de Mercado Pago (Checkout Pro o Link de pago)
const MP_LINK = "confirmacion.html"; // <-- reemplazar

function genOrderId(){
  const d = new Date();
  return "NG-" + d.getFullYear().toString().slice(-2) +
         (d.getMonth()+1).toString().padStart(2,"0") +
         d.getDate().toString().padStart(2,"0") + "-" +
         Math.random().toString(36).slice(2,7).toUpperCase();
}

const Checkout = {
  pagar(cart, buyer) {
    try {
      const items = cart.items();
      if (!items.length) { alert("Tu carrito está vacío."); return; }

      const order = {
        id: genOrderId(),
        buyer, // {nombre, contacto, direccion, metodo}
        items: items.map(({clave, cantidad, precioUnitario}) => ({clave, cantidad, precioUnitario})),
        total: cart.totalAmount(),
        createdAt: new Date().toISOString()
      };
      sessionStorage.setItem("last_order", JSON.stringify(order));

      const metodo = (buyer.metodo || "").toLowerCase();

      // Feedback inmediato
      console.log("[Checkout] Orden lista:", order);
      alert("Procesando tu pedido…");

      if (metodo.includes("mercado")) {
        // Si no configuraste MP_LINK, avisamos y vamos a confirmación
        if (!MP_LINK || MP_LINK.includes("confirmacion.html")) {
          alert("⚠️ Falta configurar tu link de Mercado Pago en assets/js/checkout.js.\nTe llevamos igual a la página de confirmación para probar el flujo.");
          window.location.href = "confirmacion.html?status=pending";
          return;
        }
        window.location.href = MP_LINK;
        return;
      }

      if (metodo.includes("transfer")) {
        alert("Datos para transferencia:\nAlias: NOGALLIA.ALMENDRAS\nCBU: 0000000000000000000000\nTitular: Nogallia");
        window.location.href = "confirmacion.html";
        return;
      }

      // Efectivo / default
      window.location.href = "confirmacion.html?status=pending";
    } catch (err) {
      console.error("[Checkout] Error:", err);
      alert("Ocurrió un error. Te llevamos a la confirmación como pendiente.");
      window.location.href = "confirmacion.html";
    }
  }
};

