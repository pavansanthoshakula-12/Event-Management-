import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as eventService from "../../services/eventService";
import useToast from "../../hooks/useToast";
import PageHeader from "../../components/PageHeader";
import EventForm from "../../components/EventForm";
import ErrorMessage from "../../components/ErrorMessage";
import { getErrorMessage, getFieldErrors } from "../../utils/format";

export default function AddEvent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await eventService.createEvent(payload);
      showToast(res.message);
      navigate("/admin/events");
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Add event" subtitle="Fill in the details. Students can register once the event is Upcoming." />
      <ErrorMessage message={error} />
      <EventForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Create event" serverErrors={fieldErrors} />
    </>
  );
}
