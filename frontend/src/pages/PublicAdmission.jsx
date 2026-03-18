import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import './PublicAdmission.scss';

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
    <div className="login-shell student-admission-shell">
      <section className="student-admission-grid">
        <article className="student-admission-info-card">
          <span className="student-admission-badge">Student Admission</span>
          <h1>Start Your Journey With Parivartan Academy</h1>
          <p>
            Fill this form to request admission. Our team reviews every submission and contacts you with the next
            steps.
          </p>

          <div className="student-admission-kpi-row">
            <div>
              <strong>Fast</strong>
              <span>Application Review</span>
            </div>
            <div>
              <strong>Clear</strong>
              <span>Document Process</span>
            </div>
            <div>
              <strong>Mentor</strong>
              <span>Guided Onboarding</span>
            </div>
          </div>

          <div className="student-admission-steps">
            <div>
              <strong>1. Fill Details</strong>
              <span>Enter accurate student contact information.</span>
            </div>
            <div>
              <strong>2. Upload Documents</strong>
              <span>Add photo and valid ID proof in supported format.</span>
            </div>
            <div>
              <strong>3. Submit Request</strong>
              <span>Receive confirmation and follow-up from academy staff.</span>
            </div>
          </div>
        </article>

        <article className="login-card admission-card student-admission-form-card">
          <div className="student-admission-form-top">
            <h2>Student Admission Form</h2>
            <p>All fields are mandatory for faster processing.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-grid two-col student-admission-form-grid">
            <label>
              First Name
              <input
                name="firstName"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange}
              />
              {errors.firstName ? <span className="error-msg">{errors.firstName}</span> : null}
            </label>

            <label>
              Last Name
              <input
                name="lastName"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange}
              />
              {errors.lastName ? <span className="error-msg">{errors.lastName}</span> : null}
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email ? <span className="error-msg">{errors.email}</span> : null}
            </label>

            <label>
              Phone Number
              <input
                name="phone"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
              />
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
              <span className="muted">{form.profilePic?.name || 'No file selected'}</span>
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
              <span className="muted">{form.idProof?.name || 'No file selected'}</span>
              {errors.idProof ? <span className="error-msg">{errors.idProof}</span> : null}
            </label>

            <div className="actions span-all">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Student Admission'}
              </button>
              <Link className="btn secondary" to="/login">
                Back to Login
              </Link>
            </div>
          </form>

          {submitMessage ? <p className="admission-submit-msg">{submitMessage}</p> : null}
        </article>
      </section>
    </div>
  );
}