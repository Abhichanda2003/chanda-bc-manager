import { Check, Plus } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SimpleTable from '../components/SimpleTable.jsx';
import { usePaymentStatus } from '../hooks/usePaymentStatus.js';
import { getPayments } from '../services/bcRepository.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function PaymentsPage() {
  const { payments, togglePayment } = usePaymentStatus(getPayments());

  return (
    <>
      <PageHeader
        title="Payments"
        description="Quickly mark payments as paid or pending and record amount, mode, collector, month, and remarks."
        action={
          <Button type="button">
            <Plus size={18} /> Add Payment
          </Button>
        }
      />
      <SimpleTable
        rows={payments}
        getRowKey={(row) => row.id}
        columns={[
          { key: 'member', label: 'Member', render: (row) => row.member?.name },
          { key: 'group', label: 'BC Group', render: (row) => row.group?.name },
          { key: 'month', label: 'Month' },
          { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
          { key: 'paymentDate', label: 'Date', render: (row) => formatDate(row.paymentDate) },
          { key: 'paymentMode', label: 'Mode', render: (row) => row.paymentMode || '-' },
          { key: 'collectedBy', label: 'Collected By', render: (row) => row.collectedBy || '-' },
          { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
          {
            key: 'action',
            label: 'Action',
            render: (row) => (
              <Button type="button" variant={row.status === 'Paid' ? 'secondary' : 'primary'} onClick={() => togglePayment(row.id)}>
                <Check size={16} /> {row.status === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
