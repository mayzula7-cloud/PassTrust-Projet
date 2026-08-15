/* =========================================================
   PassTrust - admin.js
   Dashboard administrateur Supabase
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


/* ---------- Constantes ---------- */

const STATUS_VALUES = [
  "Nouvelle",
  "En cours",
  "Terminée"
];


/* ---------- Affichage général ---------- */

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
    leadsList.innerHTML = `
      <p class="loading">
        Connexion nécessaire pour afficher les demandes.
      </p>
    `;
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


/* ---------- Gestion des erreurs ---------- */

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
    ) ||
    lowerMessage.includes(
      "violates row-level security"
    )
  ) {
    return "Accès refusé par les règles RLS de Supabase.";
  }

  if (
    lowerMessage.includes("relation") &&
    lowerMessage.includes("does not exist")
  ) {
    return "La table conduit est introuvable.";
  }

  if (
    lowerMessage.includes("column") &&
    lowerMessage.includes("does not exist")
  ) {
    return "Une colonne utilisée par le dashboard est introuvable.";
  }

  return message;
}


/* ---------- Connexion administrateur ---------- */

async function loginAdmin(
  email,
  password
) {
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

  if (!data || !data.user) {
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

      clearMessage(
        loginMessage
      );

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

        clearMessage(
          loginMessage
        );
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


/* ---------- Vérification de session ---------- */

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

    showError(
      loginMessage,
      readableError(error)
    );

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


/* ---------- Écoute de l'authentification ---------- */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {
    if (
      event === "SIGNED_IN" &&
      session?.user
    ) {
      showDashboard(
        session.user.email
      );

      setTimeout(
        () => {
          loadLeads();
        },
        0
      );
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
}


/* ---------- Chargement des demandes ---------- */

async function loadLeads() {
  if (!leadsList) {
    return;
  }

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
    Array.isArray(data)
      ? data
      : []
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
                "Aucun besoin renseigné"
            );

          const city =
            escapeHtml(
              lead.ville ||
                "Ville non renseignée"
            );

          const status =
            STATUS_VALUES.includes(
              lead.statut
            )
              ? lead.statut
              : "Nouvelle";

          const notes =
            escapeHtml(
              lead.notes ||
                "Aucune note"
            );

          const date =
            formatDate(
              lead["créé_at"]
            );

          const selectedNew =
            status === "Nouvelle"
              ? "selected"
              : "";

          const selectedProgress =
            status === "En cours"
              ? "selected"
              : "";

          const selectedDone =
            status === "Terminée"
              ? "selected"
              : "";

          return `
            <article
              class="lead-card"
              data-lead-id="${id}"
            >
              <div class="lead-header">
                <h3>${name}</h3>

                <span class="lead-status">
                  ${escapeHtml(status)}
                </span>
              </div>

              <p class="lead-email">
                ${email}
              </p>

              <p class="lead-info">
                <strong>Mode :</strong>
                ${mode}
              </p>

              <p class="lead-info">
                <strong>Besoin :</strong>
                ${need}
              </p>

              <p class="lead-info">
                <strong>Ville :</strong>
                ${city}
              </p>

              <p class="lead-message">
                <strong>Notes :</strong>
                ${notes}
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
                    ${selectedNew}
                  >
                    Nouvelle
                  </option>

                  <option
                    value="En cours"
                    ${selectedProgress}
                  >
                    En cours
                  </option>

                  <option
                    value="Terminée"
                    ${selectedDone}
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
                ${date}
              </small>
            </article>
          `;
        }
      )
      .join("");
}


/* ---------- Modification du statut ---------- */

async function updateLeadStatus(
  id,
  status
) {
  if (!id) {
    showError(
      dashboardMessage,
      "Identifiant de demande introuvable."
    );

    return false;
  }

  if (!STATUS_VALUES.includes(status)) {
    showError(
      dashboardMessage,
      "Statut sélectionné invalide."
    );

    return false;
  }

  const {
    data,
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
      )
      .select(`
        identifiant,
        nom,
        statut
      `);

  console.log(
    "Résultat modification :",
    {
      id,
      status,
      data,
      error
    }
  );

  if (error) {
    console.error(
      "Erreur de modification du statut :",
      error
    );

    showError(
      dashboardMessage,
      "Impossible de modifier le statut : " +
        readableError(error)
    );

    return false;
  }

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    showError(
      dashboardMessage,
      "Aucune demande n'a été modifiée. Vérifie l'identifiant et les policies RLS."
    );

    return false;
  }

  showSuccess(
    dashboardMessage,
    "Statut modifié avec succès."
  );

  return true;
}


/* ---------- Gestion des boutons de statut ---------- */

if (leadsList) {
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

      const id =
        button.dataset.leadId;

      const card =
        button.closest(
          ".lead-card"
        );

      const select =
        card
          ? card.querySelector(
              ".status-select"
            )
          : null;

      if (!select) {
        showError(
          dashboardMessage,
          "Sélecteur de statut introuvable."
        );

        return;
      }

      const originalText =
        button.textContent;

      button.disabled = true;
      button.textContent =
        "Enregistrement...";

      const success =
        await updateLeadStatus(
          id,
          select.value
        );

      if (success) {
        await loadLeads();
      } else {
        button.disabled = false;
        button.textContent =
          originalText;
      }
    }
  );
}


/* ---------- Actualisation ---------- */

if (refreshButton) {
  refreshButton.addEventListener(
    "click",
    async () => {
      refreshButton.disabled = true;
      refreshButton.textContent =
        "Actualisation...";

      await loadLeads();

      refreshButton.disabled = false;
      refreshButton.textContent =
        "Actualiser";
    }
  );
}


/* ---------- Protection contre l'injection HTML ---------- */

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* ---------- Formatage des dates ---------- */

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
