// Carrito simple con claves tipo "½ kilo de Almendras"
class Cart {
  constructor() {
    const data = Storage.load();
    this.map = data.map || {}; // { clave: { precioUnitario, cantidad } }
  }

  add(clave, precioUnitario) {
    if (this.map[clave]) this.map[clave].cantidad += 1;
    else this.map[clave] = { precioUnitario, cantidad: 1 };
    this.persist();
  }

  dec(clave) {
    if (!this.map[clave]) return;
    this.map[clave].cantidad -= 1;
    if (this.map[clave].cantidad <= 0) delete this.map[clave];
    this.persist();
  }

  remove(clave) {
    delete this.map[clave];
    this.persist();
  }

  clear() {
    this.map = {};
    this.persist();
  }

  items() {
    return Object.entries(this.map).map(([clave, v]) => ({
      clave,
      ...v,
      subtotal: v.cantidad * v.precioUnitario
    }));
  }

  totalAmount() {
    return this.items().reduce((a, it) => a + it.subtotal, 0);
  }

  persist() {
    Storage.save({ map: this.map });
  }
}
