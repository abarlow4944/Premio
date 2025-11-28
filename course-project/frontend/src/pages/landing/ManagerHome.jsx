import { useState, useCallback, useEffect, useRef } from 'react';
import { UsersIcon, CreditCardIcon, StarIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useUser } from "../../contexts/UserContexts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/UI/Card'


const features = [
  {
    name: 'Users',
    description:
      'View and manage users.',
    icon: UsersIcon,
  },
  {
    name: 'Transactions',
    description:
      'View and manage transactions.',
    icon: CreditCardIcon,
  },
  {
    name: 'Promotions',
    description:
      'View and manage promotions',
    icon: StarIcon,
  },
  {
    name: 'Events',
    description:
      'Create and manage events',
    icon: CalendarIcon,
  },
]

export default function Manager() {
  const { user, role } = useUser()
  const utorid = user.utorid
  const name = user.name;
  const points = user.points;
  const roleDisplay = role ? role : 'N/A';

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
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-flag-red-500 sm:text-5xl lg:text-balance">
            {name}
          </p>
          <p className="mt-4 text-lg/8 text-gray-700">
            You are a: <span className="font-semibold text-space-indigo-500">{roleDisplay}</span>
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            {features.map((feature) => (
              <Card
                key={feature.name}
                className="group cursor-pointer transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-strawberry-red-500"
                tabIndex={0}
                role="button"
                aria-haspopup="dialog"
                aria-label={`Open details for ${feature.name}`}
                onClick={(e) => openFeature(feature, e.currentTarget)}
                onKeyDown={(e) => {
                  console.log(e.currentTarget)
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openFeature(feature, e.currentTarget)
                  }
                }}
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-strawberry-red-500 text-white shadow-sm">
                    <feature.icon aria-hidden="true" className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-flag-red-500">{feature.name}</CardTitle>
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
                <selected.icon className="size-6 text-strawberry-red-500" /> {selected.name}
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