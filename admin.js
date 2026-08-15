/* =========================================================
   PassTrust - admin.js
   Connexion administrateur avec Supabase
   ========================================================= */


/* ---------- Configuration ---------- */

const SUPABASE_URL =
  "https://aohplqbwwbxxpkpmapxk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH";


/* ---------- Initialisation Supabase ---------- */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {
  throw new Error(
    "Le SDK Supabase est introuvable. Vérifie admin.html."
  );
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* ---------- Éléments HTML ---------- */

const authPanel =
  document.querySelector("#auth-panel");

const dashboardPanel =
  document.querySelector("#dashboard-panel");

const loginForm =
  document.querySelector("#login-form");

const emailInput =
  document.querySelector("#current-email");

const passwordInput =
  document.querySelector("#admin-password");

const loginMessage =
  document.querySelector("#login-message");

const dashboardMessage =
  document.querySelector("#dashboard-message");

const currentEmailDisplay =
  document.querySelector("#current-email-display");

const logoutButton =
  document.querySelector("#logout-button");

const refreshButton =
  document.querySelector("#refresh-button");

const leadsList =
  document.querySelector("#leads-list");

const leadCount =
  document.querySelector("#lead-count");


/* ---------- Vérification du formulaire ---------- */

if (!loginForm) {
  console.error(
    "Le formulaire #login-form est introuvable."
  );
}

if (!emailInput) {
  console.error(
    "Le champ #current-email est introuvable."
  );
}

if (!passwordInput) {
  console.error(
    "Le champ #admin-password est introuvable."
  );
}


/* ---------- Affichage ---------- */

function showLogin() {
  if (authPanel) {
    authPanel.classList.remove("hidden");
  }

  if (dashboardPanel) {
    dashboardPanel.classList.add("hidden");
  }

  if (currentEmailDisplay) {
    currentEmailDisplay.textContent = "";
  }

  if (leadsList) {
    leadsList.innerHTML = "";
  }

  if (leadCount) {
    leadCount.textContent = "0";
  }
}


function showDashboard(email) {
  if (authPanel) {
    authPanel.classList.add("hidden");
  }

  if (dashboardPanel) {
    dashboardPanel.classList.remove("hidden");
  }

  if (currentEmailDisplay) {
    currentEmailDisplay.textContent = email || "";
  }
}


function clearMessage(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "message";
}


function showError(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = "message error";
}


function showSuccess(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = "message success";
}


/* ---------- Messages d'erreur ---------- */

function readableError(error) {
  if (!error) {
    return "Une erreur inconnue est survenue.";
  }

  const message =
    String(error.message || error);

  const lowerMessage =
    message.toLowerCase();

  if (
    lowerMessage.includes("invalid login credentials")
  ) {
    return (
      "Email ou mot de passe incorrect."
    );
  }

  if (
    lowerMessage.includes("email not confirmed")
  ) {
    return (
      "Ton adresse email n'est pas confirmée."
    );
  }

  if (
    lowerMessage.includes("invalid api key") ||
    lowerMessage.includes("apikey")
  ) {
    return (
      "Clé Supabase invalide. Vérifie SUPABASE_KEY."
    );
  }

  if (
    lowerMessage.includes("invalid path") ||
    lowerMessage.includes(
      "invalid path specified"
    )
  ) {
    return (
      "URL Supabase invalide. Elle doit se terminer " +
      "uniquement par .supabase.co."
    );
  }

  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network")
  ) {
    return (
      "Connexion impossible à Supabase. " +
      "Vérifie ta connexion Internet."
    );
  }

  if (
    lowerMessage.includes("permission denied") ||
    lowerMessage.includes("row-level security")
  ) {
    return (
      "Accès refusé par les règles RLS de Supabase."
    );
  }

  if (
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("rate limit")
  ) {
    return (
      "Trop de tentatives. Attends quelques minutes."
    );
  }

  return message;
}


/* ---------- Connexion admin ---------- */

async function loginAdmin(email, password) {
  const cleanEmail =
    email.trim();

  if (!cleanEmail) {
    throw new Error(
      "Veuillez saisir votre adresse email."
    );
  }

  if (!password) {
    throw new Error(
      "Veuillez saisir votre mot de passe."
    );
  }

  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

  if (error) {
    throw error;
  }

  if (!data || !data.user) {
    throw new Error(
      "Aucun utilisateur connecté."
    );
  }

  return data;
}


/* ---------- Écouteur du formulaire ---------- */

