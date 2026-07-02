import { Plus } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SimpleTable from '../components/SimpleTable.jsx';
import { getMembers } from '../services/bcRepository.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function MembersPage() {
  const members = getMembers();

  return (
    <>
      <PageHeader
        title="Members"
        description="Track member contact details, joined groups, payment history, pending amount, nominee, and notes."
        action={
          <Button type="button">
            <Plus size={18} /> Add Member
          </Button>
        }
      />
      <SimpleTable
        rows={members}
        getRowKey={(row) => row.id}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'address', label: 'Address' },
          { key: 'joiningDate', label: 'Joining', render: (row) => formatDate(row.joiningDate) },
          { key: 'groups', label: 'BC Groups', render: (row) => row.groups.map((group) => group.name).join(', ') },
          { key: 'pendingAmount', label: 'Pending', render: (row) => formatCurrency(row.pendingAmount) },
          { key: 'nomineeName', label: 'Nominee' },
          { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
    </>
  );
}
