import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { owners } from '../data/seedData.js';

export default function SettingsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      businessName: 'Chanda BC Manager',
      ownerOne: owners[0],
      ownerTwo: owners[1],
      defaultPaymentMode: 'UPI',
    },
  });

  function onSubmit() {
    toast.success('Settings saved locally');
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business profile, owner access, default payment mode, and future permission setup."
      />
      <Card className="max-w-3xl p-5">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Business Name" error={errors.businessName}>
            <input
              className="min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-leaf"
              {...register('businessName', { required: 'Business name is required' })}
            />
          </FormField>
          <FormField label="Default Payment Mode">
            <select
              className="min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-leaf"
              {...register('defaultPaymentMode')}
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank Transfer</option>
            </select>
          </FormField>
          <FormField label="Owner 1" error={errors.ownerOne}>
            <input
              className="min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-leaf"
              {...register('ownerOne', { required: 'Owner is required' })}
            />
          </FormField>
          <FormField label="Owner 2" error={errors.ownerTwo}>
            <input
              className="min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-leaf"
              {...register('ownerTwo', { required: 'Owner is required' })}
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit">
              <Save size={18} /> Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
