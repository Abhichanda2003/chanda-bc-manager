import { Download } from 'lucide-react';
import Button from '../components/Button.jsx';
import MetricCard from '../components/MetricCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { getReports } from '../services/bcRepository.js';
import { formatCurrency } from '../utils/formatters.js';
import { PieChart } from 'lucide-react';

export default function ReportsPage() {
  const reports = getReports();

  return (
    <>
      <PageHeader
        title="Reports"
        description="Daily, monthly, yearly, pending, group, collection, and profit summaries."
        action={
          <Button type="button" variant="secondary">
            <Download size={18} /> Export
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <MetricCard
            key={report.label}
            icon={PieChart}
            label={report.label}
            value={report.type === 'currency' ? formatCurrency(report.value) : report.value}
            tone={report.label.includes('Pending') ? 'clay' : 'leaf'}
          />
        ))}
      </div>
    </>
  );
}
