import { useState } from "react";
import toast from "react-hot-toast";
import {
  MdPerson,
  MdDomain,
  MdShield,
  MdNotificationsActive,
  MdEdit,
  MdSave,
  MdLock,
} from "react-icons/md";

import { useAuth } from "../../context/useAuth";
import api, { getErrorMessage } from "../../services/api";
import { changePassword } from "../../api";

const TABS = [
  { id: "profile", label: "Profile", icon: <MdPerson /> },
  { id: "institution", label: "Institution Details", icon: <MdDomain /> },
  { id: "security", label: "Security", icon: <MdShield /> },
  { id: "notifications", label: "Notifications", icon: <MdNotificationsActive /> },
];

function useLocalSetting(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });

  const persist = (next) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  return [value, persist];
}

const inputClass =
  "w-full bg-surface-container-low border border-outline-variant rounded-md px-md py-sm text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none";

const labelClass = "block font-label-md text-label-md text-on-surface mb-xs";

const cancelBtnClass =
  "px-md py-sm bg-surface border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded-md hover:bg-surface-container transition-colors";

const saveBtnClass =
  "px-md py-sm bg-secondary text-on-secondary font-label-md text-label-md rounded-md hover:bg-secondary-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

function ProfileTab() {
  const { user, token, setSession } = useAuth();
  const nameParts = (user?.name || "").split(" ").filter(Boolean);
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useLocalSetting("erp_admin_phone", "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    setSaving(true);
    try {
      if (user?.id) {
        await api.put(`/users/${user.id}`, { name: fullName });
        if (typeof setSession === "function") {
          setSession(token, { ...user, name: fullName });
        }
      }
      toast.success("Profile saved");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="border-b border-outline-variant px-lg py-md bg-surface-container-low/50">
        <h3 className="font-headline-sm text-headline-sm text-primary">Administrator Profile</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          Update your personal information and contact details.
        </p>
      </div>

      <div className="p-lg space-y-xl">
        {/* Avatar */}
        <div className="flex items-center gap-lg">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center text-3xl font-bold border-2 border-outline-variant">
              {(user?.name || user?.role || "A").charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              title="Change avatar"
              className="absolute bottom-0 right-0 bg-surface border border-outline-variant text-on-surface-variant p-sm rounded-full shadow-sm hover:text-secondary transition-colors"
            >
              <MdEdit className="text-sm" />
            </button>
          </div>
          <div>
            <h4 className="font-body-md text-body-md font-medium text-on-surface">Profile Picture</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
              JPG, GIF or PNG. Max size of 800K
            </p>
            <div className="flex gap-sm">
              <button type="button" className={saveBtnClass}>Upload New</button>
              <button type="button" className={cancelBtnClass}>Remove</button>
            </div>
          </div>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="space-y-sm">
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-sm">
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-sm">
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              className={`${inputClass} opacity-60 cursor-not-allowed`}
              value={email}
              readOnly
              title="Contact system support to change your email"
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Contact system support to change your email.
            </p>
          </div>
          <div className="space-y-sm">
            <label className={labelClass}>Phone Number</label>
            <input
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant px-lg py-md bg-surface-container-low/50 flex justify-end gap-md">
        <button type="button" className={cancelBtnClass}>Cancel</button>
        <button type="button" className={saveBtnClass} onClick={handleSave} disabled={saving}>
          <MdSave className="mr-1 inline -mt-0.5" />
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </section>
  );
}

function InstitutionTab() {
  const [institution, setInstitution] = useLocalSetting("erp_institution", {
    name: "College ERP University",
    address: "123 Academic Drive",
    city: "Springfield",
    contactEmail: "admin@collegeerp.edu",
    academicYear: "2025-26",
    semester: "Fall",
  });
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) =>
    setInstitution({ ...institution, [key]: e.target.value });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Institution details saved");
    }, 400);
  };

  return (
    <section className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="border-b border-outline-variant px-lg py-md bg-surface-container-low/50">
        <h3 className="font-headline-sm text-headline-sm text-primary">Institution Details</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          Public information shown across reports and the dashboard.
        </p>
      </div>

      <div className="p-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="space-y-sm md:col-span-2">
            <label className={labelClass}>Institution Name</label>
            <input type="text" className={inputClass} value={institution.name} onChange={update("name")} />
          </div>
          <div className="space-y-sm md:col-span-2">
            <label className={labelClass}>Address</label>
            <input type="text" className={inputClass} value={institution.address} onChange={update("address")} />
          </div>
          <div className="space-y-sm">
            <label className={labelClass}>City</label>
            <input type="text" className={inputClass} value={institution.city} onChange={update("city")} />
          </div>
          <div className="space-y-sm">
            <label className={labelClass}>Contact Email</label>
            <input type="email" className={inputClass} value={institution.contactEmail} onChange={update("contactEmail")} />
          </div>
          <div className="space-y-sm">
            <label className={labelClass}>Academic Year</label>
            <input type="text" className={inputClass} value={institution.academicYear} onChange={update("academicYear")} />
          </div>
          <div className="space-y-sm">
            <label className={labelClass}>Current Semester</label>
            <select className={inputClass} value={institution.semester} onChange={update("semester")}>
              <option>Spring</option>
              <option>Summer</option>
              <option>Fall</option>
              <option>Winter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant px-lg py-md bg-surface-container-low/50 flex justify-end gap-md">
        <button type="button" className={cancelBtnClass}>Cancel</button>
        <button type="button" className={saveBtnClass} onClick={handleSave} disabled={saving}>
          <MdSave className="mr-1 inline -mt-0.5" />
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </section>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="border-b border-outline-variant px-lg py-md bg-surface-container-low/50">
        <h3 className="font-headline-sm text-headline-sm text-primary">Security</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          Keep your account secure with a strong, fresh password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-lg space-y-lg">
        <div className="space-y-sm">
          <label className={labelClass}>Current Password</label>
          <div className="relative">
            <MdLock className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
            <input
              type="password"
              className={`${inputClass} pl-xl`}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Enter current password"
            />
          </div>
        </div>
        <div className="space-y-sm">
          <label className={labelClass}>New Password</label>
          <div className="relative">
            <MdLock className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
            <input
              type="password"
              className={`${inputClass} pl-xl`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
            />
          </div>
        </div>
        <div className="space-y-sm">
          <label className={labelClass}>Confirm New Password</label>
          <div className="relative">
            <MdLock className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
            <input
              type="password"
              className={`${inputClass} pl-xl`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Re-enter new password"
            />
          </div>
        </div>

        <div className="flex justify-end gap-md">
          <button type="button" className={cancelBtnClass}>Cancel</button>
          <button type="submit" className={saveBtnClass} disabled={submitting}>
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

const NOTIFICATION_OPTIONS = [
  { id: "studentEnrollment", label: "New Student Enrollment", description: "Notify when a new student is registered." },
  { id: "scheduleChanges", label: "Schedule Changes", description: "Notify when timetable slots are created or updated." },
  { id: "reportsReady", label: "Reports & Analytics", description: "Weekly digest of key performance metrics." },
  { id: "systemAlerts", label: "System Alerts", description: "Maintenance windows and security advisories." },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useLocalSetting("erp_notification_prefs", {
    studentEnrollment: true,
    scheduleChanges: true,
    reportsReady: false,
    systemAlerts: true,
  });

  const toggle = (id) => {
    setPrefs({ ...prefs, [id]: !prefs[id] });
  };

  return (
    <section className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="border-b border-outline-variant px-lg py-md bg-surface-container-low/50">
        <h3 className="font-headline-sm text-headline-sm text-primary">Notifications</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          Choose which updates you want to receive by email.
        </p>
      </div>

      <div className="p-lg divide-y divide-outline-variant/60">
        {NOTIFICATION_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-start justify-between gap-md py-md">
            <div>
              <h4 className="font-body-md text-body-md font-medium text-on-surface">{option.label}</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{option.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(prefs[option.id])}
              onClick={() => toggle(option.id)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                prefs[option.id] ? "bg-secondary" : "bg-surface-container-high"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[option.id] ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header>
        <h2 className="font-display-lg text-display-lg text-primary">System Settings</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm">
          Manage institutional preferences, security protocols, and administrative profiles.
        </p>
      </header>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-lg items-start">
        {/* Tab Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden lg:sticky lg:top-24">
          <div className="flex lg:flex-col p-sm gap-xs overflow-x-auto lg:overflow-visible">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 lg:flex-none text-left px-md py-sm rounded-md font-label-md text-label-md transition-colors whitespace-nowrap lg:whitespace-normal flex items-center gap-sm ${
                  activeTab === tab.id
                    ? "bg-secondary-fixed/30 text-on-secondary-fixed-variant font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content Canvas */}
        <div className="flex-1 space-y-lg w-full">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "institution" && <InstitutionTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}

export default Settings;
