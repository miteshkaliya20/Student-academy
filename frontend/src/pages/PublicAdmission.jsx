import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const NAME_REGEX = /^[A-Za-z]{2,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function validateFile(file, allowedTypes, maxSizeMb) {
  if (!file) {
    return 'This file is required.';
  }

  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type.';
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return `File size must be ${maxSizeMb}MB or less.`;
  }

  return '';
}

export default function PublicAdmission() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePic: null,
    idProof: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const allowedProfileTypes = useMemo(() => ['image/jpeg', 'image/jpg', 'image/png'], []);
  const allowedIdProofTypes = useMemo(
    () => ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    []
  );

  function runValidation(values) {
    const nextErrors = {};

    if (!NAME_REGEX.test(values.firstName.trim())) {
      nextErrors.firstName = 'First name must be at least 2 letters and use alphabets only.';
    }

    if (!NAME_REGEX.test(values.lastName.trim())) {
      nextErrors.lastName = 'Last name must be at least 2 letters and use alphabets only.';
    }

    if (!EMAIL_REGEX.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!PHONE_REGEX.test(values.phone.trim())) {
      nextErrors.phone = 'Phone number must be a valid 10-digit mobile number.';
    }

    const profileError = validateFile(values.profilePic, allowedProfileTypes, 5);
    if (profileError) {
      nextErrors.profilePic =
        profileError === 'Invalid file type.'
          ? 'Profile picture must be JPG, JPEG, or PNG.'
          : profileError;
    }

    const idProofError = validateFile(values.idProof, allowedIdProofTypes, 5);
    if (idProofError) {
      nextErrors.idProof =
        idProofError === 'Invalid file type.' ? 'ID proof must be JPG, JPEG, PNG, or PDF.' : idProofError;
    }

    return nextErrors;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFileChange(event) {
    const { name, files } = event.target;
    setForm((current) => ({ ...current, [name]: files?.[0] || null }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitMessage('');

    const validationErrors = runValidation(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = new FormData();
    payload.append('firstName', form.firstName.trim());
    payload.append('lastName', form.lastName.trim());
    payload.append('email', form.email.trim());
    payload.append('phone', form.phone.trim());
    payload.append('profilePic', form.profilePic);
    payload.append('idProof', form.idProof);

    setLoading(true);
    try {
      const { data } = await api.post('/admissions/public', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitMessage(data.message || 'Admission form submitted successfully.');
      setErrors({});
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        profilePic: null,
        idProof: null,
      });
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        setErrors(apiErrors);
      }
      setSubmitMessage(error.response?.data?.message || 'Failed to submit admission form.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card admission-card">
        <h1>Public Admission Form</h1>
        <p>Fill in all details to submit your admission request.</p>

        <form onSubmit={handleSubmit} className="form-grid two-col">
          <label>
            First Name
            <input name="firstName" value={form.firstName} onChange={handleChange} />
            {errors.firstName ? <span className="error-msg">{errors.firstName}</span> : null}
          </label>

          <label>
            Last Name
            <input name="lastName" value={form.lastName} onChange={handleChange} />
            {errors.lastName ? <span className="error-msg">{errors.lastName}</span> : null}
          </label>

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} />
            {errors.email ? <span className="error-msg">{errors.email}</span> : null}
          </label>

          <label>
            Phone Number
            <input name="phone" value={form.phone} onChange={handleChange} maxLength={10} />
            {errors.phone ? <span className="error-msg">{errors.phone}</span> : null}
          </label>

          <label>
            Profile Picture (JPG, JPEG, PNG)
            <input
              name="profilePic"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
            />
            {errors.profilePic ? <span className="error-msg">{errors.profilePic}</span> : null}
          </label>

          <label>
            ID Proof (JPG, JPEG, PNG, PDF)
            <input
              name="idProof"
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={handleFileChange}
            />
            {errors.idProof ? <span className="error-msg">{errors.idProof}</span> : null}
          </label>

          <div className="actions span-all">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Admission Form'}
            </button>
            <Link className="btn secondary" to="/login">
              Back to Login
            </Link>
          </div>
        </form>

        {submitMessage ? <p className="admission-submit-msg">{submitMessage}</p> : null}
      </section>
    </div>
  );
}