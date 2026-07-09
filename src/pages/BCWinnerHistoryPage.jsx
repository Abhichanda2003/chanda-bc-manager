import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { loadGroupById, loadGroupWinners } from '../services/bcDataService.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function BCWinnerHistoryPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const groupData = await loadGroupById(groupId);
        const { winners: groupWinners, currentMonth } = await loadGroupWinners(groupId);
        
        if (mounted) {
          setGroup(groupData);
          // Only show completed months (past months)
          setWinners(
            groupWinners.filter((w) => currentMonth === null || w.monthNumber < currentMonth.monthNumber)
          );
        }
      } catch (err) {
        if (mounted) {
          setGroup(null);
          setWinners([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [groupId]);

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

  return (
    <div className="py-6">
      <div className="mb-4">
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <ChevronLeft size={16} />
          Back to {group.name}
        </button>
      </div>

      <PageHeader 
        title={`${group.name} - Winner History`} 
        description="Completed months and winners" 
      />

      <div className="mt-6 max-w-2xl">
        {winners.length > 0 ? (
          <div className="space-y-3">
            {winners
              .sort((a, b) => b.monthNumber - a.monthNumber)
              .map((winner) => (
                <Card key={winner.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Month {winner.monthNumber}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{winner.winnerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(winner.winningAmount)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center">
              <p className="text-sm text-slate-500">No completed months yet.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
