/* =========================================================
   PassTrust - admin.js
   Dashboard administrateur Supabase
   ========================================================= */


/* ---------- Configuration ---------- */

const SUPABASE_URL =
  "https://aohplqbwwbxxpkpmapxk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH";


/* ---------- Initialisation ---------- */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {
  throw new Error(
    "Le SDK Supabase est introuvable."
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


/* ---------- Constantes ---------- */

const STATUS_VALUES = [
  "Nouvelle",
  "En cours",
  "Terminée"
];


/* ---------- Interface ---------- */

function showLogin() {
  authPanel.classList.remove("hidden");
  dashboardPanel.classList.add("hidden");
  currentEmailDisplay.textContent = "";
  leadCount.textContent = "0";

  leadsList.innerHTML = `
    <p class="loading">
      Connexion nécessaire pour afficher les demandes.
    </p>
  `;
}


function showDashboard(email) {
  authPanel.classList.add("hidden");
  dashboardPanel.classList.remove("hidden");
  currentEmailDisplay.textContent = email || "";
}


function clearMessage(element) {
  element.textContent = "";
  element.className = "message";
}


function showError(element, message) {
  element.textContent = message;
  element.className = "message error";
}


function showSuccess(element, message) {
  element.textContent = message;
  element.className = "message success";
}


/* ---------- Erreurs ---------- */

function readableError(error) {
  if (!error) {
    return "Une erreur inconnue est survenue.";
  }

  const message =
    String(error.message || error);

  const lower =
    message.toLowerCase();

  if (
    lower.includes(
      "invalid login credentials"
    )
  ) {
    return "Email ou mot de passe incorrect.";
  }

  if (
    lower.includes(
      "email not confirmed"
    )
  ) {
    return "Ton adresse email n'est pas confirmée.";
  }

  if (
    lower.includes("invalid api key") ||
    lower.includes("apikey")
  ) {
    return "Clé Supabase invalide.";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "Connexion impossible à Supabase.";
  }

  if (
    lower.includes("permission denied") ||
    lower.includes("row-level security")
  ) {
    return "Accès refusé par les règles RLS.";
  }

  if (
    lower.includes("does not exist")
  ) {
    return "Table ou colonne introuvable.";
  }

  return message;
}


/* ---------- Connexion ---------- */

async function loginAdmin(
  email,
  password
) {
  const cleanEmail =
    email.trim();

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


loginForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearMessage(
      loginMessage
    );

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

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

    submitButton.disabled = true;

    showSuccess(
      loginMessage,
      "Connexion en cours..."
    );

    try {
      const result =
        await loginAdmin(
          email,
          password
        );

      showDashboard(
        result.user.email
      );

      await loadLeads();

      passwordInput.value = "";
      clearMessage(loginMessage);
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
      submitButton.disabled = false;
    }
  }
);


/* ---------- Session ---------- */

async function checkSession() {
  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();

  if (error) {
    showLogin();

    showError(
      loginMessage,
      readableError(error)
    );

    return;
  }

  if (data?.session?.user) {
    showDashboard(
      data.session.user.email
    );

    await loadLeads();
  } else {
    showLogin();
  }
}


supabaseClient.auth.onAuthStateChange(
  (event, session) => {
    if (
      event === "SIGNED_IN" &&
      session?.user
    ) {
      showDashboard(
        session.user.email
      );

      loadLeads();
    }

    if (
      event === "SIGNED_OUT"
    ) {
      showLogin();
    }
  }
);


/* ---------- Déconnexion ---------- */

logoutButton.addEventListener(
  "click",
  async () => {
    logoutButton.disabled = true;

    const {
      error
    } =
      await supabaseClient.auth
        .signOut();

    logoutButton.disabled = false;

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


/* ---------- Chargement ---------- */

async function loadLeads() {
  leadsList.innerHTML = `
    <p class="loading">
      Chargement des demandes...
    </p>
  `;

  clearMessage(
    dashboardMessage
  );

  const {
    data,
    error
  } =
    await supabaseClient
      .from("conduit")
      .select(`
        identifiant,
        mode,
        nom,
        courriel,
        besoin,
        ville,
        statut,
        notes,
        créé_at
      `)
      .order(
        "créé_at",
        {
          ascending: false
        }
      );

  if (error) {
    leadsList.innerHTML = "";

    showError(
      dashboardMessage,
      readableError(error)
    );

    leadCount.textContent = "0";

    return;
  }

  renderLeads(
    Array.isArray(data)
      ? data
      : []
  );
}


/* ---------- Affichage ---------- */

function renderLeads(leads) {
  leadCount.textContent =
    String(leads.length);

  if (leads.length === 0) {
    leadsList.innerHTML = `
      <p class="empty">
        Aucune demande pour le moment.
      </p>
    `;

    return;
  }

  leadsList.innerHTML =
    leads
      .map(
        (lead) => {
          const id =
            escapeHtml(
              lead.identifiant || ""
            );

          const status =
            STATUS_VALUES.includes(
              lead.statut
            )
              ? lead.statut
              : "Nouvelle";

          return `
            <article
              class="lead-card"
              data-lead-id="${id}"
            >
              <div class="lead-header">
                <h3>
                  ${escapeHtml(
                    lead.nom ||
                      "Nom non renseigné"
                  )}
                </h3>

                <span class="lead-status">
                  ${escapeHtml(status)}
                </span>
              </div>

              <p class="lead-email">
                ${escapeHtml(
                  lead.courriel ||
                    "Email non renseigné"
                )}
              </p>

              <p class="lead-info">
                <strong>Mode :</strong>
                ${escapeHtml(
                  lead.mode ||
                    "Demande"
                )}
              </p>

              <p class="lead-info">
                <strong>Besoin :</strong>
                ${escapeHtml(
                  lead.besoin ||
                    "Non renseigné"
                )}
              </p>

              <p class="lead-info">
                <strong>Ville :</strong>
                ${escapeHtml(
                  lead.ville ||
                    "Non renseignée"
                )}
              </p>

              <p class="lead-message">
                <strong>Notes :</strong>
                ${escapeHtml(
                  lead.notes ||
                    "Aucune note"
                )}
              </p>

              <div class="lead-controls">
                <label
                  for="status-${id}"
                >
                  Modifier le statut
                </label>

                <select
                  id="status-${id}"
                  class="status-select"
                  data-lead-id="${id}"
                >
                  <option
                    value="Nouvelle"
                    ${
                      status === "Nouvelle"
                        ? "selected"
                        : ""
                    }
                  >
                    Nouvelle
                  </option>

                  <option
                    value="En cours"
                    ${
                      status === "En cours"
                        ? "selected"
                        : ""
                    }
                  >
                    En cours
                  </option>

                  <option
                    value="Terminée"
                    ${
                      status === "Terminée"
                        ? "selected"
                        : ""
                    }
                  >
                    Terminée
                  </option>
                </select>

                <button
                  type="button"
                  class="status-button"
                  data-action="update-status"
                  data-lead-id="${id}"
                >
                  Enregistrer
                </button>
              </div>

              <small class="lead-date">
                ${formatDate(
                  lead["créé_at"]
                )}
              </small>
            </article>
          `;
        }
      )
      .join("");
}


/* ---------- Modification statut ---------- */

async function updateLeadStatus(
  id,
  status
) {
  if (!STATUS_VALUES.includes(status)) {
    showError(
      dashboardMessage,
      "Statut invalide."
    );

    return false;
  }

  const {
    error
  } =
    await supabaseClient
      .from("conduit")
      .update({
        statut: status
      })
      .eq(
        "identifiant",
        id
      );

  if (error) {
    showError(
      dashboardMessage,
      readableError(error)
    );

    return false;
  }

  showSuccess(
    dashboardMessage,
    "Statut modifié avec succès."
  );

  return true;
}


leadsList.addEventListener(
  "click",
  async (event) => {
    const button =
      event.target.closest(
        '[data-action="update-status"]'
      );

    if (!button) {
      return;
    }

    const card =
      button.closest(
        ".lead-card"
      );

    const select =
      card.querySelector(
        ".status-select"
      );

    button.disabled = true;

    const success =
      await updateLeadStatus(
        button.dataset.leadId,
        select.value
      );

    if (success) {
      await loadLeads();
    }

    button.disabled = false;
  }
);


/* ---------- Actualisation manuelle ---------- */

refreshButton.addEventListener(
  "click",
  async () => {
    refreshButton.disabled = true;
    await loadLeads();
    refreshButton.disabled = false;
  }
);


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

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return escapeHtml(value);
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
