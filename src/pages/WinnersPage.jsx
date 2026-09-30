import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  loadWinnerHistory,
  loadEligibleWinnerMembers,
  saveWinnerForMonth,
} from '../services/bcDataService.js';

export default function WinnersPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [isChangingWinner, setIsChangingWinner] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [savingMemberId, setSavingMemberId] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await loadWinnerHistory();
      setHistory(data);
    } catch (err) {
      setError('Unable to load winner history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!selectedGroupId && history.length > 0) {
      setSelectedGroupId(history[0].id);
    }
  }, [history, selectedGroupId]);

  const selectedGroup = useMemo(
    () =>
      history.find((group) => group.id === selectedGroupId) ||
      history[0] ||
      null,
    [history, selectedGroupId]
  );

  const currentMonthNumber = useMemo(() => {
    if (!selectedGroup?.monthlyHistory?.length) return 0;

    const startDate = dayjs(selectedGroup.startDate);

    const monthIndex = Math.min(
      Math.max(dayjs().diff(startDate, 'month'), 0),
      selectedGroup.monthlyHistory.length - 1
    );

    return monthIndex + 1;
  }, [selectedGroup]);

  const currentMonthEntry = useMemo(
    () =>
      selectedGroup?.monthlyHistory?.find(
        (entry) => entry.monthNumber === currentMonthNumber
      ) || null,
    [selectedGroup, currentMonthNumber]
  );

  const currentMonthLabel = currentMonthEntry?.monthLabel || '';

  useEffect(() => {
    if (!modalOpen || !selectedGroup || !currentMonthEntry) {
      return;
    }

    const loadMembers = async () => {
      setModalError('');
      setModalLoading(true);

      try {
        const members = await loadEligibleWinnerMembers(
          selectedGroup.id,
          currentMonthNumber,
          currentMonthEntry.winner?.id,
          currentMonthEntry.winner?.winnerName
        );

        setEligibleMembers(members);
      } catch (err) {
        setModalError('Unable to load eligible members.');
      } finally {
        setModalLoading(false);
      }
    };

    loadMembers();
    setIsChangingWinner(!currentMonthEntry.winner);
  }, [
    modalOpen,
    selectedGroup,
    currentMonthEntry,
    currentMonthNumber,
  ]);

  const openModal = () => {
    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEligibleMembers([]);
    setIsChangingWinner(false);
    setModalError('');
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId);
    setIsChangingWinner(false);
    setModalError('');
  };

  const startChangeWinner = () => {
    setIsChangingWinner(true);
  };

  const handleSelectWinner = async (member) => {
    if (!selectedGroup || !currentMonthEntry) return;

    const currentWinner = currentMonthEntry.winner;

    setSavingMemberId(member.id);
    setModalError('');

    try {
      await saveWinnerForMonth({
        groupId: selectedGroup.id,
        month: currentMonthNumber,
        memberId: member.id,
        memberName: member.name,
        currentWinnerId: currentWinner?.id,
        currentWinnerName: currentWinner?.winnerName,
        reason: currentWinner
          ? 'Wrong winner selected'
          : 'Automatic winner selection',
      });

      await fetchHistory();
      closeModal();
    } catch (err) {
      setModalError(
        'Unable to save winner selection. Please try again.'
      );
    } finally {
      setSavingMemberId('');
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroupId((current) =>
      current === groupId ? null : groupId
    );
  };

  const getWinnerCount = (group) => {
    return (
      group.monthlyHistory?.filter((entry) => entry.winner).length || 0
    );
  };

  const getWinnerAmount = (entry) => {
    if (!entry?.winner?.winningAmount) return '—';

    return `₹${Number(entry.winner.winningAmount).toLocaleString(
      'en-IN'
    )}`;
  };

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Winner History"
        description="View BC groups and manage monthly winners."
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={openModal}
          >
            Manage Winner
          </Button>
        }
      />

      {error && (
        <Card className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 p-4 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </Card>
      )}

      {loading ? (
        <Card className="rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Loading winner history…
          </p>
        </Card>
      ) : history.length === 0 ? (
        <Card className="rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            No BC groups found.
          </p>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create a BC group to start recording winners.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((group) => {
            const winnerCount = getWinnerCount(group);
            const totalMonths =
              group.durationMonths ||
              group.monthlyHistory?.length ||
              0;

            const isExpanded = expandedGroupId === group.id;

            return (
              <Card
                key={group.id}
                className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                {/* BC HEADER */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full text-left"
                >
                  <div className="bg-gradient-to-r from-emerald-700 to-cyan-700 px-5 py-5 text-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold">
                            {group.name}
                          </h2>

                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                            {group.status || 'Running'}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.monthlyAmount && (
                            <span className="rounded-lg bg-white/15 px-3 py-2 text-sm">
                              ₹
                              {Number(
                                group.monthlyAmount
                              ).toLocaleString('en-IN')}{' '}
                              monthly
                            </span>
                          )}

                          {group.monthlyHistory && (
                            <span className="rounded-lg bg-white/15 px-3 py-2 text-sm">
                              {totalMonths} months
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-white/70">
                            Winners
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {winnerCount} / {totalMonths}
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl">
                          {isExpanded ? '↑' : '↓'}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* MONTHLY WINNER LIST */}
                {isExpanded && (
                  <div className="bg-white dark:bg-slate-900">
                    {/* TABLE HEADER */}
                    <div className="hidden grid-cols-[90px_1fr_1fr_140px_140px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 md:grid">
                      <div>Month</div>
                      <div>Date</div>
                      <div>Winner</div>
                      <div>Amount</div>
                      <div>Status</div>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {group.monthlyHistory?.map((entry) => {
                        const hasWinner = Boolean(entry.winner);

                        return (
                          <div
                            key={`${group.id}-${entry.monthNumber}`}
                            className="px-5 py-4"
                          >
                            {/* DESKTOP */}
                            <div className="hidden grid-cols-[90px_1fr_1fr_140px_140px] items-center gap-4 md:grid">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  Month {entry.monthNumber}
                                </p>
                              </div>

                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {entry.monthLabel || '—'}
                              </div>

                              <div>
                                <p
                                  className={`text-sm font-semibold ${
                                    hasWinner
                                      ? 'text-slate-900 dark:text-slate-100'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {hasWinner
                                    ? entry.winner.winnerName
                                    : 'Pending Winner'}
                                </p>
                              </div>

                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {getWinnerAmount(entry)}
                              </div>

                              <div>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    hasWinner
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                  }`}
                                >
                                  {hasWinner
                                    ? 'Winner Selected'
                                    : 'Pending'}
                                </span>
                              </div>
                            </div>

                            {/* MOBILE */}
                            <div className="space-y-3 md:hidden">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Month {entry.monthNumber}
                                  </p>

                                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                    {entry.monthLabel || '—'}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    hasWinner
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                  }`}
                                >
                                  {hasWinner
                                    ? 'Winner Selected'
                                    : 'Pending'}
                                </span>
                              </div>

                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Winner
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {hasWinner
                                    ? entry.winner.winnerName
                                    : 'Pending Winner'}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Amount
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {getWinnerAmount(entry)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* MANAGE WINNER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-6">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Manage Winner
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                  Current BC month
                </h3>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  BC Group
                </label>

                <select
                  value={selectedGroup?.id || ''}
                  onChange={(event) =>
                    handleGroupChange(event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {history.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Current Month
                </p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  {currentMonthLabel || 'Not available'}
                </div>
              </div>
            </div>

            {modalError && (
              <Card className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                {modalError}
              </Card>
            )}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              {modalLoading ? (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Loading eligible members…
                </p>
              ) : currentMonthEntry?.winner ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Selected winner
                    </p>

                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {currentMonthEntry.winner.winnerName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(
                        currentMonthEntry.winner.winnerDate
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Change the winner if the wrong member was selected.
                    </p>

                    <Button
                      type="button"
                      onClick={startChangeWinner}
                    >
                      Change Winner
                    </Button>
                  </div>

                  {isChangingWinner && (
                    <WinnerMemberList
                      members={eligibleMembers}
                      savingMemberId={savingMemberId}
                      onSelect={handleSelectWinner}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    No winner selected for the current month yet.
                  </p>

                  <WinnerMemberList
                    members={eligibleMembers}
                    savingMemberId={savingMemberId}
                    onSelect={handleSelectWinner}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WinnerMemberList({
  members,
  savingMemberId,
  onSelect,
}) {
  if (!members.length) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          No eligible members available.
        </p>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Members who have already won are excluded from future selections.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {members.map((member) => (
        <Card
          key={member.id}
          className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
        >
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {member.name}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {member.phone || 'No phone'}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {member.address || 'No village specified'}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => onSelect(member)}
              disabled={Boolean(savingMemberId)}
              className="w-full"
            >
              {savingMemberId === member.id
                ? 'Saving…'
                : 'Select as Winner'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}