import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://TON_PROJET.supabase.co";
const SUPABASE_ANON_KEY = "TA_CLE_ANON";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.querySelector("#lead-form");
const status = document.querySelector("#form-status");
const modeInput = document.querySelector("#mode");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    status.textContent = "Envoi en cours...";

    const { error } = await supabase.from("leads").insert({
      mode: data.mode,
      name: data.name,
      email: data.email,
      city: data.city || "Maisons-Laffitte",
      need: data.need
    });

    if (error) {
      console.error(error);
      status.textContent = "Erreur lors de l’envoi.";
      return;
    }

    form.reset();
    modeInput.value = "help";
    status.textContent = "Merci, votre demande a été envoyée.";
  });
}
