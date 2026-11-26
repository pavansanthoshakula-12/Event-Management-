import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as eventService from "../../services/eventService";
import useToast from "../../hooks/useToast";
import PageHeader from "../../components/PageHeader";
import EventForm from "../../components/EventForm";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { getErrorMessage, getFieldErrors } from "../../utils/format";

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await eventService.getEvent(id);
      setEvent(res.data);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await eventService.updateEvent(id, payload);
      showToast(res.message);
      navigate(`/admin/events/${id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading event..." />;
  if (loadError) return <ErrorMessage message={loadError} onRetry={load} />;

  return (
    <>
      <PageHeader title="Edit event" subtitle={event.title} />
      <ErrorMessage message={error} />
      <EventForm
        key={event._id}
        initialEvent={event}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save changes"
        serverErrors={fieldErrors}
      />
    </>
  );
}
