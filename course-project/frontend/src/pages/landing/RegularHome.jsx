import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowPathIcon, CloudArrowUpIcon, FingerPrintIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useUser } from '../../contexts/UserContexts'

console.log('RegularHome rendered...')

const features = [
  {
    name: 'QR Code',
    description:
      'Create a transaction or redeem unclaimed ',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'SSL certificates',
    description:
      'Sit quis amet rutrum tellus ullamcorper ultricies libero dolor eget. Sem sodales gravida quam turpis enim lacus amet.',
    icon: LockClosedIcon,
  },
  {
    name: 'Simple queues',
    description:
      'Quisque est vel vulputate cursus. Risus proin diam nunc commodo. Lobortis auctor congue commodo diam neque.',
    icon: ArrowPathIcon,
  },
  {
    name: 'Advanced security',
    description:
      'Arcu egestas dolor vel iaculis in ipsum mauris. Tincidunt mattis aliquet hac quis. Id hac maecenas ac donec pharetra eget.',
    icon: FingerPrintIcon,
  },
]

export default function Regular() {
  const { user, loadingUser } = useUser()
  const nameDisplay = loadingUser ? 'Loading...' : user ? user.name : '(FirstName), (LastName)'
  const pointsDisplay = loadingUser ? '...' : user ? user.points : '(##)'

  const [selected, setSelected] = useState(null)
  const triggerRef = useRef(null)

  const openFeature = useCallback((f, target) => {
    triggerRef.current = target
    setSelected(f)
  }, [])
  const close = useCallback(() => {
    setSelected(null)
    if (triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [])

  // Escape key can close modal
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    if (selected) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [selected, close])

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base/7 font-semibold text-flag-red-500">Taking Your Point to Premio!</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
            {nameDisplay}
          </p>
          <p className="mt-6 text-lg/8 text-gray-700">
            You currently have {pointsDisplay} points.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            {features.map((feature) => (
              <Card
                key={feature.name}
                className="group cursor-pointer transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-strawberry-500"
                tabIndex={0}
                role="button"
                aria-haspopup="dialog"
                aria-label={`Open details for ${feature.name}`}
                onClick={(e) => openFeature(feature, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openFeature(feature, e.currentTarget)
                  }
                }}
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-strawberry-red-600 text-white shadow-sm">
                    <feature.icon aria-hidden="true" className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">{feature.name}</CardTitle>
                    <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Faded background */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={close}
          />

          {/* Modal content */}
          <Card className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-xl">
            <button
              type="button"
              onClick={close}
              aria-label="Close dialog"
              className="absolute top-4 right-4 rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition duration-150 group/button"
            >
              <XMarkIcon className="size-5 transition-transform duration-150 group-hover/button:rotate-90" />
            </button>
            <CardHeader className="flex flex-col gap-2 pt-6 pr-12">
              <CardTitle id="popup-title" className="flex items-center gap-3 text-lg">
                <selected.icon className="size-6 text-strawberry-500" /> {selected.name}
              </CardTitle>
              <CardDescription>{selected.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed pb-6">
                {selected.details}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}