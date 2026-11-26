import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as registrationService from "../../services/registrationService";
import useToast from "../../hooks/useToast";
import useDebounce from "../../hooks/useDebounce";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { REGISTRATION_STATUSES } from "../../utils/constants";
import { ACTIVE_STATUSES, formatDate, formatDateTime, getErrorMessage } from "../../utils/format";

export default function MyRegistrations() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    registrationService
      .getMyRegistrations({ search: debouncedSearch, status, page, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setPagination(res.pagination);
        setError("");
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleCancel = async () => {
    setBusy(true);
    try {
      const res = await registrationService.cancelRegistration(cancelTarget._id);
      showToast(res.message);
      setCancelTarget(null);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setCancelTarget(null);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveRemarks = async () => {
    setBusy(true);
    try {
      const res = await registrationService.updateRegistration(editTarget._id, { remarks: remarks.trim() });
      showToast(res.message);
      setEditTarget(null);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My registrations"
        subtitle="Every event you have registered for."
        actions={
          <Link to="/student/events" className="btn btn-primary">
            Browse events
          </Link>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search by event title"
        onFilterChange={(name, value) => {
          if (name === "status") setStatus(value);
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setStatus("");
          setPage(1);
        }}
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            value: status,
            options: [{ value: "", label: "All statuses" }, ...REGISTRATION_STATUSES.map((s) => ({ value: s, label: s }))],
          },
        ]}
      />

      <ErrorMessage message={error} onRetry={reload} />

      <div className="card card-flush">
        <DataTable
          loading={loading}
          rows={rows}
          emptyTitle="No registrations yet"
          emptyText="When you register for an event, it will show up here."
          columns={[
            {
              header: "Event",
              render: (r) => (
                <>
                  <Link to={`/student/events/${r.event?._id}`} className="table-link">
                    {r.event?.title}
                  </Link>
                  <small className="block muted">{r.event?.venue}</small>
                </>
              ),
            },
            { header: "Event date", render: (r) => formatDate(r.event?.eventDate) },
            { header: "Registered", render: (r) => formatDateTime(r.registeredAt) },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Remarks",
              render: (r) => (
                <>
                  {r.remarks || <span className="muted">None</span>}
                  {r.adminNote && <small className="block muted">Organizer note: {r.adminNote}</small>}
                </>
              ),
            },
            {
              header: "Actions",
              className: "col-actions",
              render: (r) => (
                <div className="row-actions">
                  {ACTIVE_STATUSES.includes(r.status) && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setEditTarget(r);
                        setRemarks(r.remarks || "");
                      }}
                    >
                      Edit remarks
                    </button>
                  )}
                  {r.canCancel && (
                    <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setCancelTarget(r)}>
                      Cancel
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
      <Pagination pagination={pagination} onChange={setPage} />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        danger
        title="Cancel this registration?"
        confirmText="Cancel registration"
        loading={busy}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        message={cancelTarget && `You will give up your seat for "${cancelTarget.event?.title}". You can register again later if seats are still available.`}
      />

      <Modal
        open={Boolean(editTarget)}
        title="Edit remarks"
        onClose={() => !busy && setEditTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditTarget(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveRemarks} disabled={busy}>
              {busy ? "Saving..." : "Save remarks"}
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="my-remarks">Remarks for the organizer</label>
          <textarea id="my-remarks" rows={4} maxLength={300} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <small className="hint">{remarks.length}/300</small>
        </div>
      </Modal>
    </>
  );
}
