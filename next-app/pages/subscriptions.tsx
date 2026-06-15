import Head from 'next/head';
import Layout from '../components/layout';
import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { getCanonicalEmail } from '@/utils/auth';
import { GetServerSidePropsContext } from 'next';
import { useState } from 'react';
import styles from '@/styles/subscriptions.module.css';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';
import SubscriptionCard, { toMonthly, toYearly } from '@/components/subscriptions/SubscriptionCard';
import SubscriptionModal, { SubscriptionFormData, Periodicity } from '@/components/subscriptions/SubscriptionModal';

interface Subscription {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  periodicity: string;
  image?: string | null;
  order: number;
}

interface SubscriptionsProps {
  subscriptions?: Subscription[];
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res } = context;
  const session = await getServerSession(req, res, options);

  if (session && session.user?.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: getCanonicalEmail(session.user.email) },
      });

      if (user) {
        const subscriptions = await prisma.subscription.findMany({
          where: { userId: user.id },
          orderBy: { order: 'asc' },
        });

        return {
          props: { subscriptions: JSON.parse(JSON.stringify(subscriptions)) },
        };
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  }

  return { props: {} };
}

export default function Subscriptions({ subscriptions: init }: SubscriptionsProps) {
  const { showMessage } = useFlashMessage();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(init ?? []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalMonthly = subscriptions.reduce((sum, s) => sum + toMonthly(s.price, s.periodicity), 0);
  const totalYearly = subscriptions.reduce((sum, s) => sum + toYearly(s.price, s.periodicity), 0);

  const openAdd = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const getInitialData = (): SubscriptionFormData | null => {
    if (!editingId) return null;
    const s = subscriptions.find(x => x.id === editingId);
    if (!s) return null;
    return {
      title: s.title,
      description: s.description ?? '',
      price: String(s.price),
      periodicity: s.periodicity as Periodicity,
      image: s.image ?? '',
    };
  };

  const handleSave = async (form: SubscriptionFormData) => {
    const price = parseFloat(form.price);
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      price,
      periodicity: form.periodicity,
      image: form.image.trim() || null,
    };

    if (editingId) {
      const res = await fetch(`/api/subscriptions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { subscription } = await res.json();
        setSubscriptions(prev => prev.map(s => (s.id === editingId ? subscription : s)));
        showMessage(`${body.title} updated`, 'success');
      } else {
        showMessage('Failed to update subscription', 'error');
        throw new Error('update failed');
      }
    } else {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { subscription } = await res.json();
        setSubscriptions(prev => [...prev, subscription]);
        showMessage(`${body.title} added`, 'success');
      } else {
        showMessage('Failed to add subscription', 'error');
        throw new Error('add failed');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const sub = subscriptions.find(s => s.id === id);
    const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      showMessage(`${sub?.title ?? 'Subscription'} removed`, 'success');
    } else {
      showMessage('Failed to delete subscription', 'error');
      throw new Error('delete failed');
    }
  };

  return (
    <Layout pageTitle="Subscriptions">
      <Head>
        <title>My Subscriptions</title>
      </Head>

      {subscriptions.length > 0 && (
        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Spending Overview</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Per Month</span>
              <span className={styles.summaryValue}>€{totalMonthly.toFixed(2)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Per Year</span>
              <span className={styles.summaryValue}>€{totalYearly.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cards}>
        {subscriptions.map(s => (
          <SubscriptionCard key={s.id} subscription={s} onEdit={openEdit} />
        ))}
        <div className={styles.addCard} onClick={openAdd}>
          <span className={styles.addIcon}>+</span>
          <span className={styles.addLabel}>Add subscription</span>
        </div>
      </div>

      <SubscriptionModal
        open={modalOpen}
        editingId={editingId}
        initialData={getInitialData()}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </Layout>
  );
}
