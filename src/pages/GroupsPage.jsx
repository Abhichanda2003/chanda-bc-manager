import { Plus } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SimpleTable from '../components/SimpleTable.jsx';
import { getGroups } from '../services/bcRepository.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function GroupsPage() {
  const groups = getGroups();

  return (
    <>
      <PageHeader
        title="BC Groups"
        description="Manage group amount, members, schedule, duration, status, and notes."
        action={
          <Button type="button">
            <Plus size={18} /> Add Group
          </Button>
        }
      />
      <SimpleTable
        rows={groups}
        getRowKey={(row) => row.id}
        columns={[
          { key: 'name', label: 'Group Name' },
          { key: 'monthlyAmount', label: 'Monthly', render: (row) => formatCurrency(row.monthlyAmount) },
          { key: 'totalMembers', label: 'Members' },
          { key: 'totalChitValue', label: 'Chit Value', render: (row) => formatCurrency(row.totalChitValue) },
          { key: 'startDate', label: 'Start', render: (row) => formatDate(row.startDate) },
          { key: 'endDate', label: 'End', render: (row) => formatDate(row.endDate) },
          { key: 'collectionDay', label: 'Collection', render: (row) => `${row.collectionDay} of every month` },
          { key: 'winnerDay', label: 'Winner', render: (row) => `${row.winnerDay} of every month` },
          { key: 'durationMonths', label: 'Duration', render: (row) => `${row.durationMonths} months` },
          { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
    </>
  );
}
