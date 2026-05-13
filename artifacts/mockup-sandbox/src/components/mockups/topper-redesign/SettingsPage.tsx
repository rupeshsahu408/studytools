import "./_group.css";
import { ArrowLeft, Camera, User, Globe, Instagram, Twitter, EyeOff, UserX, ChevronRight, Check, Shield } from "lucide-react";
import { useState } from "react";

export function SettingsPage() {
  const [anonymous, setAnonymous] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="phone-frame">
      <div className="top-header">
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--t2-muted)", fontSize: 13, padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--t2-text)" }}>Settings</span>
        <div style={{ width: 50 }} />
      </div>

      <div className="content-scroll no-nav" style={{ padding: "16px 16px" }}>

        {/* Profile Photo */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>Profile Photo</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#2E6F40,#4CBB17)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>R</span>
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--t2-green)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--t2-bg)" }}>
                <Camera size={11} color="#fff" />
              </div>
            </div>
            <div>
              <button style={{ background: "var(--t2-green)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Camera size={13} /> Change Photo
              </button>
              <p style={{ fontSize: 11, color: "var(--t2-muted)", marginTop: 5 }}>JPG, PNG · Max 5 MB</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Bio</p>
          <textarea placeholder="Write something about yourself… (Hindi ya English mein)" rows={3} style={{ width: "100%", background: "var(--t2-bg)", border: "1px solid var(--t2-border)", borderRadius: 12, padding: "10px 12px", color: "var(--t2-text)", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          <p style={{ fontSize: 11, color: "var(--t2-muted)", marginTop: 6, textAlign: "right" }}>0 / 120</p>
        </div>

        {/* Website */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Website / Link</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--t2-bg)", border: "1px solid var(--t2-border)", borderRadius: 12, padding: "10px 12px" }}>
            <Globe size={14} color="var(--t2-muted)" />
            <input placeholder="https://your-website.com" style={{ flex: 1, background: "none", border: "none", color: "var(--t2-text)", fontSize: 13, outline: "none" }} />
          </div>
        </div>

        {/* Social Links */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Social Links</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Instagram", prefix: "@", placeholder: "yourhandle", color: "#e1306c" },
              { label: "Twitter / X", prefix: "@", placeholder: "yourhandle", color: "#1da1f2" },
              { label: "Facebook", prefix: "fb/", placeholder: "yourprofile", color: "#1877f2" },
              { label: "Reddit", prefix: "u/", placeholder: "yourprofile", color: "#ff4500" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--t2-bg)", border: "1px solid var(--t2-border)", borderRadius: 12, padding: "10px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color, width: 80, flexShrink: 0 }}>{s.label}</span>
                <span style={{ fontSize: 12, color: s.color, opacity: 0.6 }}>{s.prefix}</span>
                <input placeholder={s.placeholder} style={{ flex: 1, background: "none", border: "none", color: "var(--t2-text)", fontSize: 13, outline: "none" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy — Anonymous mode */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>Privacy</p>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <button onClick={() => setAnonymous(v => !v)} style={{ width: 44, height: 24, borderRadius: 99, background: anonymous ? "var(--t2-green)" : "var(--t2-border)", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s", marginTop: 2 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: anonymous ? 23 : 3, transition: "left 0.2s" }} />
            </button>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>Anonymous Mode</p>
              <p style={{ fontSize: 11, color: "var(--t2-muted)", lineHeight: 1.5, marginTop: 3 }}>Others see "Anonymous" instead of your name. You still get all features — discussions, badges, chat.</p>
            </div>
          </div>
        </div>

        {/* Blocked Users */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={16} color="var(--t2-muted)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t2-text)" }}>Blocked Users</p>
            <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>No blocked users</p>
          </div>
          <ChevronRight size={14} color="var(--t2-muted2)" />
        </div>

        {/* Save button */}
        <button onClick={() => setSaved(true)} style={{ width: "100%", background: saved ? "rgba(76,187,23,0.15)" : "var(--t2-green)", border: saved ? "1.5px solid var(--t2-green)" : "none", borderRadius: 14, padding: "15px", color: saved ? "var(--t2-green-lt)" : "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {saved ? <><Check size={16} /> Settings Saved!</> : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
