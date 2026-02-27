'use client'

import { useRef } from 'react'
import Image from 'next/image'

export interface LogoEntry {
  url: string
  name: string
}

interface LogoUploaderProps {
  logoUrls: LogoEntry[]
  onUpload: (file: File) => Promise<void>
  onRemove: (index: number) => Promise<void>
  isUploading?: boolean
  maxLogos?: number
}

const ACCEPTED_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export function LogoUploader({
  logoUrls,
  onUpload,
  onRemove,
  isUploading = false,
  maxLogos = 2,
}: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUploadMore = logoUrls.length < maxLogos

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected if removed
    e.target.value = ''

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Solo se aceptan archivos PNG, SVG o JPG.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('El archivo no debe superar 5 MB.')
      return
    }

    await onUpload(file)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!canUploadMore || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Solo se aceptan archivos PNG, SVG o JPG.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('El archivo no debe superar 5 MB.')
      return
    }

    await onUpload(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const isSvg = (url: string) => url.toLowerCase().includes('.svg') || url.toLowerCase().includes('image/svg')

  return (
    <div className="space-y-4">
      {/* Existing logos */}
      {logoUrls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {logoUrls.map((logo, idx) => (
            <div
              key={idx}
              className="relative group flex flex-col items-center gap-1.5 p-2 bg-background border border-border rounded-xl"
            >
              <div className="w-24 h-24 flex items-center justify-center rounded-lg overflow-hidden bg-surface">
                {isSvg(logo.url) ? (
                  // SVG: use img tag — next/image does not support SVG from external URLs well
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo.url}
                    alt={logo.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Image
                    src={logo.url}
                    alt={logo.name}
                    width={96}
                    height={96}
                    className="object-contain p-1"
                    unoptimized
                  />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium max-w-[96px] truncate">
                {logo.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                disabled={isUploading}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-40"
                aria-label={`Eliminar ${logo.name}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — only shown when can upload more */}
      {canUploadMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-colors ${
            isUploading
              ? 'border-border opacity-50 cursor-not-allowed'
              : 'border-border hover:border-primary/50 cursor-pointer'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Subir logo"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!isUploading) fileInputRef.current?.click()
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.svg,.jpg,.jpeg"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploading}
            aria-hidden="true"
          />

          {isUploading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg
                className="w-4 h-4 animate-spin text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
              Subiendo...
            </div>
          ) : (
            <>
              <svg
                className="w-8 h-8 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Arrastra un logo o{' '}
                  <span className="text-primary underline underline-offset-2">selecciona archivo</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, SVG, JPG — max 5 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {!canUploadMore && (
        <p className="text-xs text-muted-foreground">
          Maximo {maxLogos} {maxLogos === 1 ? 'logo' : 'logos'} permitidos. Elimina uno para subir otro.
        </p>
      )}
    </div>
  )
}
