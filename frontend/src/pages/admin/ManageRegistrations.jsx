import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { formatDate, formatDateTime, getErrorMessage } from "../../utils/format";

export default function ManageRegistrations() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || ""; // set when coming from an event's page

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // registration being edited
  const [editForm, setEditForm] = useState({ status: "", remarks: "", adminNote: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    registrationService
      .getAllRegistrations({ search: debouncedSearch, status, eventId, page, limit: 10 })
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
  }, [debouncedSearch, status, eventId, page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setPage(1);
    setSearchParams({});
  };

  // Used by the quick Approve/Reject buttons and by the edit dialog.
  const applyUpdate = async (reg, data) => {
    setBusy(true);
    try {
      const res = await registrationService.updateRegistration(reg._id, data);
      showToast(res.message);
      setEditing(null);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      reload();
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (reg) => {
    setEditing(reg);
    setEditForm({ status: reg.status, remarks: reg.remarks || "", adminNote: reg.adminNote || "" });
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await registrationService.deleteRegistration(deleteTarget._id);
      showToast(res.message);
      setDeleteTarget(null);
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Registrations" subtitle="Review, approve and manage student registrations." />

      {eventId && (
        <div className="alert alert-info">
          <span>Showing registrations for one event only.</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchParams({});
              setPage(1);
            }}
          >
            Show all events
          </button>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Student name, roll number, email or event"
        onFilterChange={(name, value) => {
          if (name === "status") setStatus(value);
          setPage(1);
        }}
        onReset={handleReset}
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
          emptyTitle="No registrations found"
          emptyText="Try a different search or filter."
          columns={[
            {
              header: "Student",
              render: (r) => (
                <>
                  <strong>{r.student?.name}</strong>
                  <small className="block muted">{r.student?.email}</small>
                </>
              ),
            },
            { header: "Roll no.", render: (r) => r.student?.rollNumber },
            {
              header: "Event",
              render: (r) => (
                <>
                  <Link to={`/admin/events/${r.event?._id}`} className="table-link">
                    {r.event?.title}
                  </Link>
                  <small className="block muted">{formatDate(r.event?.eventDate)}</small>
                </>
              ),
            },
            { header: "Registered", render: (r) => formatDateTime(r.registeredAt) },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Actions",
              className: "col-actions",
              render: (r) => (
                <div className="row-actions">
                  {r.status === "Pending" && (
                    <>
                      <button type="button" className="btn btn-success btn-sm" disabled={busy} onClick={() => applyUpdate(r, { status: "Approved" })}>
                        Approve
                      </button>
                      <button type="button" className="btn btn-danger-outline btn-sm" disabled={busy} onClick={() => applyUpdate(r, { status: "Rejected" })}>
                        Reject
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setDeleteTarget(r)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>
      <Pagination pagination={pagination} onChange={setPage} />

      <Modal
        open={Boolean(editing)}
        title="Edit registration"
        onClose={() => !busy && setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => applyUpdate(editing, editForm)}>
              {busy ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        {editing && (
          <>
            <p className="muted">
              {editing.student?.name} &middot; {editing.event?.title}
            </p>
            <div className="field">
              <label htmlFor="edit-status">Status</label>
              <select id="edit-status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {REGISTRATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <small className="hint">Rejected and Cancelled release the seat. Pending and Approved hold one.</small>
            </div>
            <div className="field">
              <label htmlFor="edit-remarks">Student remarks</label>
              <textarea id="edit-remarks" rows={2} maxLength={300} value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="edit-note">Admin note</label>
              <textarea id="edit-note" rows={2} maxLength={300} value={editForm.adminNote} onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })} />
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        danger
        title="Delete this registration?"
        confirmText="Delete registration"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        message={
          deleteTarget && (
            <p>
              The registration of <strong>{deleteTarget.student?.name}</strong> for <strong>{deleteTarget.event?.title}</strong> will be
              removed permanently. If it holds a seat, the seat becomes available again. To keep a record, change the status to Cancelled instead.
            </p>
          )
        }
      />
    </>
  );
}
