import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH
";
const SUPABASE_KEY = "COLLE_TA_CLE_PUBLIABLE_ICI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const authBox = document.querySelector("#authBox");
const leadsBox = document.querySelector("#leads");
const countBox = document.querySelector("#count");

function showError(message) {
  authBox.innerHTML = `
    <h2>Erreur de configuration</h2>
    <p class="muted">${message}</p>
  `;
}

async function render() {
  authBox.innerHTML = `
    <h2>Connexion admin</h2>
    <form id="loginForm">
      <input type="email" name="email" placeholder="Email admin" required />
      <button type="submit">Recevoir le lien</button>
    </form>
    <p id="loginStatus" class="muted"></p>
  `;

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showError(error.message);
    return;
  }

  const session = data.session;

  if (!session) {
    leadsBox.innerHTML = "";
    countBox.textContent = "Non connecté";
    setupLogin();
    return;
  }

  authBox.innerHTML = `
    <div class="row">
      <div>Connecté : <strong>${session.user.email}</strong></div>
      <button id="logoutBtn">Déconnexion</button>
    </div>
  `;

  document.querySelector("#logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.reload();
  });

  await loadLeads();
}

function setupLogin() {
  const form = document.querySelector("#loginForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = new FormData(form).get("email");
    const status = document.querySelector("#loginStatus");

    status.textContent = "Envoi du lien...";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href
      }
    });

    status.textContent = error
      ? `Erreur : ${error.message}`
      : "Lien envoyé. Vérifie ta boîte email.";
  });
}

async function loadLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    leadsBox.innerHTML = `<p class="muted">Erreur : ${error.message}</p>`;
    return;
  }

  countBox.textContent = `${data.length} demande(s)`;

  if (!data.length) {
    leadsBox.innerHTML = `<p class="muted">Aucune demande pour le moment.</p>`;
    return;
  }

  leadsBox.innerHTML = data.map((lead) => `
    <div class="card">
      <div class="row">
        <strong>${escapeHtml(lead.name)}</strong>
        <span class="muted">${escapeHtml(lead.email)}</span>
        <span class="muted">${escapeHtml(lead.city || "")}</span>
        <select data-id="${lead.id}" class="status">
          ${statusOption("new", lead.status)}
          ${statusOption("contacted", lead.status)}
          ${statusOption("qualified", lead.status)}
          ${statusOption("rejected", lead.status)}
          ${statusOption("converted", lead.status)}
        </select>
      </div>
      <p>${escapeHtml(lead.need)}</p>
      <small class="muted">
        ${new Date(lead.created_at).toLocaleString("fr-FR")}
      </small>
    </div>
  `).join("");

  document.querySelectorAll(".status").forEach((select) => {
    select.addEventListener("change", async () => {
      const { error } = await supabase
        .from("leads")
        .update({ status: select.value })
        .eq("id", select.dataset.id);

      if (error) {
        alert(error.message);
      }
    });
  });
}

function statusOption(value, current) {
  return `
    <option value="${value}" ${value === current ? "selected" : ""}>
      ${value}
    </option>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

supabase.auth.onAuthStateChange(() => {
  render();
});

render();
