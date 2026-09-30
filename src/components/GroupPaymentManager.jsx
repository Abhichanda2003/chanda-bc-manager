import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import Badge from './Badge.jsx';
import Button from './Button.jsx';
import Card from './Card.jsx';

import {
  formatCurrency,
  formatDate,
} from '../utils/formatters.js';

export default function GroupPaymentManager({
  groups,
  onPaymentStatusChange,
}) {
  const [openGroups, setOpenGroups] = useState({});
  const [openMembers, setOpenMembers] = useState({});
  const [editableGroups, setEditableGroups] = useState(groups);

  useEffect(() => {
    setEditableGroups(groups);
  }, [groups]);

  function toggleGroup(groupId) {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  function toggleMember(groupId, memberId) {
    const key = `${groupId}-${memberId}`;

    setOpenMembers((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleMonth(groupId, memberId, monthName) {
    const currentGroup = editableGroups.find(
      (group) => group.id === groupId,
    );

    const currentMember = currentGroup?.members.find(
      (member) => member.id === memberId,
    );

    const currentMonth = currentMember?.schedule.find(
      (month) => month.month === monthName,
    );

    const changedPayment = currentMonth
      ? {
          ...currentMonth,
          groupId,
          memberId,
          status:
            currentMonth.status === 'Paid'
              ? 'Unpaid'
              : 'Paid',
          paymentDate:
            currentMonth.status === 'Paid'
              ? ''
              : new Date().toISOString().slice(0, 10),
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
                      schedule: member.schedule.map(
                        (month) =>
                          month.month === monthName &&
                          changedPayment
                            ? changedPayment
                            : month,
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
    <div className="w-full space-y-4 overflow-hidden sm:space-y-5">
      {editableGroups.map((group) => {
        const isGroupOpen = Boolean(openGroups[group.id]);

        return (
          <Card
            key={group.id}
            className="w-full overflow-hidden border-slate-200 dark:border-slate-700"
          >
            {/* =========================
                BC HEADER
            ========================== */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-4 text-white sm:p-5">
              <div className="flex flex-col gap-4">
                {/* BC INFORMATION */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full text-left"
                  aria-expanded={isGroupOpen}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-lg font-bold sm:text-2xl">
                          {group.name}
                        </h3>

                        <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white/90 sm:px-3 sm:text-sm">
                          {group.status}
                        </span>
                      </div>

                      {/* Mobile-friendly BC information */}
                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:flex sm:flex-wrap sm:gap-3 sm:text-sm">
                        <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-2.5 py-2">
                          <IndianRupee size={15} />
                          {formatCurrency(group.monthlyAmount)}
                          <span className="text-white/75">
                            / month
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-2.5 py-2">
                          <Users size={15} />
                          {group.members.length} members
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-2.5 py-2">
                          <CalendarDays size={15} />
                          {group.durationMonths} months
                        </span>
                      </div>
                    </div>

                    <span className="flex shrink-0 items-center justify-center rounded-full bg-white/20 p-2">
                      {isGroupOpen ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </span>
                  </div>
                </button>

                {/* BC DATE */}
                <div className="w-full">
                  <span className="text-xs font-semibold uppercase text-white/75">
                    BC Date
                  </span>

                  <div className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white">
                    {formatDate(group.collectionDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* =========================
                MEMBERS
            ========================== */}
            {isGroupOpen && (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {group.members.length === 0 ? (
                  <div className="bg-white px-4 py-6 text-center dark:bg-slate-900 sm:px-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No members added to this BC yet.
                    </p>
                  </div>
                ) : (
                  group.members.map((member) => {
                    const key = `${group.id}-${member.id}`;

                    const isOpen = Boolean(
                      openMembers[key],
                    );

                    const paidMonths =
                      member.schedule.filter(
                        (month) => month.status === 'Paid',
                      ).length;

                    return (
                      <div
                        key={member.id}
                        className="w-full bg-white dark:bg-slate-900"
                      >
                        {/* MEMBER HEADER */}
                        <button
                          type="button"
                          data-testid={`member-toggle-${group.id}-${member.id}`}
                          onClick={() =>
                            toggleMember(
                              group.id,
                              member.id,
                            )
                          }
                          className="flex min-h-[72px] w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-emerald-50 dark:hover:bg-slate-800 sm:px-5"
                          aria-expanded={isOpen}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-bold text-ink dark:text-slate-100">
                              {member.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                              Paid {paidMonths} of{' '}
                              {group.durationMonths} months
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Badge>
                              {paidMonths ===
                              group.durationMonths
                                ? 'Paid'
                                : 'Pending'}
                            </Badge>

                            {isOpen ? (
                              <ChevronUp
                                size={20}
                                className="text-slate-700 dark:text-slate-300"
                              />
                            ) : (
                              <ChevronDown
                                size={20}
                                className="text-slate-700 dark:text-slate-300"
                              />
                            )}
                          </div>
                        </button>

                        {/* MONTHLY PAYMENTS */}
                        {isOpen && (
                          <div className="bg-slate-50 px-3 py-3 dark:bg-slate-800 sm:px-5 sm:py-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {member.schedule.map((month) => (
                                <div
                                  key={month.month}
                                  className="w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-semibold text-ink dark:text-slate-100 sm:text-base">
                                        {month.month}
                                      </p>

                                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {formatCurrency(
                                          month.amount,
                                        )}
                                      </p>

                                      {month.paymentDate && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                                          {formatDate(
                                            month.paymentDate,
                                          )}
                                        </p>
                                      )}
                                    </div>

                                    <div className="shrink-0">
                                      <Badge>
                                        {month.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  <Button
                                    type="button"
                                    data-testid={`month-toggle-${group.id}-${member.id}-${month.month}`}
                                    className="mt-3 min-h-11 w-full text-sm"
                                    variant={
                                      month.status === 'Paid'
                                        ? 'secondary'
                                        : 'primary'
                                    }
                                    onClick={() =>
                                      toggleMonth(
                                        group.id,
                                        member.id,
                                        month.month,
                                      )
                                    }
                                  >
                                    {month.status === 'Paid'
                                      ? 'Mark Unpaid'
                                      : 'Mark Paid'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}