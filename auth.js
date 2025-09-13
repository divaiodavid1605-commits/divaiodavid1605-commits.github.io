// assets/js/auth.js
const AUTH_LS_KEY = "nogalia_user_v1";    // base de “usuarios” locales
const SESSION_LS_KEY = "nogalia_session_v1"; // sesión actual

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
const AuthStorage = {
  getAll(){ try{ return JSON.parse(localStorage.getItem(AUTH_LS_KEY))||{} }catch{ return {} } },
  setAll(db){ localStorage.setItem(AUTH_LS_KEY, JSON.stringify(db||{})) },
  getSession(){ try{ return JSON.parse(localStorage.getItem(SESSION_LS_KEY))||null }catch{ return null } },
  setSession(s){ localStorage.setItem(SESSION_LS_KEY, JSON.stringify(s)) },
  clearSession(){ localStorage.removeItem(SESSION_LS_KEY) },
};
const $ = (s,c=document)=>c.querySelector(s);

function abrirAuth(){ const m=$("#modal-auth"); if(m) m.style.display="flex" }
function cerrarAuth(){ const m=$("#modal-auth"); if(m) m.style.display="none" }

function normalizarTelefono(raw=""){
  const s = raw.trim().replace(/\s+/g,"").replace(/[^\d+]/g,"");
  const body = s.startsWith("+") ? s.slice(1) : s;
  if (body.length<7 || body.length>15) return null;
  if (!/^\+?\d{7,15}$/.test(s)) return null;
  return s;
}

function pintarEstadoSesion(){
  const ses = AuthStorage.getSession();
  const estado = $("#auth-estado");
  const btnAcceder = document.querySelector(".btn-acceder");
  const btnCerrar = $("#btn-cerrar-sesion");
  if (ses?.email){
    if (estado) estado.textContent = `Sesión iniciada: ${ses.email}`;
    if (btnAcceder) btnAcceder.textContent = "Mi cuenta";
    if (btnCerrar) btnCerrar.style.display = "inline-block";
    document.body.classList.add("auth");
  } else {
    if (estado) estado.textContent = "No has iniciado sesión";
    if (btnAcceder) btnAcceder.textContent = "Acceder";
    if (btnCerrar) btnCerrar.style.display = "none";
    document.body.classList.remove("auth");
  }
}

function prefillPerfil(email){
  const db = AuthStorage.getAll();
  const p = db[email||""]?.perfil;
  if (!p) return;
  $("#auth-nombre").value    = p.nombre    || "";
  $("#auth-contacto").value  = p.contacto  || "";
  $("#auth-direccion").value = p.direccion || "";
  $("#auth-notas").value     = p.notas     || "";
}

// Para que el checkout pueda leer el perfil
window.NogaliaAuth = {
  getPerfilActual(){
    const ses = AuthStorage.getSession();
    if (!ses?.email) return null;
    const db = AuthStorage.getAll();
    return db[ses.email]?.perfil || null;
  },
  requirePerfil(){
    const p = this.getPerfilActual();
    if (!p || !p.nombre || !p.contacto || !p.direccion)
      throw new Error("Debes completar tu perfil (nombre, teléfono y dirección).");
    return p;
  }
};

document.addEventListener("DOMContentLoaded", ()=>{
  const btnAcceder = document.querySelector(".btn-acceder");
  const cerrar = $("#cerrar-auth");
  const form = $("#form-auth");
  const btnCerrarSesion = $("#btn-cerrar-sesion");

  // Abrir/cerrar modal
  btnAcceder && btnAcceder.addEventListener("click", (e)=>{
    e.preventDefault(); abrirAuth();
    const ses = AuthStorage.getSession();
    $("#auth-email").value = ses?.email || "";
    if (ses?.email) prefillPerfil(ses.email);
  });
  cerrar && cerrar.addEventListener("click", cerrarAuth);

  // Cerrar sesión
  btnCerrarSesion && btnCerrarSesion.addEventListener("click", ()=>{
    AuthStorage.clearSession(); pintarEstadoSesion(); alert("Sesión cerrada.");
  });

  // Guardar y entrar
  form && form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const email = $("#auth-email").value.trim().toLowerCase();
    const pass  = $("#auth-pass").value;
    const nombre    = $("#auth-nombre").value.trim();
    const contacto  = normalizarTelefono($("#auth-contacto").value);
    const direccion = $("#auth-direccion").value.trim();
    const notas     = $("#auth-notas").value.trim();
    if (!email || !pass || !nombre || !contacto || !direccion){
      alert("Revisá email, contraseña, nombre, teléfono y dirección.");
      return;
    }
    const passHash = await sha256(pass);
    const db = AuthStorage.getAll();

    if (db[email]) {
      if (db[email].passHash !== passHash){ alert("Contraseña incorrecta."); return; }
      db[email].perfil = { email, nombre, contacto, direccion, notas };
    } else {
      db[email] = { passHash, perfil: { email, nombre, contacto, direccion, notas } };
    }

    AuthStorage.setAll(db);
    AuthStorage.setSession({ email });
    pintarEstadoSesion();
    alert("Sesión iniciada y perfil guardado.");
    cerrarAuth();
  });

  pintarEstadoSesion();
});
