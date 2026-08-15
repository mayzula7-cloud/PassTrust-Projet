const SUPABASE_URL =
  "https://aohplqbwwbxxpkpmapxk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const form =
  document.querySelector("#lead-form");

const status =
  document.querySelector("#form-status");

const modeInput =
  document.querySelector("#mode");

if (form) {
  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const formData =
        new FormData(form);

      const payload = {
        mode: String(
          formData.get("mode") ||
          "help"
        ),

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

      if (status) {
        status.className = "";
        status.textContent =
          "Envoi en cours...";
      }

      const {
        error
      } =
        await supabaseClient
          .from("conduit")
          .insert(payload);

      if (error) {
        console.error(
          "Erreur Supabase :",
          error
        );

        if (status) {
          status.className = "error";
          status.textContent =
            `Erreur : ${error.message}`;
        }

        return;
      }

      form.reset();

      if (modeInput) {
        modeInput.value = "help";
      }

      if (status) {
        status.className = "success";
        status.textContent =
          "Merci, votre demande a bien été envoyée.";
      }
    }
  );
}
