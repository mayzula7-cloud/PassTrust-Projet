const SUPABASE_URL = "https://aohplqbwwbxxpkpmapxk.supabase.co";
const SUPABASE_KEY = "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const authPanel = document.querySelector("#auth-panel");
const dashboardPanel = document.querySelector("#dashboard-panel");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const currentEmail = document.querySelector("#current-email");
const logoutButton = document.querySelector("#logout-button");
const refreshButton = document.querySelector("#refresh-button");
const dashboardMessage = document.querySelector("#dashboard-message");
const leadsList = document.querySelector("#leads-list");
const leadCount = document.querySelector("#lead-count");

function showLogin() {
  authPanel.classList.remove("hidden");
  dashboardPanel.classList.add("hidden");
  currentEmail.textContent = "";
  leadsList.innerHTML = "";
  leadCount.textContent = "0";
}

function showDashboard(email) {
  authPanel.classList.add("hidden");
  dashboardPanel.classList.remove("hidden");
  currentEmail.textContent = email;
}

function showError(element, message) {
  element.className = "error";
  element.textContent = message;
}

function showSuccess(element, message) {
  element.className = "success";
  element.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusOptions(currentStatus) {
  const statuses = [
    ["new", "Nouvelle"],
    ["contacted", "Contactée"],
    ["qualified", "Qualifiée"],
    ["rejected", "Refusée"],
    ["converted", "Convertie"]
  ];

  return statuses.map(([value, label]) => `
    <option value="${value}" ${currentStatus === value ? "selected" : ""}>
      ${label}
    </option>
  `).join("");
}

async function loadLeads() {
  dashboardMessage.className = "muted";
  dashboardMessage.textContent = "Chargement des demandes...";
  leadsList.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showError(dashboardMessage, `Erreur de lecture des demandes :\n${error.message}`);
    return;
  }

  const leads = data || [];
  leadCount.textContent = String(leads.length);

  if (leads.length === 0) {
    dashboardMessage.className = "muted";
    dashboardMessage.textContent = "Aucune demande pour le moment.";
    return;
  }

  dashboardMessage.textContent = "";

  leadsList.innerHTML = leads.map((lead) => `
    <article class="lead-card">
      <div class="row">
        <strong>${escapeHtml(lead.name)}</strong>
        <span class="muted">${escapeHtml(lead.email)}</span>
        <span class="muted">${escapeHtml(lead.city)}</span>
        <span class="badge">
          ${lead.mode === "offer" ? "Peut aider" : "Besoin d'aide"}
        </span>

        <select
          class="status-select"
          data-lead-id="${escapeHtml(lead.id)}"
          aria-label="Statut de la demande"
        >
          ${statusOptions(lead.status)}
        </select>
      </div>

      <p>${escapeHtml(lead.need)}</p>

      <small class="muted">
        ${new Date(lead.created_at).toLocaleString("fr-FR")}
      </small>
    </article>
  `).join("");

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const leadId = select.dataset.leadId;
      const newStatus = select.value;

      const { error: updateError } = await supabaseClient
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (updateError) {
        alert(`Erreur de mise à jour : ${updateError.message}`);
        await loadLeads();
      }
    });
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.querySelector("#login-email").value.trim();

  loginMessage.className = "muted";
  loginMessage.textContent = "Envoi du lien de connexion...";

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href,
      shouldCreateUser: false
    }
  });

  if (error) {
    showError(loginMessage, error.message);
    return;
  }

  showSuccess(
    loginMessage,
    "Lien envoyé. Vérifie ta boîte email puis clique sur le lien."
  );
});

logoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

refreshButton.addEventListener("click", loadLeads);

async function initialize() {
  if (!window.supabase) {
    showError(
      loginMessage,
      "Le SDK Supabase ne s'est pas chargé. Vérifie la connexion internet."
    );
    return;
  }

  if (
    SUPABASE_URL.includes("COLLE_") ||
    SUPABASE_KEY.includes("COLLE_")
  ) {
    showError(
      loginMessage,
      "Remplace d'abord SUPABASE_URL et SUPABASE_KEY par tes vraies valeurs."
    );
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    showError(loginMessage, error.message);
    return;
  }

  if (!data.session) {
    showLogin();
    return;
  }

  showDashboard(data.session.user.email);
  await loadLeads();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    showDashboard(session.user.email);
    loadLeads();
  } else if (event === "SIGNED_OUT") {
    showLogin();
  }
});

initialize();
