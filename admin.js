import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://aohplqbwwbxxpkpmapxk.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_4n64k5NM0t12Nat7aqqkzw_4FraK6IH
";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authBox = document.querySelector("#authBox");
const leadsBox = document.querySelector("#leads");
const countBox = document.querySelector("#count");

async function render() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    authBox.innerHTML = `
      <h2>Connexion admin</h2>
      <form id="loginForm">
        <input type="email" name="email" placeholder="Email admin" required />
        <button type="submit">Recevoir le lien</button>
      </form>
      <p id="loginStatus" class="muted"></p>
    `;

    document.querySelector("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = new FormData(e.target).get("email");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href }
      });

      document.querySelector("#loginStatus").textContent = error
        ? error.message
        : "Lien envoyé, vérifie ta boîte mail.";
    });

    leadsBox.innerHTML = "";
    countBox.textContent = "Connecté ? non";
    return;
  }

  authBox.innerHTML = `
    <div class="row">
      <div>Connecté en tant que <strong>${session.user.email}</strong></div>
      <button id="logoutBtn">Déconnexion</button>
    </div>
  `;

  document.querySelector("#logoutBtn").onclick = async () => {
    await supabase.auth.signOut();
    render();
  };

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    leadsBox.innerHTML = `<p class="muted">${error.message}</p>`;
    return;
  }

  countBox.textContent = `${data.length} demande(s)`;

  leadsBox.innerHTML = data.map((lead) => `
    <div class="card">
      <div class="row">
        <strong>${lead.name}</strong>
        <span class="muted">${lead.email}</span>
        <span class="muted">${lead.city}</span>
        <select data-id="${lead.id}" class="status">
          <option value="new" ${lead.status === 'new' ? 'selected' : ''}>new</option>
          <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>contacted</option>
          <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>qualified</option>
          <option value="rejected" ${lead.status === 'rejected' ? 'selected' : ''}>rejected</option>
          <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>converted</option>
        </select>
      </div>
      <p>${lead.need}</p>
      <small class="muted">${new Date(lead.created_at).toLocaleString("fr-FR")}</small>
    </div>
  `).join("");

  document.querySelectorAll(".status").forEach((select) => {
    select.addEventListener("change", async () => {
      await supabase.from("leads").update({ status: select.value }).eq("id", select.dataset.id);
    });
  });
}

await render();
supabase.auth.onAuthStateChange(() => render());
