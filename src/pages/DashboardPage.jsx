import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import GroupPaymentManager from '../components/GroupPaymentManager.jsx';
import PageHeader from '../components/PageHeader.jsx';

import {
  loadDashboardData,
  savePaymentStatus,
} from '../services/bcDataService.js';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadDashboardData()
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch(() => {
        toast.error('Could not load BC data');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handlePaymentStatusChange(payment) {
    const result = await savePaymentStatus(payment);

    toast.success(
      result.saved
        ? 'Payment saved to Firebase'
        : 'Payment updated for preview',
    );
  }

  if (loading || !data) {
    return (
      <>
        <PageHeader
          title="BC Dashboard"
          description="Loading BC data..."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="BC Dashboard"
        description={`Today is ${dayjs().format(
          'dddd, DD MMMM YYYY',
        )}.`}
      />

      <div className="mt-6">
        <GroupPaymentManager
          groups={data.groupOverview}
          onPaymentStatusChange={
            handlePaymentStatusChange
          }
        />
      </div>
    </>
  );
}