if (loginForm) {
  loginForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      clearMessage(loginMessage);

      const email =
        emailInput
          ? emailInput.value.trim()
          : "";

      const password =
        passwordInput
          ? passwordInput.value
          : "";

      if (!email) {
        showError(
          loginMessage,
          "Veuillez saisir votre adresse email."
        );
        return;
      }

      if (!password) {
        showError(
          loginMessage,
          "Veuillez saisir votre mot de passe."
        );
        return;
      }

      const submitButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
      }

      showSuccess(
        loginMessage,
        "Connexion en cours..."
      );

      try {
        const data =
          await loginAdmin(
            email,
            password
          );

        showDashboard(
          data.user.email
        );

        await loadLeads();

        if (passwordInput) {
          passwordInput.value = "";
        }
      } catch (error) {
        console.error(
          "Erreur de connexion :",
          error
        );

        showError(
          loginMessage,
          readableError(error)
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    }
  );
}


/* ---------- Session existante ---------- */

async function checkSession() {
  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();

  if (error) {
    console.error(
      "Erreur de session :",
      error
    );
    showLogin();
    return;
  }

  const session =
    data
      ? data.session
      : null;

  if (session && session.user) {
    showDashboard(
      session.user.email
    );

    await loadLeads();
  } else {
    showLogin();
  }
}


/* ---------- Écoute des changements ---------- */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {
    if (
      event === "SIGNED_IN" &&
      session &&
      session.user
    ) {
      showDashboard(
        session.user.email
      );

      await loadLeads();
    }

    if (
      event === "SIGNED_OUT"
    ) {
      showLogin();
    }
  }
);


/* ---------- Déconnexion ---------- */

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async () => {
      clearMessage(
        dashboardMessage
      );

      const {
        error
      } =
        await supabaseClient.auth.signOut();

      if (error) {
        showError(
          dashboardMessage,
          readableError(error)
        );
        return;
      }

      showLogin();
    }
  );
}


/* ---------- Chargement des demandes ---------- */

async function loadLeads() {
  if (!leadsList) {
    return;
  }

  leadsList.innerHTML =
    "<p class='loading'>" +
    "Chargement des demandes..." +
    "</p>";

  clearMessage(
    dashboardMessage
  );

  const {
    data,
    error
  } =
    await supabaseClient
      .from("leads")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {
    console.error(
      "Erreur de chargement :",
      error
    );

    leadsList.innerHTML = "";

    showError(
      dashboardMessage,
      "Impossible de charger les demandes : " +
        readableError(error)
    );

    if (leadCount) {
      leadCount.textContent = "0";
    }

    return;
  }

  renderLeads(
    data || []
  );
}


/* ---------- Affichage des demandes ---------- */

function renderLeads(leads) {
  if (!leadsList) {
    return;
  }

  if (leadCount) {
    leadCount.textContent =
      String(leads.length);
  }

  if (leads.length === 0) {
    leadsList.innerHTML =
      "<p class='empty'>" +
      "Aucune demande pour le moment." +
      "</p>";
    return;
  }

  leadsList.innerHTML =
    leads
      .map((lead) => {
        const name =
          escapeHtml(
            lead.name ||
            lead.full_name ||
            lead.nom ||
            "Utilisateur sans nom"
          );

        const email =
          escapeHtml(
            lead.email ||
            lead.user_email ||
            "Email non renseigné"
          );

        const message =
          escapeHtml(
            lead.message ||
            lead.description ||
            lead.details ||
            "Aucun détail"
          );

        const status =
          escapeHtml(
            lead.status ||
            lead.statut ||
            "Nouvelle"
          );

        const date =
          formatDate(
            lead.created_at ||
            lead.createdAt ||
            lead.date_creation
          );

        return `
          <article class="lead-card">
            <div class="lead-header">
              <h3>${name}</h3>
              <span class="lead-status">
                ${status}
              </span>
            </div>

            <p class="lead-email">
              ${email}
            </p>

            <p class="lead-message">
              ${message}
            </p>

            <small class="lead-date">
              ${date}
            </small>
          </article>
        `;
      })
      .join("");
}


/* ---------- Actualisation ---------- */

if (refreshButton) {
  refreshButton.addEventListener(
    "click",
    async () => {
      await loadLeads();
    }
  );
}


/* ---------- Sécurité HTML ---------- */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(value) {
  if (!value) {
    return "Date inconnue";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "fr-FR",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );
}


/* ---------- Démarrage ---------- */

checkSession();
