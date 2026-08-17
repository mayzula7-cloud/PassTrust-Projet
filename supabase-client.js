/* =========================================================
   PassTrust - supabase-client.js
   Formulaire public connecté à Supabase
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
    "Le SDK Supabase est introuvable. " +
    "Vérifie que supabase-js est chargé avant ce fichier."
  );
}

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* ---------- Éléments HTML ---------- */

const form =
  document.querySelector("#lead-form");

const status =
  document.querySelector("#form-status");

const modeInput =
  document.querySelector("#mode");


/* ---------- Affichage du statut ---------- */

function setStatus(
  message,
  className = ""
) {
  if (!status) {
    return;
  }

  status.className =
    className;

  status.textContent =
    message;
}


/* ---------- Envoi du formulaire ---------- */

if (form) {
  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
      }

      setStatus(
        "Envoi en cours..."
      );

      const formData =
        new FormData(form);

      const payload = {
        mode: String(
          formData.get("mode") ||
          "help"
        ).trim(),

        nom: String(
          formData.get("name") ||
          ""
        ).trim(),

        courriel: String(
          formData.get("email") ||
          ""
        ).trim(),

        ville: String(
          formData.get("city") ||
          "Maisons-Laffitte"
        ).trim(),

        besoin: String(
          formData.get("need") ||
          ""
        ).trim(),

        statut: "Nouvelle",

        notes: ""
      };

      if (!payload.nom) {
        setStatus(
          "Veuillez renseigner votre nom.",
          "error"
        );

        if (submitButton) {
          submitButton.disabled = false;
        }

        return;
      }

      if (!payload.courriel) {
        setStatus(
          "Veuillez renseigner votre email.",
          "error"
        );

        if (submitButton) {
          submitButton.disabled = false;
        }

        return;
      }

      if (!payload.besoin) {
        setStatus(
          "Veuillez préciser votre besoin.",
          "error"
        );

        if (submitButton) {
          submitButton.disabled = false;
        }

        return;
      }

      try {
        const {
          error
        } =
          await supabaseClient
            .from("conduit")
            .insert(payload);

        if (error) {
          throw error;
        }

        form.reset();

        if (modeInput) {
          modeInput.value =
            "help";
        }

        setStatus(
          "Merci, votre demande a bien été envoyée.",
          "success"
        );
      } catch (error) {
        console.error(
          "Erreur Supabase :",
          error
        );

        setStatus(
          `Erreur : ${error.message}`,
          "error"
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    }
  );
} else {
  console.warn(
    "Le formulaire #lead-form est introuvable."
  );
}
