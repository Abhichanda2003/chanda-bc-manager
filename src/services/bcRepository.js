import dayjs from 'dayjs';
import { customEvents, groups, members, payments, winners } from '../data/seedData.js';

const withGroup = (record) => ({
  ...record,
  group: groups.find((group) => group.id === record.groupId),
});

const withMember = (record) => ({
  ...record,
  member: members.find((member) => member.id === record.memberId),
});

export function getGroups() {
  return groups;
}

export function getMembers() {
  return members.map((member) => ({
    ...member,
    groups: member.groupIds.map((id) => groups.find((group) => group.id === id)).filter(Boolean),
    paymentHistory: payments.filter((payment) => payment.memberId === member.id),
  }));
}

export function getPayments() {
  return payments.map((payment) => withMember(withGroup(payment)));
}

export function getWinners() {
  return winners.map((winner) => withGroup(winner));
}

export function getCalendarEvents() {
  const today = dayjs();
  const monthStart = today.startOf('month');
  const baseEvents = groups.flatMap((group) => [
    {
      id: `${group.id}-collection`,
      title: `${group.name} collection`,
      date: monthStart.date(group.collectionDay).format('YYYY-MM-DD'),
      type: 'Collection',
      groupId: group.id,
    },
    {
      id: `${group.id}-winner`,
      title: `${group.name} winner announcement`,
      date: monthStart.date(group.winnerDay).format('YYYY-MM-DD'),
      type: 'Winner',
      groupId: group.id,
    },
  ]);

  const pendingPaymentEvents = payments
    .filter((payment) => payment.status === 'Pending')
    .map((payment) => ({
      id: `${payment.id}-pending`,
      title: `${withMember(payment).member?.name || 'Member'} payment pending`,
      date: today.format('YYYY-MM-DD'),
      type: 'Pending Payment',
      groupId: payment.groupId,
    }));

  return [...baseEvents, ...pendingPaymentEvents, ...customEvents].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
}

export function getDashboardStats() {
  const today = dayjs().format('YYYY-MM-DD');
  const todayPayments = payments.filter(
    (payment) => payment.paymentDate === today && payment.status === 'Paid',
  );
  const pendingPayments = payments.filter((payment) => payment.status === 'Pending');
  const todayEvents = getCalendarEvents().filter((event) => event.date === today);

  return {
    totalGroups: groups.length,
    runningGroups: groups.filter((group) => group.status === 'Running').length,
    completedGroups: groups.filter((group) => group.status === 'Completed').length,
    todayCollection: todayPayments.reduce((sum, payment) => sum + payment.amount, 0),
    pendingPayments: pendingPayments.length,
    todayEvents,
    todayWinner: getWinners().find((winner) => winner.winnerDate === today),
    upcomingEvents: getBcEventDates(),
  };
}

export function getGroupPaymentOverview() {
  return groups.map((group) => {
    const groupMembers = members.filter((member) => member.groupIds.includes(group.id));

    return {
      ...group,
      collectionDate: dayjs().date(group.collectionDay).format('YYYY-MM-DD'),
      winnerDate: dayjs().date(group.winnerDay).format('YYYY-MM-DD'),
      members: groupMembers.map((member) => {
        const schedule = buildMonthlySchedule(group).map((month) => {
          const payment = payments.find(
            (item) => item.groupId === group.id && item.memberId === member.id && item.month === month.label,
          );

          return {
            id: payment?.id || `${group.id}-${member.id}-${month.label}`,
            month: month.label,
            amount: group.monthlyAmount,
            status: payment?.status || 'Unpaid',
            paymentDate: payment?.paymentDate || '',
          };
        });

        return {
          ...member,
          paidMonths: schedule.filter((month) => month.status === 'Paid').length,
          schedule,
        };
      }),
    };
  });
}

export function getBcEventDates() {
  return groups.map((group) => ({
    id: group.id,
    groupName: group.name,
    collectionDate: dayjs().date(group.collectionDay).format('YYYY-MM-DD'),
    winnerDate: dayjs().date(group.winnerDay).format('YYYY-MM-DD'),
  }));
}

export function getReports() {
  const paidPayments = payments.filter((payment) => payment.status === 'Paid');
  const totalCollected = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingTotal = payments
    .filter((payment) => payment.status === 'Pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return [
    { label: 'Daily Collection', value: totalCollected, type: 'currency' },
    { label: 'Monthly Collection', value: totalCollected, type: 'currency' },
    { label: 'Yearly Collection', value: totalCollected, type: 'currency' },
    { label: 'Pending Members', value: members.filter((member) => member.pendingAmount > 0).length },
    { label: 'Completed BC Groups', value: groups.filter((group) => group.status === 'Completed').length },
    { label: 'Running BC Groups', value: groups.filter((group) => group.status === 'Running').length },
    { label: 'Collection Summary', value: totalCollected, type: 'currency' },
    { label: 'Profit Summary', value: totalCollected - pendingTotal, type: 'currency' },
  ];
}

function buildMonthlySchedule(group) {
  return Array.from({ length: group.durationMonths }, (_, index) => {
    const date = dayjs(group.startDate).add(index, 'month');
    return {
      label: date.format('MMMM YYYY'),
      date: date.format('YYYY-MM-DD'),
    };
  });
}
