import { useMemo, useState } from 'react';
import './App.css';

const initialLeads = [
  {
    id: 'demo-1',
    created_at: '2026-08-15T15:14:19Z',
    name: 'Test webhook',
    email: 'mayzula7@gmail.com',
    mode: 'offer',
    need: 'Test direct du webhook',
    city: 'Maisons-Laffitte',
    status: 'new',
  },
];

const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  rejected: 'Refusé',
  converted: 'Converti',
};

function App() {
  const [leads, setLeads] = useState(initialLeads);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

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

  function updateStatus(id, status) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === id
          ? { ...lead, status }
          : lead
      )
    );

    setMessage('Statut modifié localement.');

    window.setTimeout(() => {
      setMessage('');
    }, 2500);
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

        <div className="connection">
          <span className="dot online" />
          Interface prête
        </div>
      </header>

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
          <option value="all">Tous les statuts</option>

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
          onClick={() => window.location.reload()}
        >
          Actualiser
        </button>
      </section>

      {message && (
        <div className="success-message" role="status">
          {message}
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
                      {new Date(
                        lead.created_at
                      ).toLocaleString('fr-FR')}
                    </td>

                    <td>{lead.name}</td>

                    <td>
                      <a href={`mailto:${lead.email}`}>
                        {lead.email}
                      </a>
                    </td>

                    <td>
                      <span
                        className={`mode mode-${lead.mode}`}
                      >
                        {lead.mode === 'offer'
                          ? 'Proposition'
                          : 'Demande d’aide'}
                      </span>
                    </td>

                    <td>{lead.need}</td>
                    <td>{lead.city}</td>

                    <td>
                      <label
                        className="sr-only"
                        htmlFor={`status-${lead.id}`}
                      >
                        Statut de la demande de {lead.name}
                      </label>

                      <select
                        id={`status-${lead.id}`}
                        className={`status status-${lead.status}`}
                        value={lead.status}
                        onChange={(event) =>
                          updateStatus(
                            lead.id,
                            event.target.value
                          )
                        }
                      >
                        {Object.entries(
                          STATUS_LABELS
                        ).map(([value, label]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        ))}
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

export default App;