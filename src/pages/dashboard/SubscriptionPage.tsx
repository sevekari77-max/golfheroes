import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export function SubscriptionPage() {
  const { user, subscription, isSubscribed, refreshSubscription } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await supabase.from('subscriptions').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }).eq('user_id', user!.id).eq('status', 'active');
      await refreshSubscription();
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const startDate = subscription?.created_at
    ? new Date(subscription.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Subscription</h1>
        <p className="text-stone-400 text-sm mt-1">Manage your subscription and billing</p>
      </div>

      {isSubscribed && subscription ? (
        <div className="space-y-6">
          {/* Current plan card */}
          <div className="p-6 bg-gradient-to-r from-primary-900/30 to-stone-900/60 border border-primary-700/30 rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-stone-400 text-sm capitalize">{subscription.plan} plan</span>
                </div>
                <p className="text-3xl font-bold text-white">{formatCurrency(subscription.amount_pence)}</p>
                <p className="text-stone-400 text-sm">/{subscription.plan === 'monthly' ? 'month' : 'year'}</p>
              </div>
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-400" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {[
              { label: 'Plan', value: subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) },
              { label: 'Status', value: <Badge variant="success">Active</Badge> },
              { label: 'Started', value: startDate },
              { label: 'Renews', value: renewalDate },
              { label: 'Amount', value: formatCurrency(subscription.amount_pence) },
              { label: 'Currency', value: subscription.currency },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-stone-800/50">
                <span className="text-stone-400 text-sm">{label}</span>
                <span className="text-white text-sm">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/pricing" className="flex-1">
              <Button variant="outline" className="w-full" iconRight={<ArrowRight className="w-4 h-4" />}>
                Change Plan
              </Button>
            </Link>
            <Button variant="danger" className="flex-1" onClick={() => setShowCancelModal(true)}>
              Cancel Subscription
            </Button>
          </div>

          {/* Benefits */}
          <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
            <h3 className="text-white font-semibold mb-4">What you get</h3>
            <ul className="space-y-2.5">
              {[
                'Enter all monthly prize draws',
                'Win cash prizes matching 3, 4, or 5 numbers',
                'Minimum 10% goes to your chosen charity',
                'Score tracking with rolling 5-score window',
                'Priority winner verification',
              ].map(feat => (
                <li key={feat} className="flex items-center gap-2.5 text-sm text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div className="py-12 text-center bg-stone-900/40 border border-stone-700/30 rounded-2xl mb-6">
            <CreditCard className="w-12 h-12 text-stone-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No active subscription</h3>
            <p className="text-stone-400 text-sm mb-6 max-w-sm mx-auto">
              Subscribe to enter monthly draws, track scores, and support your chosen charity.
            </p>
            <Link to="/pricing">
              <Button variant="gold" iconRight={<ArrowRight className="w-4 h-4" />}>
                View Plans
              </Button>
            </Link>
          </div>

          {subscription?.status === 'cancelled' && (
            <div className="p-4 bg-error-500/10 border border-error-500/20 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0" />
              <div>
                <p className="text-error-400 text-sm font-medium">Subscription cancelled</p>
                <p className="text-stone-400 text-xs">
                  Cancelled on {subscription.cancelled_at
                    ? new Date(subscription.cancelled_at).toLocaleDateString('en-GB')
                    : 'unknown'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Subscription">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-warning-500/10 border border-warning-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
            <p className="text-stone-300 text-sm">
              Cancelling will immediately end your subscription. You'll lose access to draws and your charity contributions will stop.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCancelModal(false)}>Keep Plan</Button>
            <Button variant="danger" className="flex-1" loading={cancelling} onClick={handleCancel}>Confirm Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
