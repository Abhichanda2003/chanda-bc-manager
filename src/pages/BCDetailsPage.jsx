import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CreditCard, Award, FileText, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { loadDashboardData, loadGroupWinners, getCurrentBCMonth, loadCurrentMonthWinner, loadUndefeatedMembers, saveWinnerForMonth } from '../services/bcDataService.js';
import { formatCurrency, formatDate, statusClass } from '../utils/formatters.js';

export default function BCDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [showWinnerSelector, setShowWinnerSelector] = useState(false);
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [selectingWinner, setSelectingWinner] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchGroup() {
      setLoading(true);
      try {
        const data = await loadDashboardData();
        const found = (data.groupOverview || []).find((g) => g.id === id);
        if (mounted) {
          setGroup(found || null);
        }
      } catch (err) {
        if (mounted) setGroup(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchGroup();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!group) return;

    let mounted = true;

    async function fetchWinners() {
      setWinnersLoading(true);
      try {
        const { winners: groupWinners } = await loadGroupWinners(group.id);
        const { currentMonth: month, winner } = await loadCurrentMonthWinner(group.id);
        
        if (mounted) {
          setWinners(groupWinners);
          setCurrentMonth(month);
          setCurrentWinner(winner);
        }
      } catch (err) {
        if (mounted) {
          setWinners([]);
          setCurrentMonth(null);
          setCurrentWinner(null);
        }
      } finally {
        if (mounted) setWinnersLoading(false);
      }
    }

    fetchWinners();

    return () => {
      mounted = false;
    };
  }, [group]);

  if (loading) {
    return <div className="py-12">Loading...</div>;
  }

  if (!group) {
    return (
      <div className="py-12">
        <PageHeader title="BC not found" description="The selected BC could not be found." />
        <div className="mt-4">
          <button
            onClick={() => navigate('/groups')}
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            ← Back to BC List
          </button>
        </div>
      </div>
    );
  }

  const handleOpenWinnerSelector = async () => {
    setSelectingWinner(true);
    try {
      const eligible = await loadUndefeatedMembers(group.id);
      setEligibleMembers(eligible);
      setShowWinnerSelector(true);
    } catch (err) {
      console.error('Failed to load eligible members:', err);
    } finally {
      setSelectingWinner(false);
    }
  };

  const handleSelectWinner = async (memberId) => {
    setSelectingWinner(true);
    try {
      const member = eligibleMembers.find((m) => m.id === memberId);
      if (member && currentMonth !== null) {
        await saveWinnerForMonth({
          groupId: group.id,
          month: currentMonth.monthNumber,
          memberId,
          memberName: member.name,
        });
        const { winner } = await loadCurrentMonthWinner(group.id);
        setCurrentWinner(winner);
        setShowWinnerSelector(false);
      }
    } catch (err) {
      console.error('Failed to save winner:', err);
    } finally {
      setSelectingWinner(false);
    }
  };


  return (
    <div className="py-6">
      <div className="mb-4">
        <button
          onClick={() => navigate('/groups')}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          ← Back to BC List
        </button>
      </div>

      <PageHeader title={group.name} description="BC Overview" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Monthly Amount</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(group.monthlyAmount)}</p>
            </div>
            <div className="text-sm text-slate-500">
              <p>Total Members</p>
              <p className="mt-2 text-lg font-semibold">{group.totalMembers}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Duration</p>
              <p className="mt-1 text-sm font-medium">{group.durationMonths} months</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Status</p>
              <div className={`mt-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium ${statusClass(group.status)}`}>
                {group.status}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500">Start Date</p>
              <p className="mt-1 text-sm font-medium">{formatDate(group.startDate)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Collection Day</p>
              <p className="mt-1 text-sm font-medium">{group.collectionDay} of every month</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Winner Day</p>
              <p className="mt-1 text-sm font-medium">{group.winnerDay} of every month</p>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md"
      onClick={() => {
        navigate(`/groups/${id}/members`);
      }}
    >
      <div className="flex h-36 flex-col items-center justify-center gap-3 text-center">
        <Users size={28} />
        <p className="text-sm font-semibold text-slate-700">Members</p>
      </div>
    </div>

    <div
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md"
      onClick={() => navigate(`/groups/${id}/collections`)}
    >
      <div className="flex h-36 flex-col items-center justify-center gap-3 text-center">
        <CreditCard size={28} />
        <p className="text-sm font-semibold text-slate-700">Monthly Collection</p>
      </div>
    </div>

    <div
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Award size={24} className="mt-1 text-slate-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Winners</p>
            {winnersLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading…</p>
            ) : (
              <>
                {/* Current Month Status */}
                {currentMonth !== null && (
                  <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs font-medium text-blue-700">Month {currentMonth.monthNumber} / {group.durationMonths}</p>
                    {currentWinner ? (
                      <>
                        <p className="mt-1 text-sm font-semibold text-blue-900">{currentWinner.winnerName}</p>
                        <p className="mt-1 text-xs text-blue-600">
                          Winning Amount: <span className="font-semibold">{formatCurrency(currentWinner.winningAmount)}</span>
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-blue-600">Not Selected</p>
                    )}
                    {!currentWinner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWinnerSelector();
                        }}
                        disabled={selectingWinner}
                        className="mt-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Select Winner
                      </button>
                    )}
                  </div>
                )}

                {/* Winner Selector Modal */}
                {showWinnerSelector && (
                  <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center">
                    <div className="w-full rounded-t-lg bg-white p-6 sm:rounded-lg sm:max-w-md">
                      <p className="font-semibold text-slate-900">Select Winner for Month {currentMonth.monthNumber}</p>
                      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                        {eligibleMembers.length > 0 ? (
                          eligibleMembers.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => handleSelectWinner(member.id)}
                              disabled={selectingWinner}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                            >
                              {member.name}
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No eligible members available.</p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowWinnerSelector(false)}
                        className="mt-4 w-full rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Winners History */}
                {winners.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-slate-600">Completed</p>
                    {winners
                      .filter((w) => currentMonth === null || w.monthNumber < currentMonth.monthNumber)
                      .slice(0, 3)
                      .map((winner) => (
                        <div key={winner.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                          <span className="text-slate-700">
                            <span className="font-semibold">Month {winner.monthNumber}</span>
                            <span className="mx-2 text-slate-400">·</span>
                            <span>{winner.winnerName}</span>
                          </span>
                          <span className="font-semibold text-slate-900">{formatCurrency(winner.winningAmount)}</span>
                        </div>
                      ))}
                  </div>
                )}

                <button
                  onClick={() => navigate(`/groups/${id}/winners`)}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-leaf hover:text-leaf/80"
                >
                  View Winner History
                  <Users size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    <Card className="p-8">
      <div className="flex h-36 flex-col items-center justify-center gap-3 text-center">
        <FileText size={28} />
        <p className="text-sm font-semibold text-slate-700">Reports</p>
      </div>
    </Card>
  </div>
</div>
      </div>
    </div>
  );
}
