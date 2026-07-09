import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { addMember, updateMember } from '../services/bcDataService.js';
import Button from './Button.jsx';
import FormField from './FormField.jsx';

const defaultValues = {
  name: '',
  phone: '',
  address: '',
  nomineeName: '',
};

export default function MemberFormModal({ open, onClose, groupId, onMemberAdded, member }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  useEffect(() => {
    if (open) {
      if (member) {
        reset({
          name: member.name || '',
          phone: member.phone || '',
          address: member.address || '',
          nomineeName: member.nomineeName || '',
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, reset]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const onSubmit = async (values) => {
    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      nomineeName: values.nomineeName?.trim(),
    };

    if (member && member.id) {
      const result = await updateMember(member.id, payload);
      if (result.saved) {
        onMemberAdded?.(result);
        return;
      }
      alert(result.reason || 'Unable to update member');
      return;
    }

    const result = await addMember(groupId, payload);
    if (result.saved) {
      onMemberAdded?.(result);
      return;
    }

    alert(result.reason || 'Unable to save member');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add Member</h2>
            <p className="mt-1 text-sm text-slate-500">Enter member details for this BC.</p>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Member Name" error={errors.name}>
              <input
                type="text"
                {...register('name', { required: 'Member name is required' })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                placeholder="Full name"
              />
            </FormField>

            <FormField label="Phone Number" error={errors.phone}>
              <input
                type="tel"
                {...register('phone', { required: 'Phone number is required' })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                placeholder="Mobile number"
              />
            </FormField>

            <FormField label="Village / Address" error={errors.address}>
              <input
                type="text"
                {...register('address', { required: 'Address is required' })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                placeholder="Village or address"
              />
            </FormField>

            <FormField label="Nominee (optional)" error={errors.nomineeName}>
              <input
                type="text"
                {...register('nomineeName')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                placeholder="Nominee name"
              />
            </FormField>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Saving...' : 'Save Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
