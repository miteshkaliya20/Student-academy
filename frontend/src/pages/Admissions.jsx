import { useEffect, useMemo, useState } from 'react';
import api, { API_BASE_URL } from '../api/api';
import './Admissions.scss';

const STATUS_OPTIONS = ['Pending', 'Reviewed', 'Approved', 'Rejected'];

function toFileUrl(storedPath) {
  if (!storedPath) {
    return '';
  }

  const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
  const normalizedPath = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath;
  return `${serverBase}/${normalizedPath}`;
}

function formatDate(dateLike) {
  if (!dateLike) {
    return '-';
  }
  return new Date(dateLike).toLocaleString();
}

export default function Admissions() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [convertingId, setConvertingId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAdmissions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return admissions.filter((item) => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesSearch =
        query.length === 0 ||
        `${item.firstName} ${item.lastName}`.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [admissions, searchText, statusFilter]);

  const hasRows = useMemo(() => filteredAdmissions.length > 0, [filteredAdmissions.length]);

  const admissionSummary = useMemo(() => {
    return {
      total: admissions.length,
      approved: admissions.filter((item) => item.status === 'Approved').length,
      converted: admissions.filter((item) => item.convertedStudent).length,
    };
  }, [admissions]);

  async function loadAdmissions() {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/admissions');
      setAdmissions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmissions();
  }, []);

  async function handleStatusChange(admissionId, nextStatus) {
    setUpdatingId(admissionId);
    setError('');

    try {
      const { data } = await api.patch(`/admissions/${admissionId}/status`, {
        status: nextStatus,
      });
      setAdmissions((current) =>
        current.map((item) => (item._id === admissionId ? data : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId('');
    }
  }

  async function handleConvert(admissionId) {
    setConvertingId(admissionId);
    setError('');

    try {
      const { data } = await api.post(`/admissions/${admissionId}/convert`);
      setAdmissions((current) =>
        current.map((item) => (item._id === admissionId ? data.admission : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert admission to student.');
    } finally {
      setConvertingId('');
    }
  }

  return (
    <div className="page-stack section-page-modern">
      <section className="panel section-hero admissions-hero">
        <div>
          <h2>Admission Requests</h2>
          <p>Review applications, update status, and convert approved admissions to students.</p>
        </div>
        <button className="btn secondary" onClick={loadAdmissions} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </section>

      <section className="section-metric-grid">
        <article className="panel section-metric-card">
          <p>Total Requests</p>
          <h3>{admissionSummary.total}</h3>
        </article>
        <article className="panel section-metric-card">
          <p>Approved</p>
          <h3>{admissionSummary.approved}</h3>
        </article>
        <article className="panel section-metric-card">
          <p>Converted</p>
          <h3>{admissionSummary.converted}</h3>
        </article>
      </section>

      <section className="panel section-panel section-filter-panel">
        <div className="filters-row">
        <input
          className="search"
          placeholder="Search by name, email, or phone"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        </div>
      </section>

      {error ? <div className="error-msg">{error}</div> : null}

      <section className="panel section-panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Profile Pic</th>
              <th>ID Proof</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Convert</th>
            </tr>
          </thead>
          <tbody>
            {!hasRows ? (
              <tr>
                <td colSpan={8} className="empty">
                  {loading ? 'Loading admissions...' : 'No admission requests yet.'}
                </td>
              </tr>
            ) : (
              filteredAdmissions.map((item) => (
                <tr key={item._id}>
                  <td>{`${item.firstName} ${item.lastName}`}</td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td>
                    <a href={toFileUrl(item.profilePic)} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                  <td>
                    <a href={toFileUrl(item.idProof)} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(event) => handleStatusChange(item._id, event.target.value)}
                      disabled={updatingId === item._id || Boolean(item.convertedStudent)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {item.convertedStudent ? (
                      <span className="muted">Converted</span>
                    ) : (
                      <button
                        className="btn small"
                        onClick={() => handleConvert(item._id)}
                        disabled={item.status !== 'Approved' || convertingId === item._id}
                      >
                        {convertingId === item._id ? 'Converting...' : 'Convert'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
