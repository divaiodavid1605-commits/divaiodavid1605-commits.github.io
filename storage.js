// Guarda y lee el carrito del localStorage
const LS_KEY = "nogallia_cart_v1";

const Storage = {
  save(state) {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  },
  load() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || { map: {} };
    } catch {
      return { map: {} };
    }
  }
};
