import { useNavigate } from 'react-router-dom';
import { UsersIcon, CreditCardIcon, StarIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { useUser } from "../../contexts/UserContexts";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'


const features = [
  {
    name: 'Users',
    description: 'View and manage users.',
    icon: UsersIcon,
    path: '/users',
  },
  {
    name: 'Transactions',
    description: 'View and manage transactions.',
    icon: CreditCardIcon,
    path: '/transactions',
  },
  {
    name: 'Promotions',
    description: 'View and manage promotions',
    icon: StarIcon,
    path: '/promotions',
  },
  {
    name: 'Events',
    description: 'Create and manage events',
    icon: CalendarIcon,
    path: '/events',
  },
]

export default function Manager() {
  const { user, role } = useUser()
  const navigate = useNavigate();
  const utorid = user.utorid
  const name = user.name;
  const points = user.points;
  const roleDisplay = role ? role : 'N/A';

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
                aria-label={`Go to ${feature.name}`}
                onClick={() => navigate(feature.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(feature.path)
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
    </div>
  )
}
