"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type FormState = {
  phone: string;
  model: string;
  serial: string;

  firstName: string;
  lastName: string;
  email: string;

  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;

  consent: boolean;
};

function normalize(s: string) {
  return (s ?? "").trim();
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Loose E.164-ish check: +15551234567, or 15551234567
function isPhone(s: string) {
  return /^\+?[1-9]\d{7,14}$/.test(s);
}

export default function Page() {
  const params = useSearchParams();

  const prefill = useMemo(() => {
    return {
      phone: params.get("phone") ?? "",
      model: params.get("model") ?? "",
      serial: params.get("serial") ?? "",
    };
  }, [params]);

  const [form, setForm] = useState<FormState>({
    phone: "",
    model: "",
    serial: "",

    firstName: "",
    lastName: "",
    email: "",

    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",

    consent: false,
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // Prefill the 3 fields from the SMS link
    setForm((prev) => ({
      ...prev,
      phone: prefill.phone,
      model: prefill.model,
      serial: prefill.serial,
    }));
  }, [prefill.phone, prefill.model, prefill.serial]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const phone = normalize(form.phone);
    const model = normalize(form.model).toUpperCase();
    const serial = normalize(form.serial).toUpperCase();

    if (!phone || !model || !serial) return "Phone, model, and serial are required.";
    if (!isPhone(phone)) return "Phone number format looks invalid. Use +15551234567 format.";
    if (!normalize(form.firstName) || !normalize(form.lastName)) return "First and last name are required.";
    if (!normalize(form.email) || !isEmail(normalize(form.email))) return "Please enter a valid email address.";
    if (!normalize(form.address1) || !normalize(form.city) || !normalize(form.state) || !normalize(form.zip)) {
      return "Please complete your address (line 1, city, state, zip).";
    }
    if (normalize(form.state).length !== 2) return "State must be a 2-letter code (example: TX).";
    if (!form.consent) return "Consent is required to submit.";

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMsg("");

    const err = validate();
    if (err) {
      setStatus("error");
      setMsg(err);
      return;
    }

    // Normalize payload (next step: POST to /api/submit which forwards to n8n)
    const payload = {
      phone: normalize(form.phone),
      model_number: normalize(form.model).toUpperCase(),
      serial_number: normalize(form.serial).toUpperCase(),
      first_name: normalize(form.firstName),
      last_name: normalize(form.lastName),
      email: normalize(form.email),
      address: {
        line1: normalize(form.address1),
        line2: normalize(form.address2),
        city: normalize(form.city),
        state: normalize(form.state).toUpperCase(),
        zip: normalize(form.zip),
      },
      consent: form.consent,
      source: "ryobi-recall-form",
      submitted_at: new Date().toISOString(),
    };

    try {
      console.log("FORM SUBMISSION PAYLOAD:", payload);

      // Simulate success for now
      await new Promise((r) => setTimeout(r, 400));

      setStatus("success");
      setMsg("Submission received. You may now close this page.");
    } catch {
      setStatus("error");
      setMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                fontWeight: 900,
                letterSpacing: 1.2,
                fontSize: 14,
                padding: "6px 10px",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 10,
              }}
            >
              RYOBI
            </div>

            <div style={{ display: "grid" }}>
              <h1 className="headerTitle">Recall Support</h1>
              <p className="headerSub">Submit Claim</p>
            </div>
          </div>
        </header>

        <div className="content">
          <form onSubmit={onSubmit}>
            <section className="section">
              <p className="sectionTitle">Customer Information</p>

              <div className="grid2">
                <label className="label">
                  First Name*
                  <input
                    className="input"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    autoComplete="given-name"
                  />
                </label>

                <label className="label">
                  Last Name*
                  <input
                    className="input"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    autoComplete="family-name"
                  />
                </label>
              </div>

              <div className="grid2">
                <label className="label">
                  Email*
                  <input
                    className="input"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </label>

                <label className="label">
                  Phone*
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+15551234567"
                    autoComplete="tel"
                  />
                </label>
              </div>

              <label className="label">
                Street*
                <input
                  className="input"
                  value={form.address1}
                  onChange={(e) => set("address1", e.target.value)}
                  autoComplete="address-line1"
                />
              </label>

              <label className="label">
                Address Line 2 (optional)
                <input
                  className="input"
                  value={form.address2}
                  onChange={(e) => set("address2", e.target.value)}
                  autoComplete="address-line2"
                />
              </label>

              <div className="grid3">
                <label className="label">
                  City*
                  <input
                    className="input"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    autoComplete="address-level2"
                  />
                </label>

                <label className="label">
                  State*
                  <input
                    className="input"
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    placeholder="TX"
                    maxLength={2}
                    autoComplete="address-level1"
                  />
                </label>

                <label className="label">
                  Zip/Postal Code*
                  <input
                    className="input"
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                    autoComplete="postal-code"
                  />
                </label>
              </div>
            </section>

            <section className="section">
              <p className="sectionTitle">Tool Details</p>

              <label className="label">
                Model Number*
                <input
                  className="input"
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="RY40630VNM"
                />
              </label>

              <label className="label">
                Serial Number*
                <input
                  className="input"
                  value={form.serial}
                  onChange={(e) => set("serial", e.target.value)}
                  placeholder="AB123456789"
                />
              </label>

              <p className="help">
                Prefilled values come from the SMS link. Please confirm they are correct.
              </p>
            </section>

            <label className="checkRow">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set("consent", e.target.checked)}
              />
              I confirm the information provided is accurate and I consent to be contacted about this recall.
            </label>

            <button className="button" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Submitting..." : "Submit Claim"}
            </button>

            {msg && (
              <div className={`msg ${status === "success" ? "msgSuccess" : "msgError"}`}>
                {msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
