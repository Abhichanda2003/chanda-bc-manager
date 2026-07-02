import dayjs from 'dayjs';
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase.js';
import {
  customEvents as seedEvents,
  groups as seedGroups,
  members as seedMembers,
  payments as seedPayments,
  winners as seedWinners,
} from '../data/seedData.js';

const collections = {
  groups: 'groups',
  members: 'members',
  payments: 'payments',
  winners: 'winners',
  events: 'events',
};

export async function loadDashboardData() {
  if (!isFirebaseConfigured || !db) {
    return buildDashboardData({
      groups: seedGroups,
      members: seedMembers,
      payments: seedPayments,
      winners: seedWinners,
      events: seedEvents,
      source: 'Local preview data',
    });
  }

  const [groups, members, payments, winners, events] = await Promise.all([
    readCollection(collections.groups),
    readCollection(collections.members),
    readCollection(collections.payments),
    readCollection(collections.winners),
    readCollection(collections.events),
  ]);

  return buildDashboardData({
    groups: groups.length ? groups : seedGroups,
    members: members.length ? members : seedMembers,
    payments: payments.length ? payments : seedPayments,
    winners: winners.length ? winners : seedWinners,
    events: events.length ? events : seedEvents,
    source: 'Firebase Firestore',
  });
}

export async function savePaymentStatus(payment) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  await setDoc(
    doc(db, collections.payments, payment.id),
    {
      memberId: payment.memberId,
      groupId: payment.groupId,
      month: payment.month,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      status: payment.status,
      paymentMode: payment.status === 'Paid' ? payment.paymentMode || 'UPI' : '',
      collectedBy: payment.status === 'Paid' ? payment.collectedBy || 'Santoshi Chanda' : '',
      remarks: payment.remarks || '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { saved: true };
}

export async function saveGroupEventDates(groupId, dates) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  await setDoc(
    doc(db, collections.groups, groupId),
    {
      ...dates,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { saved: true };
}

async function readCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function buildDashboardData({ groups, members, payments, winners, events, source }) {
  const today = dayjs().format('YYYY-MM-DD');
  const dashboardStats = {
    totalGroups: groups.length,
    runningGroups: groups.filter((group) => group.status === 'Running').length,
    completedGroups: groups.filter((group) => group.status === 'Completed').length,
    todayCollection: payments
      .filter((payment) => payment.paymentDate === today && payment.status === 'Paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    pendingPayments: payments.filter((payment) => payment.status === 'Pending' || payment.status === 'Unpaid').length,
    upcomingEvents: buildBcEventDates(groups),
  };

  return {
    dashboardStats,
    groupOverview: buildGroupPaymentOverview(groups, members, payments),
    calendarEvents: buildCalendarEvents(groups, members, payments, events),
    source,
    isFirebaseConnected: source === 'Firebase Firestore',
  };
}

function buildGroupPaymentOverview(groups, members, payments) {
  return groups.map((group) => {
    const groupMembers = members.filter((member) => member.groupIds?.includes(group.id));

    return {
      ...group,
      collectionDate: group.collectionDate || dayjs().date(group.collectionDay || 1).format('YYYY-MM-DD'),
      winnerDate: group.winnerDate || dayjs().date(group.winnerDay || 1).format('YYYY-MM-DD'),
      members: groupMembers.map((member) => {
        const schedule = buildMonthlySchedule(group).map((month) => {
          const payment = payments.find(
            (item) => item.groupId === group.id && item.memberId === member.id && item.month === month.label,
          );
          const status = payment?.status === 'Pending' ? 'Unpaid' : payment?.status || 'Unpaid';

          return {
            id: payment?.id || `${group.id}-${member.id}-${month.label}`,
            memberId: member.id,
            groupId: group.id,
            month: month.label,
            amount: Number(payment?.amount || group.monthlyAmount || 0),
            status,
            paymentDate: payment?.paymentDate || '',
            paymentMode: payment?.paymentMode || '',
            collectedBy: payment?.collectedBy || '',
            remarks: payment?.remarks || '',
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

function buildBcEventDates(groups) {
  return groups.map((group) => ({
    id: group.id,
    groupName: group.name,
    collectionDate: group.collectionDate || dayjs().date(group.collectionDay || 1).format('YYYY-MM-DD'),
    winnerDate: group.winnerDate || dayjs().date(group.winnerDay || 1).format('YYYY-MM-DD'),
  }));
}

function buildCalendarEvents(groups, members, payments, events) {
  const today = dayjs();
  const baseEvents = groups.flatMap((group) => [
    {
      id: `${group.id}-collection`,
      title: `${group.name} collection`,
      date: group.collectionDate || today.date(group.collectionDay || 1).format('YYYY-MM-DD'),
      type: 'Collection',
      groupId: group.id,
    },
    {
      id: `${group.id}-winner`,
      title: `${group.name} winner announcement`,
      date: group.winnerDate || today.date(group.winnerDay || 1).format('YYYY-MM-DD'),
      type: 'Winner',
      groupId: group.id,
    },
  ]);

  const pendingPaymentEvents = payments
    .filter((payment) => payment.status === 'Pending' || payment.status === 'Unpaid')
    .map((payment) => ({
      id: `${payment.id}-pending`,
      title: `${members.find((member) => member.id === payment.memberId)?.name || 'Member'} payment pending`,
      date: today.format('YYYY-MM-DD'),
      type: 'Pending Payment',
      groupId: payment.groupId,
    }));

  return [...baseEvents, ...pendingPaymentEvents, ...events].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
}

function buildMonthlySchedule(group) {
  return Array.from({ length: Number(group.durationMonths || 0) }, (_, index) => {
    const date = dayjs(group.startDate).add(index, 'month');
    return {
      label: date.format('MMMM YYYY'),
      date: date.format('YYYY-MM-DD'),
    };
  });
}
