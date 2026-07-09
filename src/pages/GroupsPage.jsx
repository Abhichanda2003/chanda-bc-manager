import { useEffect, useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import GroupFormModal from '../components/GroupFormModal.jsx';
import ManageBCsModal from '../components/ManageBCsModal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { loadDashboardData } from '../services/bcDataService.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupToEdit, setSelectedGroupToEdit] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const navigate = useNavigate();

  async function fetchGroups() {
    const data = await loadDashboardData();
    const overview = data.groupOverview || [];
    setGroups(overview);
    setAllGroups(overview);
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  function handleGroupAdded() {
    fetchGroups();
    setIsModalOpen(false);
  }

  function handleEditGroup(group) {
    setSelectedGroupToEdit(group);
    setIsModalOpen(true);
  }

  function handleGroupsUpdated() {
    fetchGroups();
    setIsManageModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title="My BCs"
        description="Create and manage all your BCs."
        action={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsManageModalOpen(true)}
            >
              <Settings size={18} /> Manage
            </Button>
            <Button type="button" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> New BC
            </Button>
          </div>
        }
      />

      <GroupFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGroupToEdit(null);
        }}
        onGroupAdded={handleGroupAdded}
        initialGroup={selectedGroupToEdit}
        onGroupUpdated={() => {
          handleGroupsUpdated();
          setSelectedGroupToEdit(null);
        }}
      />

      <ManageBCsModal
        open={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        groups={allGroups}
        onGroupsUpdated={handleGroupsUpdated}
        onEditGroup={handleEditGroup}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const membersAdded = (group.members || []).length;

          return (
            <Card
              key={group.id}
              className="cursor-pointer rounded-2xl p-6 transition hover:shadow-lg"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div className="flex h-full flex-col justify-between">
                {/* BC Name */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {group.name}
                  </h2>

                  <p className="mt-2 text-base font-medium text-slate-600">
                    {formatCurrency(group.monthlyAmount)} / Month
                  </p>
                </div>

                {/* Details */}
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Members Added</span>
                    <span className="font-semibold">
                      {membersAdded} of {group.totalMembers}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-semibold">
                      {group.durationMonths} Months
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Started</span>
                    <span className="font-semibold">
                      {formatDate(group.startDate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status</span>

                    <Badge>
                      🟢 {group.status}
                    </Badge>
                  </div>
                </div>

                {/* Button */}
                <Button
                  type="button"
                  className="mt-6 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/groups/${group.id}`);
                  }}
                >
                  Open BC
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}