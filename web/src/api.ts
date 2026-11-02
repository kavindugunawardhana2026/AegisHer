const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

/** True on the static GitHub Pages copy when no backend URL was configured: the photo tools can't work there. */
export const serverMissing = !BASE && window.location.hostname.endsWith('github.io')

export type Strength = 'low' | 'medium' | 'high'

export interface CloakMetrics {
  strength: Strength
  epsilon_255: number
  steps: number
  max_steps: number
  surrogates: string[]
  faces_detected: number
  face_detector: string
  width: number
  height: number
  psnr_db: number
  encoder_similarity: Record<string, number>
  encoder_similarity_after_jpeg80: Record<string, number>
  metadata_stripped: boolean
  seconds: number
  device: string
}

export interface CloakResult {
  blob: Blob
  url: string
  filename: string
  metrics: CloakMetrics
}

export interface EvidenceItem {
  exhibit: string
  filename: string
  content_type: string
  size_bytes: number
  sha256: string
  sha512: string
  received_utc: string
  is_image: boolean
  image_format?: string
  width?: number
  height?: number
  phash?: string
  dhash?: string
  exif?: Record<string, string>
  exif_has_gps?: boolean
  image_error?: string
}

export type IncidentType =
  | 'deepfake'
  | 'non_consensual_image_sharing'
  | 'sextortion'
  | 'impersonation_fake_profile'
  | 'harassment_threats'
  | 'doxxing'
  | 'hacked_account'
  | 'other'

export interface Incident {
  complainant: {
    full_name: string
    email?: string
    phone?: string
    nic?: string
    address?: string
    on_behalf_of?: string
  }
  incident_type: IncidentType
  date_first_seen?: string
  description: string
  perpetrator?: string
  urls: { url: string; notes?: string }[]
}

export type ThumbnailMode = 'blurred' | 'full' | 'none'

export interface ReportResult {
  blob: Blob
  url: string
  filename: string
  reportId: string
  pdfSha256: string
  manifestSha256: string
}

export interface Contacts {
  authorities: { name: string; how: string; link: string | null; phone: string | null; email: string | null }[]
  platforms: { name: string; link: string }[]
}

async function fail(res: Response): Promise<never> {
  if (serverMissing) {
    throw new Error('This online preview is not connected to the AegisHer server, so photo tools are unavailable here.')
  }
  // 502/503/504 mean the proxy could not reach the Python backend (usually: it isn't running).
  if (res.status >= 502 && res.status <= 504) {
    throw new Error('Cannot reach the AegisHer server right now. Please check that the backend is running and try again.')
  }
  let msg = `${res.status} ${res.statusText}`
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') msg = body.detail
    else if (Array.isArray(body.detail)) msg = body.detail.map((d: { loc?: string[]; msg: string }) => `${(d.loc ?? []).join('.')}: ${d.msg}`).join('; ')
  } catch {
    /* not JSON */
  }
  throw new Error(msg)
}

function filenameFrom(res: Response, fallback: string) {
  const cd = res.headers.get('content-disposition') ?? ''
  return /filename="([^"]+)"/.exec(cd)?.[1] ?? fallback
}

export async function cloakPhoto(file: File, strength: Strength, signal?: AbortSignal): Promise<CloakResult> {
  const body = new FormData()
  body.append('file', file)
  body.append('strength', strength)
  const res = await fetch(`${BASE}/api/cloak`, { method: 'POST', body, signal })
  if (!res.ok) return fail(res)
  const blob = await res.blob()
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: filenameFrom(res, 'photo_aegis.png'),
    metrics: JSON.parse(res.headers.get('x-aegis-metrics') ?? '{}'),
  }
}

export async function analyzeEvidence(files: File[]): Promise<EvidenceItem[]> {
  const body = new FormData()
  files.forEach((f) => body.append('files', f))
  const res = await fetch(`${BASE}/api/evidence/analyze`, { method: 'POST', body })
  if (!res.ok) return fail(res)
  return (await res.json()).evidence
}

export async function generateReport(incident: Incident, files: File[], thumbnails: ThumbnailMode): Promise<ReportResult> {
  const body = new FormData()
  body.append('incident', JSON.stringify(incident))
  body.append('thumbnails', thumbnails)
  files.forEach((f) => body.append('files', f))
  const res = await fetch(`${BASE}/api/report`, { method: 'POST', body })
  if (!res.ok) return fail(res)
  const blob = await res.blob()
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: filenameFrom(res, 'report.pdf'),
    reportId: res.headers.get('x-report-id') ?? '',
    pdfSha256: res.headers.get('x-report-sha256') ?? '',
    manifestSha256: res.headers.get('x-manifest-sha256') ?? '',
  }
}

export async function getContacts(): Promise<Contacts> {
  const res = await fetch(`${BASE}/api/contacts`)
  if (!res.ok) return fail(res)
  return res.json()
}
