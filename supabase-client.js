const SUPABASE_URL = "https://aohplqbwwbxxpkpmapxk.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form = document.querySelector("#lead-form");
const status = document.querySelector("#form-status");
const modeInput = document.querySelector("#mode");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const payload = {
      mode: String(formData.get("mode") || "help"),
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      city: String(formData.get("city") || "Maisons-Laffitte").trim(),
      need: String(formData.get("need") || "").trim()
    };

    status.className = "";
    status.textContent = "Envoi en cours...";

    const { error } = await supabaseClient
      .from("leads")
      .insert(payload);

    if (error) {
      console.error(error);
      status.className = "error";
      status.textContent = `Erreur : ${error.message}`;
      return;
    }

    form.reset();

    if (modeInput) {
      modeInput.value = "help";
    }

    status.className = "success";
    status.textContent = "Merci, votre demande a bien été envoyée.";
  });
}
