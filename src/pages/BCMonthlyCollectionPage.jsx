import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Phone, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { loadMonthlyCollection, markMemberPaid, markMemberUnpaid } from '../services/bcDataService.js';
import { formatCurrency } from '../utils/formatters.js';

const statusFilters = ['All', 'Paid', 'Pending'];

export default function BCMonthlyCollectionPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingMemberIds, setSavingMemberIds] = useState([]);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    let mounted = true;

    async function fetchCollection() {
      setLoading(true);
      setError('');

      try {
        const data = await loadMonthlyCollection(groupId);
        if (!mounted) return;

        setGroup(data.group);
        setMembers(data.members || []);
        setSchedule(data.schedule || []);

        const currentMonthLabel = dayjs().format('MMMM YYYY');
        const defaultMonth = data.schedule?.find((month) => month.label === currentMonthLabel)?.label || data.schedule?.[0]?.label || '';
        setSelectedMonth(defaultMonth);
      } catch (err) {
        if (!mounted) return;
        setError('Unable to load collection data. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCollection();

    return () => {
      mounted = false;
    };
  }, [groupId]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedScheduleItem = useMemo(
    () => schedule.find((item) => item.label === selectedMonth) || schedule[0] || null,
    [schedule, selectedMonth],
  );

  const monthlyStats = useMemo(() => {
    const currentMonthItem = selectedMonth || selectedScheduleItem?.label;
    const activeStatus = members.map((member) => {
      const memberSchedule = member.schedule || [];
      const item = memberSchedule.find((entry) => entry.month === currentMonthItem);
      return {
        member,
        status: item?.status || 'Pending',
        paymentId: item?.id,
        amount: item?.amount || group?.monthlyAmount || 0,
      };
    });

    const paidMembers = activeStatus.filter((item) => item.status === 'Paid');
    const pendingMembers = activeStatus.filter((item) => item.status !== 'Paid');
    const total = activeStatus.length;
    const paidCount = paidMembers.length;

    return {
      totalMembers: total,
      paidMembers: paidCount,
      pendingMembers: total - paidCount,
      collectedAmount: paidCount * (group?.monthlyAmount || 0),
      expectedAmount: total * (group?.monthlyAmount || 0),
      percentage: total ? Math.round((paidCount / total) * 100) : 0,
      activeStatus,
    };
  }, [group, members, selectedMonth, selectedScheduleItem]);

  const visibleMembers = useMemo(() => {
    const searchValue = query.trim().toLowerCase();
    return monthlyStats.activeStatus
      .filter((item) => {
        if (statusFilter === 'All') return true;
        return statusFilter === 'Paid' ? item.status === 'Paid' : item.status !== 'Paid';
      })
      .filter((item) => {
        if (!searchValue) return true;
        return (
          item.member.name?.toLowerCase().includes(searchValue) ||
          item.member.phone?.toLowerCase().includes(searchValue)
        );
      });
  }, [monthlyStats.activeStatus, query, statusFilter]);

  const handleStatusToggle = async (memberRecord) => {
    const { member, status, paymentId, amount } = memberRecord;
    const nextStatus = status === 'Paid' ? 'Unpaid' : 'Paid';
    const monthLabel = selectedMonth || selectedScheduleItem?.label;
    if (!member?.id || !monthLabel) return;

    setError('');
    setSavingMemberIds((current) => [...current, member.id]);
    setMembers((currentMembers) =>
      currentMembers.map((item) => {
        if (item.id !== member.id) return item;

        return {
          ...item,
          schedule: item.schedule.map((entry) =>
            entry.month === monthLabel
              ? { ...entry, status: nextStatus }
              : entry,
          ),
        };
      }),
    );

    try {
      if (nextStatus === 'Paid') {
        await markMemberPaid({
          groupId,
          memberId: member.id,
          month: monthLabel,
          paymentId,
          amount: amount || group?.monthlyAmount || 0,
        });
      } else {
        await markMemberUnpaid({
          groupId,
          memberId: member.id,
          month: monthLabel,
          paymentId,
          amount: amount || group?.monthlyAmount || 0,
        });
      }
    } catch (err) {
      setError('Unable to save payment status. Please try again.');
      setMembers((currentMembers) =>
        currentMembers.map((item) => {
          if (item.id !== member.id) return item;
          return {
            ...item,
            schedule: item.schedule.map((entry) =>
              entry.month === monthLabel ? { ...entry, status } : entry,
            ),
          };
        }),
      );
    } finally {
      setSavingMemberIds((current) => current.filter((id) => id !== member.id));
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadMonthlyCollection(groupId);
      setGroup(data.group);
      setMembers(data.members || []);
      setSchedule(data.schedule || []);
      setSelectedMonth(data.schedule?.[0]?.label || '');
    } catch (err) {
      setError('Unable to refresh collection data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">Loading monthly collection...</p>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="py-12 px-4 sm:px-6">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <p className="text-xl font-semibold text-slate-900">BC not found</p>
          <p className="mt-2 text-sm text-slate-500">The BC group could not be loaded.</p>
          <div className="mt-6 flex justify-center">
            <Button type="button" onClick={() => navigate(`/groups`)}>
              ← Back to BC list
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/groups/${groupId}`)}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back to BC
        </button>
      </div>

      <PageHeader
        title={group.name}
        description={`Current collection month: ${selectedMonth || '—'}`}
      />

      <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Month selector</p>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 sm:w-auto"
              >
                {schedule.map((month) => (
                  <option key={month.label} value={month.label}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Progress</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                Month {selectedScheduleItem ? selectedScheduleItem.index + 1 : 0} of {group.durationMonths || schedule.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">Collection status</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Members</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{monthlyStats.totalMembers}</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Paid Members</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-800">{monthlyStats.paidMembers}</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending Members</p>
                <p className="mt-2 text-2xl font-semibold text-rose-700">{monthlyStats.pendingMembers}</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Collection %</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{monthlyStats.percentage}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="rounded-3xl bg-white p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Collected Amount</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-800">{formatCurrency(monthlyStats.collectedAmount)}</p>
        </Card>
        <Card className="rounded-3xl bg-white p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Expected Amount</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(monthlyStats.expectedAmount)}</p>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusFilter === filter ? 'bg-leaf text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or phone"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          />
        </div>
      </div>

      {!isOnline && (
        <Card className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Offline mode detected. Changes will sync when your device reconnects.
        </Card>
      )}

      {error && (
        <Card className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center justify-between gap-3">
            <div>{error}</div>
            <button type="button" onClick={handleRetry} className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 underline">
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </Card>
      )}

      {members.length === 0 ? (
        <Card className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">No members available.</p>
          <p className="mt-2 text-sm text-slate-500">Please add members before collecting payments.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleMembers.map(({ member, status, paymentId, amount }, index) => (
            <Card key={member.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={16} /> {member.phone || 'No phone'}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} /> {member.address || 'No village'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Current Month
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleStatusToggle({ member, status, paymentId, amount })}
                    variant={status === 'Paid' ? 'primary' : 'secondary'}
                    className="min-w-[160px] px-5 py-4 text-base"
                    disabled={savingMemberIds.includes(member.id)}
                  >
                    {savingMemberIds.includes(member.id) ? 'Saving…' : status === 'Paid' ? '✔ Paid' : 'Pending'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {visibleMembers.length === 0 && (
            <Card className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-lg font-semibold text-slate-900">No matching members found.</p>
              <p className="mt-2 text-sm text-slate-500">Try a different filter or search term.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
