import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import GroupFormModal from '../components/GroupFormModal.jsx';
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

  const [isNewBCOpen, setIsNewBCOpen] = useState(false);

  function onSubmit() {
    toast.success('Settings saved locally');
  }

  async function handleNewBCAdded() {
    setIsNewBCOpen(false);
    toast.success('New BC created successfully');
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your business settings and BC administration."
      />

      

      {/* ------------------------------------- */}
      {/* ADMIN SETTINGS */}
      {/* ------------------------------------- */}

      <Card className="mt-5 max-w-4xl p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Admin Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage BC groups and monthly winner amounts.
          </p>
        </div>

        {/* ADMIN ACTIONS */}

        <div className="grid gap-4 md:grid-cols-2">

          {/* NEW BC */}

          <button
            type="button"
            onClick={() => setIsNewBCOpen(true)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Plus size={24} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  New BC
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Create a new BC group.
                </p>
              </div>

            </div>
          </button>

        </div>
      </Card>

      {/* ------------------------------------- */}
      {/* NEW BC MODAL */}
      {/* ------------------------------------- */}

      <GroupFormModal
        open={isNewBCOpen}
        onClose={() => setIsNewBCOpen(false)}
        onGroupAdded={handleNewBCAdded}
      />
    </>
  );
}