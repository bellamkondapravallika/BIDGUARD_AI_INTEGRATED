import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Download,
  AlertCircle,
  Briefcase,
  FileCheck,
} from 'lucide-react'
import { getBidCases, getBidDocuments, uploadBidDocuments, deleteDocument } from '../api/api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'

export default function UploadDocuments() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('case') || '')
  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    getBidCases().then((data) => {
      setCases(data || [])
      if (!selectedCaseId && data && data.length > 0) {
        setSelectedCaseId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedCaseId) {
      loadDocuments(selectedCaseId)
    } else {
      setDocs([])
    }
  }, [selectedCaseId])

  function loadDocuments(caseId) {
    setLoadingDocs(true)
    getBidDocuments(caseId)
      .then((data) => setDocs(data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoadingDocs(false))
  }

  async function handleFilesSelected(filesList) {
    if (!filesList || filesList.length === 0) return
    if (!selectedCaseId) {
      setError('Please select or create a bid case first before uploading files.')
      return
    }

    setError('')
    setSuccess('')
    setUploading(true)

    const formData = new FormData()
    for (let i = 0; i < filesList.length; i++) {
      formData.append('files', filesList[i])
    }

    try {
      const uploaded = await uploadBidDocuments(selectedCaseId, formData)
      setSuccess(`Successfully uploaded and indexed ${uploaded.length} document(s).`)
      loadDocuments(selectedCaseId)
    } catch (err) {
      setError(err.message || 'File upload failed. Ensure format is PDF, DOCX, XLSX, CSV, or TXT.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteDoc(docId, name) {
    if (!window.confirm(`Delete document "${name}"?`)) return
    try {
      await deleteDocument(docId)
      setDocs((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      alert(err.message || 'Failed to delete document.')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files)
    }
  }

  const checklist = [
    'Manufacturer Authorization Form (MAF / OEM Certificate)',
    'Technical Parameters & Itemized Compliance Sheet',
    'GSTIN & PAN Registration Certificates',
    'Audited Annual Financial Statement / CA Turnover Certificate',
    'Satisfactory Client Performance & Experience Undertaking',
  ]

  return (
    <>
      <PageHeader
        eyebrow={`Case ${selectedCaseId || 'Selection'} / Intake`}
        title="Upload Documents"
        subtitle="Ingest tender files and vendor evidence for automatic text extraction, entity parsing, and clause matching."
        action={
          selectedCaseId && (
            <button
              onClick={() => navigate(`/analysis?case=${selectedCaseId}`)}
              className="btn-primary"
            >
              Run AI Analysis <ArrowRight size={15} />
            </button>
          )
        }
      />

      {/* Select Active Case */}
      <div className="panel p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Bid Case:</span>
          </div>
          {cases.length > 0 ? (
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0b2042] outline-none focus:border-emerald-400"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">No cases found.</span>
              <Link to="/cases/new" className="text-xs font-bold text-emerald-700 hover:underline">
                Create a case first
              </Link>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          {/* Drag & Drop Upload Zone */}
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragActive
                ? 'border-emerald-500 bg-emerald-100/50 scale-[1.01]'
                : 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md">
              <UploadCloud size={28} />
            </span>
            <span className="mt-5 font-display text-lg font-bold text-[#0b2042]">
              {uploading ? 'Uploading & parsing documents...' : 'Drop documents here or click to browse'}
            </span>
            <span className="mt-2 text-sm text-slate-500">
              Files are automatically stored in PostgreSQL storage and parsed for statutory entities
            </span>
            <span className="mt-5 text-xs text-slate-400">
              PDF, DOCX, XLSX, CSV, TXT &bull; Max 25 MB each
            </span>
          </label>

          {/* Uploaded Documents List */}
          <div className="panel mt-6 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display font-bold text-[#0b2042]">Uploaded Documents</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {docs.length} files
              </span>
            </div>

            {loadingDocs ? (
              <p className="mt-5 text-sm text-slate-400">Loading documents from storage...</p>
            ) : docs.length > 0 ? (
              <div className="mt-4 space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0b2042]">{doc.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatBytes(doc.file_size)} &bull; {doc.created_at}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge label={doc.status} />
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        title="Download file"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-[#0b2042] transition"
                      >
                        <Download size={15} />
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.name)}
                        title="Delete document"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-400">No documents uploaded for this case yet.</p>
            )}
          </div>
        </div>

        {/* Readiness Checklist */}
        <div>
          <div className="panel p-6">
            <p className="eyebrow">Evidence Readiness Checklist</p>
            <h2 className="mt-2 font-display text-lg font-bold text-[#0b2042]">Standard GeM Evidence</h2>
            <p className="mt-1 text-xs text-slate-500">
              The AI compliance engine looks for these standard statutory and technical schedules:
            </p>

            <div className="mt-5 space-y-3.5">
              {checklist.map((item, i) => (
                <div key={item} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-[10px]">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {selectedCaseId && (
              <button
                onClick={() => navigate(`/analysis?case=${selectedCaseId}`)}
                className="btn-primary mt-8 w-full py-3"
              >
                Proceed to AI Analysis <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
