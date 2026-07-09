import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/PageHeader.jsx';
import MemberFormModal from '../components/MemberFormModal.jsx';
import { loadDashboardData } from '../services/bcDataService.js';
import { formatDate } from '../utils/formatters.js';

export default function BCMembersPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadGroup() {
      setLoading(true);
      try {
        const data = await loadDashboardData();
        const selectedGroup = (data.groupOverview || []).find((item) => item.id === groupId);
        if (mounted) {
          setGroup(selectedGroup || null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadGroup();

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
        <Card className="mx-auto max-w-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-slate-900">BC not found</h2>
          <p className="mt-2 text-sm text-slate-500">The selected BC could not be loaded.</p>
          <div className="mt-6">
            <Button type="button" onClick={() => navigate(`/groups/${groupId}`)}>
              ← Back to BC
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const members = group.members || [];
  const filteredMembers = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.phone || '').toLowerCase().includes(q);
  });

  const buildPaymentHistory = (member) => {
    const totalMonths = group.durationMonths || 0;
    const schedule = member.schedule || [];

    return Array.from({ length: totalMonths }, (_, index) => {
      const scheduleItem = schedule[index];
      let status = 'Not Started';
      if (scheduleItem) {
        status = scheduleItem.status === 'Paid' ? 'Paid' : 'Unpaid';
      }

      return {
        monthLabel: `Month ${index + 1}`,
        status,
      };
    });
  };

  const paidMonthsForMember = (member) => {
    return (member.schedule || []).filter((item) => item.status === 'Paid').length;
  };

  return (
    <div className="py-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Button type="button" variant="secondary" onClick={() => navigate(`/groups/${groupId}`)}>
            ← Back to BC
          </Button>
          <div className="text-sm text-slate-600">{members.length} / {group.totalMembers || members.length} Members</div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          />
          <Button type="button" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Member
          </Button>
        </div>
      </div>

      <MemberFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        groupId={groupId}
        onMemberAdded={() => {
          (async () => {
            const data = await loadDashboardData();
            setGroup((data.groupOverview || []).find((item) => item.id === groupId) || null);
            setIsModalOpen(false);
          })();
        }}
      />

      <PageHeader title={group.name} description="View member payment progress and history. Monthly collection support is coming soon." />

      {filteredMembers.length === 0 ? (
        <Card className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">No members found.</p>
          <p className="mt-2 text-sm text-slate-500">Try changing the search term or add a new member.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredMembers.map((member, idx) => {
            const paidMonths = paidMonthsForMember(member);
            const totalMonths = group.durationMonths || 0;
            const paymentHistory = buildPaymentHistory(member);
            const isExpanded = expandedMemberId === member.id;

            return (
              <Card key={member.id} className="border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>#{idx + 1}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{member.phone}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{member.address}</p>
                      <p className="mt-1 text-sm text-slate-500">Nominee: {member.nomineeName || 'Not Added'}</p>
                      <p className="mt-1 text-sm text-slate-500">Joined {formatDate(member.joiningDate)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Paid Months</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{paidMonths} / {totalMonths}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment History</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{paymentHistory.length} months</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                    >
                      {isExpanded ? (
                        <><ChevronUp size={16} className="mr-2" /> Hide History</>
                      ) : (
                        <><ChevronDown size={16} className="mr-2" /> View History</>
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Payment History</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {paymentHistory.map((item) => (
                        <div key={item.monthLabel} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">{item.monthLabel}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.status === 'Paid' ? (
                              <span className="text-emerald-700">🟢 Paid</span>
                            ) : (
                              item.status
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
