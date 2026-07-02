import dayjs from 'dayjs';
import { CalendarCheck, CheckCircle2, Clock, IndianRupee, Layers3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/Card.jsx';
import GroupPaymentManager from '../components/GroupPaymentManager.jsx';
import MetricCard from '../components/MetricCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { loadDashboardData, saveGroupEventDates, savePaymentStatus } from '../services/bcDataService.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

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
    toast.success(result.saved ? 'Payment saved to Firebase' : 'Payment updated for preview');
  }

  async function handleEventDateChange(groupId, dates) {
    const result = await saveGroupEventDates(groupId, dates);
    toast.success(result.saved ? 'Date saved to Firebase' : 'Date updated for preview');
  }

  if (loading || !data) {
    return (
      <>
        <PageHeader title="BC Payment Dashboard" description="Loading BC data..." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-lg bg-white/80" />
          ))}
        </div>
      </>
    );
  }

  const stats = data.dashboardStats;
  const groupOverview = data.groupOverview;

  return (
    <>
      <PageHeader
        title="BC Payment Dashboard"
        description={`Welcome back. Today is ${dayjs().format('dddd, DD MMMM YYYY')}. Data source: ${data.source}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Layers3} label="Total BC Groups" value={stats.totalGroups} />
        <MetricCard icon={Clock} label="Running Groups" value={stats.runningGroups} tone="gold" />
        <MetricCard icon={CheckCircle2} label="Completed Groups" value={stats.completedGroups} tone="slate" />
        <MetricCard icon={IndianRupee} label="Today's Collection" value={formatCurrency(stats.todayCollection)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Upcoming BC Dates</h3>
            <CalendarCheck size={20} className="text-leaf" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {stats.upcomingEvents.map((event) => (
              <div key={event.id} className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                <p className="font-bold">{event.groupName}</p>
                <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p>Collection: <strong>{formatDate(event.collectionDate)}</strong></p>
                  <p>Winner: <strong>{formatDate(event.winnerDate)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 via-white to-cyan-50 p-5">
          <p className="text-sm font-semibold uppercase text-slate-500">Payment Focus</p>
          <h3 className="mt-2 text-xl font-bold">{stats.pendingPayments} pending payment entries</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Today&apos;s recorded collection is <strong>{formatCurrency(stats.todayCollection)}</strong>. The BC cards
            below keep each member&apos;s monthly status editable in one place.
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <GroupPaymentManager
          groups={groupOverview}
          onEventDateChange={handleEventDateChange}
          onPaymentStatusChange={handlePaymentStatusChange}
        />
      </div>
    </>
  );
}
