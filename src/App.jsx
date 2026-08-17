import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import './App.css';
import { supabase } from './lib/supabaseClient';

const GET_LEADS_FUNCTION = 'admin-leads';

const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  rejected: 'Refusé',
  converted: 'Converti',
};

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError('');

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError(
        'Email ou mot de passe incorrect.'
      );
    }

    setLoading(false);
  }

  return (
    <main className="app-shell login-shell">
      <section className="login-card">
        <p className="eyebrow">PassTrust</p>

        <h1>Connexion administrateur</h1>

        <p className="login-description">
          Connecte-toi pour accéder aux demandes reçues.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="admin@exemple.com"
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">
            Mot de passe
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && (
            <div
              className="error-message"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Connexion...'
              : 'Se connecter'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ session }) {
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        GET_LEADS_FUNCTION,
        {
          body: {
            action: 'list',
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : JSON.stringify(data.error)
        );
      }

      const receivedLeads = Array.isArray(data)
        ? data
        : Array.isArray(data?.leads)
          ? data.leads
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setLeads(receivedLeads);

      setMessage(
        `${receivedLeads.length} demande(s) chargée(s).`
      );
    } catch (loadError) {
      console.error(
        'Erreur chargement des leads :',
        loadError
      );

      setError(
        loadError?.message ||
          'Impossible de charger les demandes.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search
      .toLowerCase()
      .trim();

    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === 'all' ||
        lead.status === statusFilter;

      const searchableText = [
        lead.name,
        lead.email,
        lead.city,
        lead.need,
        lead.mode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, search]);

  async function updateStatus(id, status) {
    const previousLeads = leads;

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === id
          ? { ...lead, status }
          : lead
      )
    );

    setMessage('Enregistrement du statut...');
    setError('');

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        GET_LEADS_FUNCTION,
        {
          body: {
            action: 'update_status',
            id,
            status,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : JSON.stringify(data.error)
        );
      }

      setMessage(
        'Statut enregistré dans Supabase.'
      );

      window.setTimeout(() => {
        setMessage('');
      }, 2500);
    } catch (updateError) {
      console.error(
        'Erreur enregistrement du statut :',
        updateError
      );

      setLeads(previousLeads);

      setError(
        updateError?.message ||
          'Impossible d’enregistrer le statut.'
      );

      setMessage('');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return 'Date inconnue';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Date invalide';
    }

    return date.toLocaleString('fr-FR');
  }

  const total = leads.length;

  const newCount = leads.filter(
    (lead) => lead.status === 'new'
  ).length;

  const contactedCount = leads.filter(
    (lead) => lead.status === 'contacted'
  ).length;

  const qualifiedCount = leads.filter(
    (lead) => lead.status === 'qualified'
  ).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PassTrust</p>
          <h1>Demandes reçues</h1>
        </div>

        <div className="topbar-actions">
          <div className="connection">
            <span className="dot online" />
            {loading
              ? 'Chargement...'
              : 'Interface prête'}
          </div>

          <button
            type="button"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <p className="current-user">
        Connecté avec {session.user.email}
      </p>

      <section className="stats">
        <div className="stat-card">
          <span>Total</span>
          <strong>{total}</strong>
        </div>

        <div className="stat-card">
          <span>Nouveaux</span>
          <strong>{newCount}</strong>
        </div>

        <div className="stat-card">
          <span>Contactés</span>
          <strong>{contactedCount}</strong>
        </div>

        <div className="stat-card">
          <span>Qualifiés</span>
          <strong>{qualifiedCount}</strong>
        </div>
      </section>

      <section className="toolbar">
        <input
          type="search"
          placeholder="Rechercher un nom, email ou ville..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          aria-label="Rechercher une demande"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filtrer par statut"
        >
          <option value="all">
            Tous les statuts
          </option>

          {Object.entries(STATUS_LABELS).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>

        <button
          type="button"
          onClick={loadLeads}
          disabled={loading}
        >
          {loading
            ? 'Chargement...'
            : 'Actualiser'}
        </button>
      </section>

      {message && (
        <div
          className="success-message"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="error-message"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="table-card">
        {filteredLeads.length === 0 ? (
          <p className="empty">
            Aucune demande trouvée.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Mode</th>
                  <th>Besoin</th>
                  <th>Ville</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      {formatDate(
                        lead.created_at
                      )}
                    </td>

                    <td>{lead.name || '—'}</td>

                    <td>
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                        >
                          {lead.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td>
                      <span
                        className={`mode mode-${
                          lead.mode || 'unknown'
                        }`}
                      >
                        {lead.mode === 'offer'
                          ? 'Proposition'
                          : lead.mode === 'help'
                            ? 'Demande d’aide'
                            : lead.mode || '—'}
                      </span>
                    </td>

                    <td>{lead.need || '—'}</td>
                    <td>{lead.city || '—'}</td>

                    <td>
                      <label
                        className="sr-only"
                        htmlFor={`status-${lead.id}`}
                      >
                        Statut de la demande de{' '}
                        {lead.name ||
                          'la personne'}
                      </label>

                      <select
                        id={`status-${lead.id}`}
                        className={`status status-${
                          lead.status || 'new'
                        }`}
                        value={lead.status || 'new'}
                        onChange={(event) =>
                          updateStatus(
                            lead.id,
                            event.target.value
                          )
                        }
                      >
                        {Object.entries(
                          STATUS_LABELS
                        ).map(
                          ([value, label]) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(
      ({ data }) => {
        if (mounted) {
          setSession(data.session);
          setCheckingSession(false);
        }
      }
    );

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <main className="app-shell">
        <p>Vérification de la session...</p>
      </main>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <Dashboard session={session} />;
}

export default App;