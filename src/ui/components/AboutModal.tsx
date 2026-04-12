import { useEffect } from 'react'
import { Button, Surface } from '../system'

interface AboutModalProps {
  open: boolean
  onClose: () => void
}

const appStoreUrl = 'https://itunes.apple.com/us/app/universal-paperclips/id1300634274?ls=1&mt=8'
const googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.everybodyhouse.paperclipsuniquetest'
const originalWebUrl = 'https://decisionproblem.com/paperclips/'

export function AboutModal({ open, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <Surface
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        className="relative w-full max-w-2xl p-0 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">About</p>
              <h2 id="about-modal-title" className="mt-2 text-2xl font-semibold text-white">
                Universal Paperclips Remake
              </h2>
            </div>
            <Button variant="ghost" onClick={onClose} type="button">
              Close
            </Button>
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:px-6">
          <div className="space-y-3 text-sm leading-6 text-slate-300">
            <p>
              This is an unofficial fan project and a technical UI/UX exercise. The remake is non-commercial and exists as a portfolio piece.
            </p>
            <p>
              Core logic/math is derived from the original game at{' '}
              <a className="text-cyan-300 underline decoration-cyan-400/50 underline-offset-4 hover:text-cyan-200" href={originalWebUrl} target="_blank" rel="noreferrer">
                decisionproblem.com/paperclips/
              </a>
              . Please support the creator by purchasing the official version.
            </p>
            <p>
              The original web version lives at{' '}
              <a className="text-cyan-300 underline decoration-cyan-400/50 underline-offset-4 hover:text-cyan-200" href={originalWebUrl} target="_blank" rel="noreferrer">
                decisionproblem.com/paperclips/
              </a>
              .
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:grid-cols-2">
            <SupportLink href={appStoreUrl} label="App Store" description="Official iPhone version" />
            <SupportLink href={googlePlayUrl} label="Google Play" description="Official Android version" />
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
            <p className="font-semibold text-white">Credits</p>
            <p>
              Original concept and game by Frank Lantz, Chair of the NYU Game Center. Visit his site at{' '}
              <a className="text-cyan-300 underline decoration-cyan-400/50 underline-offset-4 hover:text-cyan-200" href="http://www.franklantz.net" target="_blank" rel="noreferrer">
                franklantz.net
              </a>
              .
            </p>
            <p>
              All trademarks, names, story elements, and the underlying Universal Paperclips experience remain credited to their original creator.
            </p>
          </div>
        </div>
      </Surface>
    </div>
  )
}

function SupportLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm transition hover:border-cyan-400/40 hover:bg-slate-800"
    >
      <span className="block font-semibold text-white">{label}</span>
      <span className="mt-1 block text-slate-400">{description}</span>
    </a>
  )
}
