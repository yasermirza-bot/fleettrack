'use client';

import { useState, useEffect, useRef } from 'react';

export default function SettingsPage() {
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings/signature')
      .then(r => r.json())
      .then(d => {
        if (d.signatureDataUrl) setSavedSignature(d.signatureDataUrl);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/settings/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl: preview }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSavedSignature(preview);
      setPreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError('Failed to save signature. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Owner Signature</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Upload an image of your signature. It will be applied to contracts after the driver signs.
            Use a white background with black ink for best results.
          </p>

          {/* Current saved signature */}
          {savedSignature && !preview && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Signature
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: '#fff', display: 'inline-block' }}>
                <img src={savedSignature} alt="Owner signature" style={{ maxWidth: 300, maxHeight: 120, display: 'block' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 6 }}>
                ✅ Signature saved — will be used on all contracts
              </div>
            </div>
          )}

          {/* Preview new signature */}
          {preview && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                New Signature Preview
              </div>
              <div style={{ border: '2px solid var(--accent)', borderRadius: 8, padding: 12, background: '#fff', display: 'inline-block' }}>
                <img src={preview} alt="Signature preview" style={{ maxWidth: 300, maxHeight: 120, display: 'block' }} />
              </div>
            </div>
          )}

          {/* Upload button */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
              📁 {savedSignature ? 'Replace Signature' : 'Upload Signature'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
            {preview && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Signature'}
              </button>
            )}
            {preview && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPreview(null)}
              >
                Cancel
              </button>
            )}
          </div>

          {saved && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--green)', marginTop: 12 }}>
              ✅ Signature saved successfully!
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--red)', marginTop: 12 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 20, background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>Tips for a good signature image:</strong>
            <ul style={{ marginTop: 6, paddingLeft: 16 }}>
              <li>Sign on white paper with black pen</li>
              <li>Take a photo or scan it</li>
              <li>Crop tightly around the signature</li>
              <li>PNG or JPG format works best</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
