import { Plus } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SimpleTable from '../components/SimpleTable.jsx';
import { getWinners } from '../services/bcRepository.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function WinnersPage() {
  const winners = getWinners();

  return (
    <>
      <PageHeader
        title="Winner Management"
        description="Record each monthly winner, winning amount, winner date, payment status, and remarks."
        action={
          <Button type="button">
            <Plus size={18} /> Add Winner
          </Button>
        }
      />
      <SimpleTable
        rows={winners}
        getRowKey={(row) => row.id}
        columns={[
          { key: 'group', label: 'BC Group', render: (row) => row.group?.name },
          { key: 'month', label: 'Month' },
          { key: 'winnerName', label: 'Winner Name' },
          { key: 'winningAmount', label: 'Winning Amount', render: (row) => formatCurrency(row.winningAmount) },
          { key: 'winnerDate', label: 'Winner Date', render: (row) => formatDate(row.winnerDate) },
          { key: 'paymentStatus', label: 'Payment Status', render: (row) => <Badge>{row.paymentStatus}</Badge> },
          { key: 'remarks', label: 'Remarks' },
        ]}
      />
    </>
  );
}
