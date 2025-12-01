import { useState, useCallback, useEffect, useRef } from 'react'
import ModalForm from '@/components/Modal/ModalForm'
import Message from '@/components/Message'
import { useUser } from '../../contexts/UserContexts'
import QRCode from 'react-qr-code'
import { ArrowsRightLeftIcon, QrCodeIcon, CursorArrowRaysIcon, ArrowPathIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {getTransactionFields} from "@/components/Modal/FormFields/TransactionFields";

console.log('RegularHome rendered...')

const features = [
  {
    name: 'QR Code',
    description:
      'View your QR code.',
    icon: QrCodeIcon,
  },
  {
    name: 'Transfer Points',
    description:
      'Transfer points to another user.',
    icon: ArrowsRightLeftIcon,
  },
  {
    name: 'Pending Redemptions',
    description:
      'View all your unprocessed point redemption requests.',
    icon: ArrowPathIcon,
  },
  {
    name: 'Redeem Points',
    description:
      'Request to redeem your points. You receive $1 for every 100 points redeemed.',
    icon: CursorArrowRaysIcon,
  },
]

export default function Regular() {
  const API_URL = import.meta.env.VITE_API_URL; // API base URL
  const { user, loadingUser, reloadProfile, role, visualRole } = useUser()
  const nameDisplay = loadingUser ? 'Loading...' : user ? user.name : '(FirstName), (LastName)'
  const pointsDisplay = loadingUser ? '...' : user ? user.points : '(##)'
  const roleDisplay = loadingUser ? 'Loading...' : role === 'regular' ? 'regular user' : role ? role : 'N/A'

  const [selected, setSelected] = useState(null)
  const [qrValue, setQrValue] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const triggerRef = useRef(null)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [pendingRedemptions, setPendingRedemptions] = useState([])
  const [pendingRedemptionsOpen, setPendingRedemptionsOpen] = useState(false)
  const [currentRedemptionIndex, setCurrentRedemptionIndex] = useState(0)

  const fetchQr = useCallback(async () => {
    if (!user) return
    setQrLoading(true)
    try {
      const res = await fetch(`${API_URL}/users/me/qr`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to fetch QR token')
      const data = await res.json()
      setQrValue(data.qrToken)
    } catch (e) {
      console.error(e)
      setQrValue(null)
    } finally {
      setQrLoading(false)
    }
  }, [user])

  // Fetch pending redemptions on component mount
  useEffect(() => {
    const fetchPendingRedemptions = async () => {
      try {
        const params = new URLSearchParams();
        params.append('type', 'redemption');
        params.append('processed', 'false');
        // Always pass asRole=regular since this is the regular user dashboard
        if (role !== 'regular') {
          params.append('asRole', 'regular');
        }
        
        const res = await fetch(`${API_URL}/users/me/transactions?${params}`, {
          credentials: 'include'
        });
        
        if (!res.ok) throw new Error('Failed to fetch redemptions');
        
        const data = await res.json();
        setPendingRedemptions(data.results);
      } catch (err) {
        console.error('Error fetching pending redemptions:', err);
      }
    };
    
    fetchPendingRedemptions();
  }, [API_URL, role])


  const openFeature = useCallback((f, target) => {
    triggerRef.current = target
    // For Transfer Points open the ModalForm directly
    if (f.name === 'Transfer Points') {
      setTransferOpen(true);
      return;
    }
    // For Redeem Points open the ModalForm directly
    if (f.name === 'Redeem Points') {
      setRedeemOpen(true);
      return;
    }
    // For Pending Redemptions open the gallery modal
    if (f.name === 'Pending Redemptions') {
      setPendingRedemptionsOpen(true);
      setCurrentRedemptionIndex(0);
      return;
    }

    setSelected(f)
    if (f.name === 'QR Code') {
      fetchQr()
    }
  }, [fetchQr])

  const [transferOpen, setTransferOpen] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageStatus, setMessageStatus] = useState(null)

  const handleTransferSubmit = async (data) => {
    // data: { recipientUtorid, amount, remark }
    const recipientUtorid = (data.recipientUtorid || '').trim();
    const amount = Number(data.amount);
    const remark = data.remark || '';

    if (!recipientUtorid) {
      setMessageStatus('error');
      setMessage('Recipient UTORID is required');
      return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setMessageStatus('error');
      setMessage('Amount must be a positive integer');
      return;
    }

    try {
      // lookup recipient id
      const lookupRes = await fetch(`${API_URL}/users/lookup/${encodeURIComponent(recipientUtorid)}`, { credentials: 'include' });
      if (!lookupRes.ok) {
        const body = await lookupRes.json().catch(() => ({}));
        setMessageStatus('error');
        setMessage(body.error || 'Recipient not found');
        return;
      }
      const recipient = await lookupRes.json();

      // post transfer
      const res = await fetch(`${API_URL}/users/${recipient.id}/transactions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'transfer', amount, remark }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessageStatus('error');
        setMessage(body.error || 'Transfer failed');
        return;
      }

      setMessageStatus('success');
      setMessage(`Sent ${amount} points to ${recipient.utorid}`);
      setTransferOpen(false);
      setSelected(null);
      
      // refresh profile to update points
      if (reloadProfile) reloadProfile();
    } catch (err) {
      console.error('Transfer error', err);
      setMessageStatus('error');
      setMessage('Network error during transfer');
    }
  }

  const handleRedeemSubmit = async (data) => {
    const formFields = getTransactionFields('regular', 'redeem');
    const payload = {};

    formFields.forEach((f) => {
      let value = data[f.name];

      if (f.multiNumber) {
        const str = typeof value === "string" ? value.trim() : "";
        payload[f.name] = str === ""
          ? [] // empty input → empty array
          : str.split(/[\s,]+/)
              .map(Number)
              .filter(n => !isNaN(n));
      }
      else if (f.type === "number" || f.type === "price") {
        payload[f.name] = value ? Number(value) : null;
      }
      else {
        payload[f.name] = value ?? "";
      }
    });

    try {
      const res = await fetch(`${API_URL}/users/me/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("RAW: ", JSON.stringify(result))

      if (!res.ok) {
        setMessageStatus('error');
        setMessage(result.error || "Points redemption request failed");
        return;
      }

      setMessageStatus('success');
      setMessage("Successfully sent request to redeem points");
      setRedeemOpen(false);
      
      // refresh profile to update points
      if (reloadProfile) reloadProfile();
      
      // refetch pending redemptions
      try {
        const params = new URLSearchParams();
        params.append('type', 'redemption');
        
        const res = await fetch(`${API_URL}/users/me/transactions?${params}`, {
          credentials: 'include'
        });
        
        if (res.ok) {
          const data = await res.json();
          const pending = data.results.filter(t => !t.processed);
          setPendingRedemptions(pending);
        }
      } catch (err) {
        console.error('Error refetching pending redemptions:', err);
      }
    } catch (err) {
      console.error("Network error:", err);
      setMessageStatus('error');
      setMessage('Network error during redemption');
    }
  }

  const close = useCallback(() => {
    setSelected(null)
    setTransferOpen(false)
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
            {nameDisplay}
          </p>
          <p className="mt-4 text-lg/8 text-gray-700">
            You are a: <span className="font-semibold text-space-indigo-500">{roleDisplay}</span>
          </p>
          <p className="mt-2 text-lg/8 text-gray-700">
            You currently have {pointsDisplay} points.
          </p>
        </div>
        {message && (
          <div className="mx-auto mt-4 max-w-2xl lg:text-center">
            <Message status={messageStatus} message={message} onClose={() => setMessage(null)} />
          </div>
        )}
        <div className="mx-auto mt-12 max-w-2xl sm:mt-12 lg:mt-14 lg:max-w-4xl">
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-strawberry-red-600 text-white shadow-sm">
                    <feature.icon className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
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
            <CardHeader className="flex flex-row items-start gap-4 pt-6 pr-12">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-strawberry-red-600 text-white shadow-sm">
                <selected.icon className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <CardTitle id="popup-title" className="text-lg mt-1">
                {selected.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected.name === 'QR Code' ? (
                <div className="space-y-4 pb-6">
                  {qrLoading && <p className="text-sm text-gray-500">Generating QR code...</p>}
                  {!qrLoading && user && qrValue && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-white rounded-md">
                        <QRCode value={qrValue} size={192} fgColor="#2B2D42" />
                      </div>
                    </div>
                  )}
                  {!qrLoading && !user && (
                    <p className="text-sm text-red-600">User not loaded. Please wait.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed pb-6">{selected.details}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Redemptions Gallery Modal */}
      {pendingRedemptionsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-redemptions-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Faded background */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setPendingRedemptionsOpen(false)}
          />

          {/* Modal content */}
          <Card className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-xl">
            <button
              type="button"
              onClick={() => setPendingRedemptionsOpen(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition duration-150 group/button"
            >
              <XMarkIcon className="size-5 transition-transform duration-150 group-hover/button:rotate-90" />
            </button>
            <CardHeader className="pt-6 pr-12">
              <CardTitle id="pending-redemptions-title">Pending Redemption Requests</CardTitle>
              <CardDescription>
                {pendingRedemptions.length === 0 
                  ? 'No pending redemptions' 
                  : `Redemption ${currentRedemptionIndex + 1} of ${pendingRedemptions.length}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              {pendingRedemptions.length === 0 ? (
                <p className="text-sm text-gray-700 text-center">You have no pending redemption requests.</p>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-md border border-gray-200">
                      <QRCode 
                        value={JSON.stringify({
                          id: pendingRedemptions[currentRedemptionIndex].id,
                          utorid: pendingRedemptions[currentRedemptionIndex].utorid,
                          amount: pendingRedemptions[currentRedemptionIndex].amount,
                          type: 'redemption'
                        })} 
                        size={192} 
                        fgColor="#2B2D42" 
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        Points: {pendingRedemptions[currentRedemptionIndex].amount}
                      </p>
                      {pendingRedemptions[currentRedemptionIndex].remark && (
                        <p className="text-xs text-gray-500">
                          {pendingRedemptions[currentRedemptionIndex].remark}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Navigation buttons */}
                  {pendingRedemptions.length > 1 && (
                    <div className="flex justify-center items-center gap-8 mt-6">
                      <button
                        onClick={() => setCurrentRedemptionIndex(Math.max(0, currentRedemptionIndex - 1))}
                        disabled={currentRedemptionIndex === 0}
                        className="p-2 rounded-full border border-gray-300 text-gray-700 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        aria-label="Previous redemption"
                      >
                        <ChevronLeftIcon className="size-6" />
                      </button>
                      <button
                        onClick={() => setCurrentRedemptionIndex(Math.min(pendingRedemptions.length - 1, currentRedemptionIndex + 1))}
                        disabled={currentRedemptionIndex === pendingRedemptions.length - 1}
                        className="p-2 rounded-full border border-gray-300 text-gray-700 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        aria-label="Next redemption"
                      >
                        <ChevronRightIcon className="size-6" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer ModalForm */}
      <ModalForm
        open={transferOpen}
        setOpen={setTransferOpen}
        formTitle="Transfer Points"
        formDescription="Transfer your points to another user"
        fields={[
          { name: 'recipientUtorid', label: 'Recipient UTORid', required: true },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'remark', label: 'Remark', required: false },
        ]}
        onSubmit={handleTransferSubmit}
      />

      {/* Redeem Points ModalForm */}
      <ModalForm
        open={redeemOpen}
        setOpen={setRedeemOpen}
        formTitle="Redeem Points"
        formDescription="Make a point redemption request"
        fields={getTransactionFields('regular', 'redeem')}
        onSubmit={handleRedeemSubmit}
      />
    </div>
  )
}
