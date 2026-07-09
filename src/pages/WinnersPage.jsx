import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { formatDate } from '../utils/formatters.js';
import { loadWinnerHistory, loadEligibleWinnerMembers, saveWinnerForMonth } from '../services/bcDataService.js';

export default function WinnersPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    () => history.find((group) => group.id === selectedGroupId) || history[0] || null,
    [history, selectedGroupId],
  );

  const currentMonthNumber = useMemo(() => {
    if (!selectedGroup?.monthlyHistory?.length) return 0;
    const startDate = dayjs(selectedGroup.startDate);
    const monthIndex = Math.min(
      Math.max(dayjs().diff(startDate, 'month'), 0),
      selectedGroup.monthlyHistory.length - 1,
    );
    return monthIndex + 1;
  }, [selectedGroup]);

  const currentMonthEntry = useMemo(
    () => selectedGroup?.monthlyHistory?.find((entry) => entry.monthNumber === currentMonthNumber) || null,
    [selectedGroup, currentMonthNumber],
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
          currentMonthEntry.winner?.winnerName,
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
  }, [modalOpen, selectedGroup, currentMonthEntry, currentMonthNumber]);

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
        reason: currentWinner ? 'Wrong winner selected' : 'Automatic winner selection',
      });

      await fetchHistory();
      closeModal();
    } catch (err) {
      setModalError('Unable to save winner selection. Please try again.');
    } finally {
      setSavingMemberId('');
    }
  };

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Winner History"
        description="Track every month for each BC group and manage the current BC month safely."
        action={
          <Button type="button" variant="secondary" onClick={openModal}>
            Manage Winner
          </Button>
        }
      />

      {error && (
        <Card className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </Card>
      )}

      {loading ? (
        <Card className="rounded-3xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">Loading winner history…</p>
        </Card>
      ) : history.length === 0 ? (
        <Card className="rounded-3xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">No BC groups found.</p>
          <p className="mt-2 text-sm text-slate-500">Create a BC group to start recording winners.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {history.map((group) => (
            <Card key={group.id} className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                  <p className="mt-1 text-sm text-slate-500">Duration: {group.durationMonths} months</p>
                </div>
                <div className="mt-3 rounded-3xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm sm:mt-0">
                  Current BC month: {currentMonthNumber && group.id === selectedGroupId ? `Month ${currentMonthNumber} / ${selectedGroup?.durationMonths || selectedGroup?.monthlyHistory?.length}` : '—'}
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {group.monthlyHistory.filter((entry) => entry.winner).map((entry) => (
                  <div key={entry.monthLabel} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-[9rem]">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Month {entry.monthNumber}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{entry.monthLabel}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4 sm:flex-1">
                      <div>
                        <p className="text-xs text-slate-500">Winner</p>
                        <p className="mt-1 text-sm text-slate-900">{entry.winner?.winnerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Amount</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{entry.winner?.winningAmount ? `₹${entry.winner.winningAmount}` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <p className={`mt-1 text-sm font-semibold ${entry.status === 'Winner Selected' ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {entry.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 px-4 py-6">
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Manage Winner</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Current BC month</h3>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">BC Group</label>
                <select
                  value={selectedGroup?.id || ''}
                  onChange={(event) => handleGroupChange(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                >
                  {history.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Current Month</p>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                  {currentMonthLabel || 'Not available'}
                </div>
              </div>
            </div>

            {modalError && (
              <Card className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {modalError}
              </Card>
            )}

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              {modalLoading ? (
                <p className="text-sm text-slate-700">Loading eligible members…</p>
              ) : currentMonthEntry?.winner ? (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected winner</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{currentMonthEntry.winner.winnerName}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(currentMonthEntry.winner.winnerDate)}</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-700">Change the winner if the wrong member was selected.</p>
                    <Button type="button" onClick={startChangeWinner}>
                      Change Winner
                    </Button>
                  </div>

                  {isChangingWinner && (
                    <div className="space-y-4">
                      {eligibleMembers.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {eligibleMembers.map((member) => (
                            <Card key={member.id} className="rounded-3xl border border-slate-200 p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                                  <p className="mt-1 text-sm text-slate-500">{member.phone || 'No phone'}</p>
                                  <p className="mt-1 text-sm text-slate-500">{member.address || 'No village specified'}</p>
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => handleSelectWinner(member)}
                                  disabled={Boolean(savingMemberId)}
                                  className="w-full"
                                >
                                  {savingMemberId === member.id ? 'Saving…' : 'Select as Winner'}
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                          <p className="text-sm font-semibold text-slate-900">No eligible members available.</p>
                          <p className="mt-2 text-sm text-slate-500">Members who have already won are excluded from future selections.</p>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-700">No winner selected for the current month yet.</p>
                  {eligibleMembers.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {eligibleMembers.map((member) => (
                        <Card key={member.id} className="rounded-3xl border border-slate-200 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                              <p className="mt-1 text-sm text-slate-500">{member.phone || 'No phone'}</p>
                              <p className="mt-1 text-sm text-slate-500">{member.address || 'No village specified'}</p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => handleSelectWinner(member)}
                              disabled={Boolean(savingMemberId)}
                              className="w-full"
                            >
                              {savingMemberId === member.id ? 'Saving…' : 'Select as Winner'}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                      <p className="text-sm font-semibold text-slate-900">No eligible members available.</p>
                      <p className="mt-2 text-sm text-slate-500">Members who have already won are excluded from future selections.</p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
