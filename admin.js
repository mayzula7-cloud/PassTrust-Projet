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

const supabaseClient =
  window.supabase.createClient(
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


/* ---------- Affichage ---------- */

function showLogin() {
  authPanel?.classList.remove("hidden");
  dashboardPanel?.classList.add("hidden");

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
  authPanel?.classList.add("hidden");
  dashboardPanel?.classList.remove("hidden");

  if (currentEmailDisplay) {
    currentEmailDisplay.textContent =
      email || "";
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
    lowerMessage.includes(
      "invalid login credentials"
    )
  ) {
    return "Email ou mot de passe incorrect.";
  }

  if (
    lowerMessage.includes(
      "email not confirmed"
    )
  ) {
    return "Ton adresse email n'est pas confirmée.";
  }

  if (
    lowerMessage.includes("invalid api key") ||
    lowerMessage.includes("apikey")
  ) {
    return "Clé Supabase invalide.";
  }

  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network")
  ) {
    return "Connexion impossible à Supabase.";
  }

  if (
    lowerMessage.includes("permission denied") ||
    lowerMessage.includes(
      "row-level security"
    )
  ) {
    return "Accès refusé par les règles RLS.";
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
    await supabaseClient.auth
      .signInWithPassword({
        email: cleanEmail,
        password
      });

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error(
      "Aucun utilisateur connecté."
    );
  }

  return data;
}


/* ---------- Formulaire de connexion ---------- */

if (loginForm) {
  loginForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      clearMessage(loginMessage);

      const email =
        emailInput?.value.trim() || "";

      const password =
        passwordInput?.value || "";

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
    await supabaseClient.auth
      .getSession();

  if (error) {
    console.error(
      "Erreur de session :",
      error
    );

    showLogin();
    return;
  }

  const session =
    data?.session || null;

  if (session?.user) {
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
  (event, session) => {
    if (
      event === "SIGNED_IN" &&
      session?.user
    ) {
      showDashboard(
        session.user.email
      );

      setTimeout(() => {
        loadLeads();
      }, 0);
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
        await supabaseClient.auth
          .signOut();

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
      .from("conduit")
      .select("*")
      .order(
        "créé_at",
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
        const mode =
          escapeHtml(
            lead.mode ||
            "Demande"
          );

        const name =
          escapeHtml(
            lead.nom ||
            "Nom non renseigné"
          );

        const email =
          escapeHtml(
            lead.courriel ||
            "Email non renseigné"
          );

        const need =
          escapeHtml(
            lead.besoin ||
            "Besoin non renseigné"
          );

        const city =
          escapeHtml(
            lead.ville ||
            "Ville non renseignée"
          );

        const status =
          escapeHtml(
            lead.statut ||
            "Nouvelle"
          );

        const notes =
          escapeHtml(
            lead.notes ||
            "Aucune note"
          );

        const date =
          formatDate(
            lead["créé_at"]
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

            <p>
              <strong>Mode :</strong>
              ${mode}
            </p>

            <p>
              <strong>Besoin :</strong>
              ${need}
            </p>

            <p>
              <strong>Ville :</strong>
              ${city}
            </p>

            <p class="lead-message">
              ${notes}
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
