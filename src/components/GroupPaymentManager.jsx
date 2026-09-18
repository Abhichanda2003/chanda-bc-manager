import { CalendarDays, ChevronDown, ChevronUp, IndianRupee, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import Card from './Card.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function GroupPaymentManager({ groups, onEventDateChange, onPaymentStatusChange }) {
  const [openMembers, setOpenMembers] = useState({});
  const [editableGroups, setEditableGroups] = useState(groups);

  useEffect(() => {
    setEditableGroups(groups);
  }, [groups]);

  const totals = useMemo(
    () =>
      editableGroups.reduce(
        (summary, group) => {
          group.members.forEach((member) => {
            member.schedule.forEach((month) => {
              if (month.status === 'Paid') {
                summary.paid += month.amount;
              } else {
                summary.unpaid += month.amount;
              }
            });
          });
          return summary;
        },
        { paid: 0, unpaid: 0 },
      ),
    [editableGroups],
  );

  function toggleMember(groupId, memberId) {
    const key = `${groupId}-${memberId}`;
    setOpenMembers((current) => ({ ...current, [key]: !current[key] }));
  }

  function updateEventDate(groupId, field, value) {
    setEditableGroups((current) => current.map((group) => (group.id === groupId ? { ...group, [field]: value } : group)));
    onEventDateChange?.(groupId, { [field]: value });
  }

  function toggleMonth(groupId, memberId, monthName) {
    const currentGroup = editableGroups.find((group) => group.id === groupId);
    const currentMember = currentGroup?.members.find((member) => member.id === memberId);
    const currentMonth = currentMember?.schedule.find((month) => month.month === monthName);
    const changedPayment = currentMonth
      ? {
          ...currentMonth,
          groupId,
          memberId,
          status: currentMonth.status === 'Paid' ? 'Unpaid' : 'Paid',
          paymentDate: currentMonth.status === 'Paid' ? '' : new Date().toISOString().slice(0, 10),
        }
      : null;

    setEditableGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              members: group.members.map((member) =>
                member.id === memberId
                  ? {
                      ...member,
                      schedule: member.schedule.map((month) =>
                        month.month === monthName && changedPayment ? changedPayment : month,
                      ),
                    }
                  : member,
              ),
            }
          : group,
      ),
    );

    if (changedPayment) {
      onPaymentStatusChange?.(changedPayment);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-5">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total Paid Amount</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totals.paid)}</p>
        </Card>
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 p-5">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total Unpaid Amount</p>
          <p className="mt-2 text-3xl font-bold text-rose-700 dark:text-rose-400">{formatCurrency(totals.unpaid)}</p>
        </Card>
      </div>

      {editableGroups.map((group) => (
        <Card key={group.id} className="overflow-hidden border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700 p-5 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold">{group.name}</h3>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white/90">{group.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-2">
                    <IndianRupee size={16} /> {formatCurrency(group.monthlyAmount)} monthly
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-2">
                    <Users size={16} /> {group.members.length} members
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-2">
                    <CalendarDays size={16} /> {group.durationMonths} months
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:w-[430px]">
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-white/75">Collection Date</span>
                  <input
                    type="date"
                    value={group.collectionDate || ''}
                    onChange={(event) => updateEventDate(group.id, 'collectionDate', event.target.value)}
                    className="mt-1 min-h-10 w-full rounded-md border border-white/25 bg-slate-700 px-3 text-sm text-white outline-none focus:border-white/50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-white/75">Winner Date</span>
                  <input
                    type="date"
                    value={group.winnerDate || ''}
                    onChange={(event) => updateEventDate(group.id, 'winnerDate', event.target.value)}
                    className="mt-1 min-h-10 w-full rounded-md border border-white/25 bg-slate-700 px-3 text-sm text-white outline-none focus:border-white/50"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {group.members.map((member) => {
              const key = `${group.id}-${member.id}`;
              const isOpen = Boolean(openMembers[key]);
              const paidMonths = member.schedule.filter((month) => month.status === 'Paid').length;

              return (
                <div key={member.id} className="bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    data-testid={`member-toggle-${group.id}-${member.id}`}
                    onClick={() => toggleMember(group.id, member.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                  >
                    <div>
                      <p className="font-bold text-ink dark:text-slate-100">{member.name}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Paid {paidMonths} of {group.durationMonths} months
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{paidMonths === group.durationMonths ? 'Paid' : 'Pending'}</Badge>
                      {isOpen ? <ChevronUp size={20} className="text-slate-700 dark:text-slate-300" /> : <ChevronDown size={20} className="text-slate-700 dark:text-slate-300" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-4 sm:px-5 sm:grid-cols-2 xl:grid-cols-3">
                      {member.schedule.map((month) => (
                        <div key={month.month} className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink dark:text-slate-100">{month.month}</p>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{formatCurrency(month.amount)}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{formatDate(month.paymentDate)}</p>
                            </div>
                            <Badge>{month.status}</Badge>
                          </div>
                          <Button
                            type="button"
                            data-testid={`month-toggle-${group.id}-${member.id}-${month.month}`}
                            className="mt-3 w-full"
                            variant={month.status === 'Paid' ? 'secondary' : 'primary'}
                            onClick={() => toggleMonth(group.id, member.id, month.month)}
                          >
                            {month.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
