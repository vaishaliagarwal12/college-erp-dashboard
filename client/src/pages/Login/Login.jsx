import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { FaExclamationCircle } from "react-icons/fa";

import { useAuth } from "../../context/useAuth";
import { getErrorMessage } from "../../services/api";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (token) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!formData.password) {
      nextErrors.password = "Password is required";
    }
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError("");

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(formData.email.trim(), formData.password);
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        getErrorMessage(error, "Login failed. Please try again.");
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              College ERP
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to access the admin dashboard
            </p>
          </div>

          {submitError && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 text-sm font-medium text-red-700 ring-1 ring-red-600/15 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20">
              <FaExclamationCircle className="ml-3 h-4 w-4 shrink-0" />
              <span className="py-2.5 pr-3">{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@college.edu"
                autoComplete="email"
                className={`input ${errors.email ? "border-red-400" : ""}`}
              />
              <FieldError message={errors.email} />
            </div>

            <div className="mb-6">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                className={`input ${errors.password ? "border-red-400" : ""}`}
              />
              <FieldError message={errors.password} />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Admin credentials required to access the system.
        </p>
      </div>
    </div>
  );
}

export default Login;