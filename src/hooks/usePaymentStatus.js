import { useState } from 'react';
import toast from 'react-hot-toast';

export function usePaymentStatus(initialPayments) {
  const [payments, setPayments] = useState(initialPayments);

  function togglePayment(paymentId) {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              status: payment.status === 'Paid' ? 'Pending' : 'Paid',
              paymentDate: payment.status === 'Paid' ? '' : new Date().toISOString().slice(0, 10),
            }
          : payment,
      ),
    );
    toast.success('Payment status updated');
  }

  return { payments, togglePayment };
}
