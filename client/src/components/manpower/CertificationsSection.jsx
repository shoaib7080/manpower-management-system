import {
  Award,
  CheckCircle,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { uploadEmployeeCert } from "../../api/services";
import { inputCls } from "../ui/Modal";
import { toDateInput } from "./employeeUtils";

export default function CertificationsSection({
  certifications = [],
  onChange,
  selectedSpecializationObj,
}) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const handleCertFieldChange = (index, field, value) => {
    const next = certifications.map((c, i) =>
      i === index ? { ...c, [field]: value } : c,
    );
    onChange(next);
  };

  const handleAddCert = (name = "") => {
    const next = [
      ...certifications,
      {
        name,
        certificateNumber: "",
        issueDate: "",
        expiryDate: "",
        fileUrl: "",
        filePublicId: "",
        fileName: "",
      },
    ];
    onChange(next);
  };

  const handleRemoveCert = (index) => {
    const next = certifications.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;
    setUploadError("");
    setUploadingIndex(index);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadEmployeeCert(formData);
      const data = res.data?.data;
      if (data?.fileUrl) {
        const next = certifications.map((c, i) =>
          i === index
            ? {
                ...c,
                fileUrl: data.fileUrl,
                filePublicId: data.filePublicId,
                fileName: data.fileName || file.name,
              }
            : c,
        );
        onChange(next);
      }
    } catch (err) {
      setUploadError(
        err.response?.data?.message || "Failed to upload certificate image.",
      );
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveFile = (index) => {
    const next = certifications.map((c, i) =>
      i === index
        ? {
            ...c,
            fileUrl: "",
            filePublicId: "",
            fileName: "",
          }
        : c,
    );
    onChange(next);
  };

  // Check required certs from the selected specialization
  const requiredCertNames = Array.isArray(
    selectedSpecializationObj?.certifications,
  )
    ? selectedSpecializationObj.certifications.map((c) =>
        typeof c === "string" ? c : c?.name,
      )
    : [];

  const existingCertNames = certifications.map((c) => c.name?.trim().toLowerCase());
  const missingRequiredCerts = requiredCertNames.filter(
    (name) => name && !existingCertNames.includes(name.trim().toLowerCase()),
  );

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Award size={15} className="text-primary" />
          <span className="text-label-sm font-bold uppercase tracking-wide text-outline">
            Specialization Certifications
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleAddCert()}
          className="text-label-sm font-semibold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1"
        >
          <Plus size={13} /> Add Certificate
        </button>
      </div>

      {uploadError && (
        <div className="text-error text-body-sm mb-2 p-2 bg-error-container/30 rounded">
          {uploadError}
        </div>
      )}

      {/* Suggested Required Certs from Specialization */}
      {missingRequiredCerts.length > 0 && (
        <div className="p-2.5 mb-2.5 bg-primary-fixed/30 border border-primary-fixed-dim rounded-lg flex items-center justify-between flex-wrap gap-2">
          <div className="text-label-sm text-on-surface">
            Required by specialization:{" "}
            <span className="font-semibold">{missingRequiredCerts.join(", ")}</span>
          </div>
          <div className="flex gap-1.5">
            {missingRequiredCerts.map((reqName) => (
              <button
                key={reqName}
                type="button"
                onClick={() => handleAddCert(reqName)}
                className="text-label-sm px-2 py-0.5 bg-primary-container text-on-primary rounded hover:bg-primary transition-colors flex items-center gap-1"
              >
                <Plus size={11} /> Add {reqName}
              </button>
            ))}
          </div>
        </div>
      )}

      {certifications.length === 0 ? (
        <div className="p-3 border border-dashed border-outline-variant rounded text-center text-body-sm text-outline">
          No specialization certificates attached.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {certifications.map((cert, index) => {
            const isUploading = uploadingIndex === index;
            const hasFile = Boolean(cert.fileUrl);

            return (
              <div
                key={index}
                className="p-3 border border-outline-variant rounded-lg bg-surface-container-low/50 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-outline-variant/60 pb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Award size={14} className="text-primary shrink-0" />
                    <input
                      type="text"
                      className="font-semibold text-body-sm text-on-surface bg-transparent border-b border-dashed border-outline focus:border-primary focus:outline-none w-full max-w-[200px]"
                      placeholder="Certificate Name (e.g. ASME IX)"
                      value={cert.name || ""}
                      onChange={(e) =>
                        handleCertFieldChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(index)}
                    className="text-outline hover:text-error p-1 rounded transition-colors"
                    title="Remove Certificate"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-outline mb-1">
                      Certificate No.
                    </label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="e.g. CERT-9821"
                      value={cert.certificateNumber || ""}
                      onChange={(e) =>
                        handleCertFieldChange(
                          index,
                          "certificateNumber",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-outline mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={toDateInput(cert.issueDate)}
                      onChange={(e) =>
                        handleCertFieldChange(index, "issueDate", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-outline mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={toDateInput(cert.expiryDate)}
                      onChange={(e) =>
                        handleCertFieldChange(index, "expiryDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Cloudinary Document / Image Upload & Actions */}
                <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                  {hasFile ? (
                    <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-2.5 py-1.5 rounded text-body-sm text-on-surface">
                      <CheckCircle size={14} className="text-green shrink-0" />
                      <span className="truncate max-w-[170px] text-label-sm font-mono">
                        {cert.fileName || "certificate_file"}
                      </span>
                      <div className="flex items-center gap-1.5 ml-2 border-l border-outline-variant pl-2">
                        {/* View in New Tab */}
                        <a
                          href={cert.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-on-primary-fixed-variant flex items-center gap-0.5 text-label-sm"
                          title="View certificate"
                        >
                          <ExternalLink size={13} /> View
                        </a>
                        {/* Download Link */}
                        <a
                          href={cert.fileUrl}
                          download={cert.fileName || `${cert.name || "cert"}_file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-on-surface-variant hover:text-on-surface flex items-center gap-0.5 text-label-sm ml-1"
                          title="Download certificate"
                        >
                          <Download size={13} /> Download
                        </a>
                        {/* Remove File */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-outline hover:text-error ml-1"
                          title="Remove uploaded file"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-label-sm text-on-surface hover:bg-surface-container cursor-pointer transition-colors">
                      {isUploading ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-primary" />
                          <span>Compressing & Uploading…</span>
                        </>
                      ) : (
                        <>
                          <Upload size={13} className="text-primary" />
                          <span>Upload Certificate Image / PDF</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(index, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
