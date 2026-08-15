/* =========================================================
   PassTrust - admin.js
   Connexion administrateur avec Supabase
   ========================================================= */

/* ---------- Configuration Supabase ---------- */

const SUPABASE_URL =
  "https://aohplqbwwbxxpkpmapxk.supabase.co/";

const SUPABASE_KEY =
  "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH";

const SITE_URL =
  "https://mayzula7-cloud.github.io/PassTrust-Projet/";

const ADMIN_URL =
  "https://mayzula7-cloud.github.io/PassTrust-Projet/admin.html";

/* ---------- Vérification du SDK ---------- */

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error(
    "Supabase SDK introuvable. Vérifie l'ordre des scripts dans admin.html."
  );
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* ---------- Éléments HTML ---------- */

const authPanel = document.querySelector("#auth-panel");
const dashboardPanel = document.querySelector("#dashboard-panel");

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#current-email");

const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");

const currentEmail = document.querySelector("#current-email-display");
const logoutButton = document.querySelector("#logout-button");
const refreshButton = document.querySelector("#refresh-button");

const leadsList = document.querySelector("#leads-list");
const leadCount = document.querySelector("#lead-count");

/* ---------- Vérification des éléments ---------- */

if (!loginForm) {
  console.warn("Élément #login-form introuvable.");
}

if (!emailInput) {
  console.warn("Élément #current-email introuvable.");
}

/* ---------- Fonctions d'affichage ---------- */

function showLogin() {
  if (authPanel) {
    authPanel.classList.remove("hidden");
  }

  if (dashboardPanel) {
    dashboardPanel.classList.add("hidden");
  }

  if (currentEmail) {
    currentEmail.textContent = "";
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

  if (currentEmail) {
    currentEmail.textContent = email || "";
  }
}

function showError(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = "error";
}

function showSuccess(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = "success";
}

function clearMessage(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "";
}

/* ---------- Messages d'erreur lisibles ---------- */

function getReadableError(error) {
  if (!error) {
    return "Une erreur inconnue est survenue.";
  }

  const message = String(error.message || error);

  if (
    message.toLowerCase().includes("invalid path") ||
    message.toLowerCase().includes("invalid path specified")
  ) {
    return (
      "URL Supabase invalide. Vérifie que SUPABASE_URL se termine " +
      "uniquement par .supabase.co."
    );
  }

  if (
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("network")
  ) {
    return (
      "Connexion impossible à Supabase. Vérifie ta connexion Internet " +
      "et l'URL du projet."
    );
  }

  if (
    message.toLowerCase().includes("invalid api key") ||
    message.toLowerCase().includes("apikey")
  ) {
    return "Clé Supabase invalide. Vérifie la clé publiable.";
  }

  if (
    message.toLowerCase().includes("email not confirmed") ||
    message.toLowerCase().includes("email_not_confirmed")
  ) {
    return "Cette adresse email n'a pas encore été confirmée.";
  }

  if (
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("too many requests")
  ) {
    return "Trop de demandes. Attends quelques minutes avant de réessayer.";
  }

  if (
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("permission denied")
  ) {
    return (
      "Accès refusé par Supabase. Vérifie les politiques RLS " +
      "de tes tables."
    );
  }

  return message;
}

/* ---------- Validation de l'email ---------- */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- Envoi du lien de connexion ---------- */

async function sendLoginLink(email) {
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    throw new Error("Veuillez saisir une adresse email.");
  }

  if (!isValidEmail(cleanEmail)) {
    throw new Error("Veuillez saisir une adresse email valide.");
  }

  /*
    Le lien reçu par email redirigera vers cette page.
    Cette adresse doit être autorisée dans Supabase :
    Authentication > Configuration de l'URL
  */

  const { error } =
    await supabaseClient.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: ADMIN_URL
    });

  if (error) {
    throw error;
  }
}

/* ---------- Connexion avec le lien de récupération ---------- */

async function handleRecoverySession() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Erreur de session :", error);
    return;
  }

  if (session && session.user) {
    showDashboard(session.user.email);
    await loadLeads();
  } else {
    showLogin();
  }
}

/* ---------- Écoute des changements de session ---------- */

supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session && session.user) {
    showDashboard(session.user.email);

    if (event !== "INITIAL_SESSION") {
      await loadLeads();
    }
  } else {
    showLogin();
  }
});

/* ---------- Soumission du formulaire ---------- */

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessage(loginMessage);

    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      showError(loginMessage, "Veuillez saisir votre adresse email.");
      return;
    }

    const submitButton = loginForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    showSuccess(loginMessage, "Envoi du lien en cours...");

    try {
      await sendLoginLink(email);

      showSuccess(
        loginMessage,
        "Le lien a été envoyé. Vérifie ta boîte email et tes spams."
      );
    } catch (error) {
      console.error("Erreur Supabase :", error);
      showError(loginMessage, getReadableError(error));
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

/* ---------- Déconnexion ---------- */

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    clearMessage(dashboardMessage);

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Erreur de déconnexion :", error);
      showError(dashboardMessage, getReadableError(error));
      return;
    }

    showLogin();
  });
}

/* ---------- Chargement des demandes ---------- */

async function loadLeads() {
  if (!leadsList) {
    return;
  }

  leadsList.innerHTML = `
    <p class="loading">Chargement des demandes...</p>
  `;

  clearMessage(dashboardMessage);

  /*
    Le code essaie d'abord la table "leads".
    Si ta table possède un autre nom, remplace "leads"
    par le nom exact de ta table Supabase.
  */

  const { data, error } = await supabaseClient
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur de chargement des demandes :", error);

    leadsList.innerHTML = "";

    showError(
      dashboardMessage,
      "Impossible de charger les demandes : " +
        getReadableError(error)
    );

    if (leadCount) {
      leadCount.textContent = "0";
    }

    return;
  }

  renderLeads(data || []);
}

/* ---------- Affichage des demandes ---------- */

function renderLeads(leads) {
  if (!leadsList) {
    return;
  }

  if (leadCount) {
    leadCount.textContent = String(leads.length);
  }

  if (!leads.length) {
    leadsList.innerHTML = `
      <p class="empty">
        Aucune demande pour le moment.
      </p>
    `;
    return;
  }

  leadsList.innerHTML = leads
    .map((lead) => {
      const name = escapeHtml(
        lead.name ||
          lead.full_name ||
          lead.nom ||
          "Utilisateur sans nom"
      );

      const email = escapeHtml(
        lead.email ||
          lead.user_email ||
          lead.email_address ||
          "Email non renseigné"
      );

      const message = escapeHtml(
        lead.message ||
          lead.description ||
          lead.details ||
          "Aucun détail"
      );

      const status = escapeHtml(
        lead.status ||
          lead.statut ||
          "Nouvelle"
      );

      const createdAt = formatDate(
        lead.created_at ||
          lead.createdAt ||
          lead.date_creation
      );

      return `
        <article class="lead-card">
          <div class="lead-header">
            <h3>${name}</h3>
            <span class="lead-status">${status}</span>
          </div>

          <p class="lead-email">${email}</p>
          <p class="lead-message">${message}</p>
          <small class="lead-date">${createdAt}</small>
        </article>
      `;
    })
    .join("");
}

/* ---------- Actualisation ---------- */

if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    await loadLeads();
  });
}

/* ---------- Utilitaires ---------- */

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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/* ---------- Démarrage ---------- */

(async function initAdmin() {
  try {
    await handleRecoverySession();
  } catch (error) {
    console.error("Erreur au démarrage :", error);
    showLogin();
  }
})();
