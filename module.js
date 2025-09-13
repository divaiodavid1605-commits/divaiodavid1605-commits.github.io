
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
  import {
    getAuth, fetchSignInMethodsForEmail, signInWithEmailAndPassword,
    sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup,
    RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword
  } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
  import {
    getFirestore, doc, setDoc, getDoc
  } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

  // 🔧 Pega tu configuración real de Firebase:
  const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "nogalia.firebaseapp.com",
  projectId: "nogalia",
  storageBucket: "nogalia.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd1234efgh5678"
};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Helpers
  const $ = (s,c=document)=>c.querySelector(s);
  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
  const isPhone = (v) => /^\+?\d{7,15}$/.test(v.trim().replace(/\s+/g,""));
  const open = (id)=>{ $("#auth-modal").style.display="flex";
    ["identity","password","sms","register"].forEach(k=>$("#auth-step-"+k).style.display="none");
    $("#auth-step-"+id).style.display="block"; };
  const close = ()=> $("#auth-modal").style.display="none";

  // Abrir modal desde el botón existente “Acceder”
  document.querySelector(".btn-acceder")?.addEventListener("click",(e)=>{e.preventDefault(); open("identity"); $("#auth-msg").textContent="";});
  $("#auth-close")?.addEventListener("click", close);

  // Continuar (decide ruta: email o teléfono)
  let pendingPhoneConfirm = null;
  $("#auth-continue").addEventListener("click", async ()=>{
    const id = $("#auth-identifier").value.trim();
    $("#auth-msg").textContent = "";
    try{
      if (isEmail(id)) {
        const methods = await fetchSignInMethodsForEmail(auth, id);
        if (methods.includes("password")) {
          $("#auth-identified").textContent = id;
          open("password");
        } else if (methods.includes("google.com")) {
          $("#auth-msg").textContent = "Esta cuenta usa Google. Iniciá con el botón Google.";
        } else {
          $("#auth-msg").textContent = "No existe una cuenta con ese email.";
          // Ofrecemos crear cuenta
        }
      } else if (isPhone(id)) {
        // Asumimos ingreso por SMS (sin contraseña)
        $("#auth-sms-to").textContent = `Vamos a enviarte un código SMS al ${id}`;
        open("sms");
        // reCAPTCHA invisible/compacto
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        }
        pendingPhoneConfirm = await signInWithPhoneNumber(auth, id, window.recaptchaVerifier);
        $("#auth-sms-msg").textContent = "Te enviamos el código por SMS.";
      } else {
        $("#auth-msg").textContent = "Ingresá un email válido o un teléfono (299...).";
      }
    } catch(err){
      $("#auth-msg").textContent = err.message || "Error al continuar.";
    }
  });

  // Google
  $("#btn-google").addEventListener("click", async ()=>{
    try{
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await ensureProfile(res.user); // guarda perfil si no existe
      close();
      alert("Sesión iniciada con Google.");
    }catch(err){ $("#auth-msg").textContent = err.message; }
  });

  // Volver
  $("#auth-back")?.addEventListener("click",(e)=>{e.preventDefault(); open("identity");});
  $("#auth-back-sms")?.addEventListener("click",(e)=>{e.preventDefault(); open("identity");});

  // Login con contraseña
  $("#auth-login").addEventListener("click", async ()=>{
    const email = $("#auth-identified").textContent;
    const pass  = $("#auth-password").value;
    $("#auth-pass-msg").textContent = "";
    try{
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await ensureProfile(res.user);
      close();
      alert("Sesión iniciada.");
    }catch(err){
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password"){
        $("#auth-pass-msg").textContent = "Contraseña incorrecta. Podés recuperar tu contraseña.";
      }else{
        $("#auth-pass-msg").textContent = err.message;
      }
    }
  });

  // Recuperar contraseña
  $("#auth-forgot")?.addEventListener("click", async (e)=>{
    e.preventDefault();
    const email = $("#auth-identified").textContent.trim();
    if (!email) return;
    try{
      await sendPasswordResetEmail(auth, email);
      $("#auth-pass-msg").textContent = "Te enviamos un correo para restablecer la contraseña.";
    }catch(err){ $("#auth-pass-msg").textContent = err.message; }
  });

  // Verificar SMS
  $("#auth-verify-sms").addEventListener("click", async ()=>{
    const code = $("#auth-sms-code").value.trim();
    $("#auth-sms-msg").textContent = "";
    try{
      if (!pendingPhoneConfirm) throw new Error("Reiniciá el proceso.");
      const res = await pendingPhoneConfirm.confirm(code);
      await ensureProfile(res.user);
      close();
      alert("Sesión iniciada por SMS.");
    }catch(err){ $("#auth-sms-msg").textContent = err.message; }
  });

  // Ir a crear cuenta
  $("#auth-go-register").addEventListener("click",(e)=>{ e.preventDefault(); open("register"); });

  // Crear cuenta (email+contraseña) y guardar perfil
  $("#reg-create").addEventListener("click", async ()=>{
    const email = $("#reg-email").value.trim().toLowerCase();
    const phone = $("#reg-phone").value.trim();
    const pass  = $("#reg-pass").value;
    const nombre = $("#reg-nombre").value.trim();
    const direccion = $("#reg-direccion").value.trim();
    const contacto = $("#reg-contacto").value.trim();
    $("#reg-msg").textContent = "";
    if (!email || pass.length<6 || !nombre || !direccion || !contacto){
      $("#reg-msg").textContent = "Completá email, contraseña (6+), nombre, dirección y contacto.";
      return;
    }
    try{
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await setDoc(doc(db,"clientes",cred.user.uid), { email, phone, nombre, direccion, contacto, createdAt:new Date().toISOString() }, { merge:true });
      close();
      alert("Cuenta creada. Sesión iniciada.");
    }catch(err){ $("#reg-msg").textContent = err.message; }
  });

  $("#reg-back").addEventListener("click",(e)=>{ e.preventDefault(); open("identity"); });

  // Si ya existe perfil en Firestore, lo dejamos; si no, lo creamos básico
  async function ensureProfile(user){
    const ref = doc(db,"clientes",user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()){
      await setDoc(ref, { email:user.email || "", nombre:"", direccion:"", contacto:"", createdAt:new Date().toISOString() });
    }
    // además, podemos guardar un espejo local para tu checkout manual:
    const perfilLocal = { email:user.email||"", nombre:snap.data()?.nombre||"", direccion:snap.data()?.direccion||"", contacto:snap.data()?.contacto||"" };
    localStorage.setItem("nogalia_profile_v1", JSON.stringify(perfilLocal));
  }
 function attachEye(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    btn.addEventListener("click", () => {
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      // opcional: cambiar icono
      btn.textContent = isPass ? "🙈" : "👁";
    });
  }

  // --- validación de contraseñas en registro ---
  const regPass  = document.getElementById("reg-pass");
  const regPass2 = document.getElementById("reg-pass2");
  const regMsg   = document.getElementById("reg-pass-msg");
  const regBtn   = document.getElementById("reg-create");

  function validateRegPasswords() {
    if (!regPass || !regPass2 || !regBtn) return;
    const p1 = regPass.value;
    const p2 = regPass2.value;

    let msg = "";
    let ok = true;

    if (p1.length < 6) { msg = "La contraseña debe tener al menos 6 caracteres."; ok = false; }
    if (ok && p2.length === 0) { msg = "Confirmá tu contraseña."; ok = false; }
    if (ok && p1 !== p2) { msg = "Las contraseñas no coinciden."; ok = false; }

    regBtn.disabled = !ok;
    regMsg.textContent = msg;
  }

  // Adjuntar ojos y validación cuando el DOM existe
  document.addEventListener("DOMContentLoaded", () => {
    attachEye("auth-password", "eye-login");
    attachEye("reg-pass", "eye-reg-1");
    attachEye("reg-pass2", "eye-reg-2");

    if (regPass && regPass2) {
      regBtn && (regBtn.disabled = true); // empieza deshabilitado
      ["input","blur"].forEach(evt => {
        regPass.addEventListener(evt, validateRegPasswords);
        regPass2.addEventListener(evt, validateRegPasswords);
      });
    }
  });
