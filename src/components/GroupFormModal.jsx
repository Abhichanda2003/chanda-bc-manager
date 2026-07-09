import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { addGroup, loadGroupWinners, updateGroup } from '../services/bcDataService.js';
import Button from './Button.jsx';
import FormField from './FormField.jsx';

const defaultValues = {
  name: '',
  monthlyAmount: '',
  totalMembers: '',
  durationMonths: '',
  startDate: '',
  collectionDay: '1',
  winnerDay: '1',
  status: 'Running',
};

export default function GroupFormModal({ open, onClose, onGroupAdded, initialGroup, onGroupUpdated }) {
  const [submitError, setSubmitError] = useState('');
  const [step, setStep] = useState(1);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [lockedMonths, setLockedMonths] = useState(0);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  const isEditing = Boolean(initialGroup?.id);

  useEffect(() => {
    if (!open) return;

    if (initialGroup) {
      reset({
        name: initialGroup.name || '',
        monthlyAmount: initialGroup.monthlyAmount || '',
        totalMembers: initialGroup.totalMembers || '',
        durationMonths: initialGroup.durationMonths || '',
        startDate: initialGroup.startDate || '',
        collectionDay: initialGroup.collectionDay || '1',
        winnerDay: initialGroup.winnerDay || '1',
        status: initialGroup.status || 'Running',
      });
      const schedule = Array.isArray(initialGroup.winnerAmountSchedule)
        ? initialGroup.winnerAmountSchedule.map((entry) => ({ month: Number(entry.month), amount: String(entry.amount || '') }))
        : [];
      setScheduleEntries(schedule);
      setStep(1);
      setSubmitError('');
      setLockedMonths(0);

      if (initialGroup.id) {
        loadGroupWinners(initialGroup.id).then((data) => {
          setLockedMonths((data.winners || []).length);
        }).catch(() => setLockedMonths(0));
      }
      return;
    }

    reset(defaultValues);
    setScheduleEntries([]);
    setStep(1);
    setSubmitError('');
    setLockedMonths(0);
  }, [open, initialGroup, reset]);

  const durationMonths = Number(watch('durationMonths') || 0);

  const completedScheduleCount = useMemo(
    () => scheduleEntries.filter((entry) => entry.amount.trim() !== '').length,
    [scheduleEntries],
  );

  const showStepTwo = step === 2;
  const title = isEditing ? 'Edit BC Group' : 'Add New BC Group';
  const secondaryTitle = isEditing ? 'Update Winner Amount Schedule' : 'Winner Amount Schedule';

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const buildScheduleEntries = (count) => {
    const existing = [...scheduleEntries];
    return Array.from({ length: count }, (_, index) => {
      const month = index + 1;
      const existingEntry = existing.find((entry) => entry.month === month);
      return {
        month,
        amount: existingEntry ? String(existingEntry.amount || '') : '',
      };
    });
  };

  const handleDetailsNext = async (values) => {
    setSubmitError('');
    const duration = Number(values.durationMonths);

    if (duration < 1) {
      setSubmitError('Duration must be at least 1 month.');
      return;
    }

    if (lockedMonths > 0 && duration < lockedMonths) {
      setSubmitError(`Duration must be at least ${lockedMonths} months because ${lockedMonths} winners are already selected.`);
      return;
    }

    setScheduleEntries(buildScheduleEntries(duration));
    setStep(2);
  };

  const handleScheduleAmountChange = (month, value) => {
    setScheduleEntries((current) =>
      current.map((entry) => (entry.month === month ? { ...entry, amount: value } : entry)),
    );
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSaveGroup = async () => {
    setSubmitError('');
    const allFilled = scheduleEntries.every((entry) => entry.amount.trim() !== '');
    if (!allFilled) {
      setSubmitError('Please enter amounts for every month.');
      return;
    }

    const values = getValues();
    const payload = {
      name: values.name.trim(),
      monthlyAmount: Number(values.monthlyAmount),
      totalMembers: Number(values.totalMembers),
      durationMonths: Number(values.durationMonths),
      startDate: values.startDate,
      collectionDay: Number(values.collectionDay),
      winnerDay: Number(values.winnerDay),
      status: values.status || 'Running',
      winnerAmountSchedule: scheduleEntries.map((entry) => ({ month: entry.month, amount: Number(entry.amount) })),
    };

    setIsSubmittingSchedule(true);

    try {
      if (isEditing && initialGroup?.id) {
        const result = await updateGroup(initialGroup.id, payload);
        if (result.saved) {
          onGroupUpdated?.(initialGroup);
          onClose();
          return;
        }
        setSubmitError(result.reason || 'Unable to update BC.');
      } else {
        const result = await addGroup(payload);
        if (result.saved) {
          onGroupAdded?.(result);
          return;
        }
        setSubmitError(result.reason || 'Unable to save BC.');
      }
    } catch (err) {
      setSubmitError('Unable to save BC. Please try again.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-form-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="group-form-modal-title" className="text-lg font-semibold text-slate-900">
              {showStepTwo ? secondaryTitle : title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {showStepTwo
                ? 'Enter the winner amount for every month in your BC schedule.'
                : 'Enter the BC details. Tap Next to continue to the winner amount schedule.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="sr-only">Close modal</span>
            ×
          </button>
        </div>

        {!showStepTwo ? (
          <form onSubmit={handleSubmit(handleDetailsNext)} className="space-y-5 px-6 py-6">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="BC Name" error={errors.name}>
                <input
                  type="text"
                  {...register('name', { required: 'BC Name is required' })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                  placeholder="Enter group name"
                />
              </FormField>

              <FormField label="Monthly Amount" error={errors.monthlyAmount}>
                <input
                  type="number"
                  {...register('monthlyAmount', {
                    required: 'Monthly amount is required',
                    min: { value: 1, message: 'Monthly amount must be at least 1' },
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                  placeholder="0"
                  min="1"
                />
              </FormField>

              <FormField label="Total Members" error={errors.totalMembers}>
                <input
                  type="number"
                  {...register('totalMembers', {
                    required: 'Total members is required',
                    min: { value: 1, message: 'Total members must be at least 1' },
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                  placeholder="0"
                  min="1"
                />
              </FormField>

              <FormField label="Duration (Months)" error={errors.durationMonths}>
                <input
                  type="number"
                  {...register('durationMonths', {
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1 month' },
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                  placeholder="0"
                  min="1"
                />
              </FormField>

              <FormField label="Start Date" error={errors.startDate}>
                <input
                  type="date"
                  {...register('startDate', { required: 'Start date is required' })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </FormField>

              <FormField label="Collection Day" error={errors.collectionDay}>
                <input
                  type="number"
                  {...register('collectionDay', {
                    required: 'Collection day is required',
                    min: { value: 1, message: 'Collection day must be 1 or greater' },
                    max: { value: 31, message: 'Collection day must be 31 or less' },
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                  placeholder="1"
                  min="1"
                  max="31"
                />
              </FormField>

              <FormField label="Winner Day" error={errors.winnerDay}>
                <input
                  type="number"
                  {...register('winnerDay', {
                    required: 'Winner day is required',
                    min: { value: 1, message: 'Winner day must be 1 or greater' },
                    max: { value: 31, message: 'Winner day must be 31 or less' },
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                  placeholder="1"
                  min="1"
                  max="31"
                />
              </FormField>
            </div>

            {submitError && <p className="text-sm font-medium text-clay">{submitError}</p>}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose} disabled={isSubmitting || isSubmittingSchedule}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isSubmittingSchedule} className="w-full sm:w-auto">
                Next
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 px-6 py-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">{completedScheduleCount} / {durationMonths} Amounts Entered</p>
            </div>

            <div className="grid gap-4">
              {scheduleEntries.map((entry) => {
                const locked = entry.month <= lockedMonths;
                return (
                  <div key={entry.month} className="grid gap-2 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Month {entry.month}</p>
                      {locked ? (
                        <p className="mt-1 text-xs text-slate-500">🔒 Locked until this month is complete.</p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">Enter the winner amount for this month.</p>
                      )}
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={entry.amount}
                      onChange={(event) => handleScheduleAmountChange(entry.month, event.target.value)}
                      disabled={locked}
                      className={`w-full rounded-3xl border px-4 py-3 text-sm shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 ${locked ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`}
                      placeholder="₹ 0"
                    />
                  </div>
                );
              })}
            </div>

            {submitError && <p className="text-sm font-medium text-clay">{submitError}</p>}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={handleBack} disabled={isSubmittingSchedule}>
                Back
              </Button>
              <Button type="button" onClick={handleSaveGroup} disabled={isSubmittingSchedule || completedScheduleCount !== durationMonths} className="w-full sm:w-auto">
                {isSubmittingSchedule ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create BC'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
