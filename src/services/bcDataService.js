import dayjs from 'dayjs';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase.js';
import {
  customEvents as seedEvents,
  groups as seedGroups,
  members as seedMembers,
  payments as seedPayments,
  winners as seedWinners,
} from '../data/seedData.js';

const seedWinnerChanges = [];

const collections = {
  groups: 'groups',
  members: 'members',
  payments: 'monthlyCollections',
  winners: 'winners',
  winnerChanges: 'winnerChanges',
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

export async function loadMonthlyCollection(groupId) {
  if (!isFirebaseConfigured || !db) {
    const data = await loadDashboardData();
    const group = (data.groupOverview || []).find((item) => item.id === groupId) || null;
    return {
      group,
      members: group?.members || [],
      schedule: group ? buildMonthlySchedule(group) : [],
    };
  }

  const groupDoc = await getDoc(doc(db, collections.groups, groupId));
  if (!groupDoc.exists()) {
    return { group: null, members: [], schedule: [] };
  }

  const group = { id: groupDoc.id, ...groupDoc.data() };
  const memberSnapshot = await getDocs(query(collection(db, collections.members), where('groupIds', 'array-contains', groupId)));
  const paymentSnapshot = await getDocs(query(collection(db, collections.payments), where('groupId', '==', groupId)));

  const payments = paymentSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const schedule = buildMonthlySchedule(group);

  const members = memberSnapshot.docs.map((item) => {
    const member = { id: item.id, ...item.data() };
    const memberPayments = payments.filter((payment) => payment.memberId === member.id);
    const scheduleItems = schedule.map((month) => {
      const payment = memberPayments.find((item) => item.month === month.label);
      return {
        id: payment?.id || `${group.id}-${member.id}-${month.label}`,
        memberId: member.id,
        groupId: group.id,
        month: month.label,
        amount: Number(payment?.amount || group.monthlyAmount || 0),
        status: payment?.status || 'Unpaid',
        paymentDate: payment?.paymentDate || '',
        paymentMode: payment?.paymentMode || '',
        collectedBy: payment?.collectedBy || '',
        remarks: payment?.remarks || '',
      };
    });

    return {
      ...member,
      paidMonths: scheduleItems.filter((item) => item.status === 'Paid').length,
      schedule: scheduleItems,
    };
  });

  return { group, members, schedule };
}

export async function markMemberPaid({ groupId, memberId, month, paymentId, amount }) {
  const paymentDocumentId = paymentId || `${groupId}-${memberId}-${month}`;
  return savePaymentStatus({
    id: paymentDocumentId,
    memberId,
    groupId,
    month,
    amount: Number(amount || 0),
    status: 'Paid',
    paymentDate: dayjs().format('YYYY-MM-DD'),
    paymentMode: 'UPI',
    collectedBy: 'Santoshi Chanda',
    remarks: '',
  });
}

export async function markMemberUnpaid({ groupId, memberId, month, paymentId, amount }) {
  const paymentDocumentId = paymentId || `${groupId}-${memberId}-${month}`;
  return savePaymentStatus({
    id: paymentDocumentId,
    memberId,
    groupId,
    month,
    amount: Number(amount || 0),
    status: 'Unpaid',
    paymentDate: '',
    paymentMode: '',
    collectedBy: '',
    remarks: '',
  });
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

export async function loadWinners() {
  if (!isFirebaseConfigured || !db) {
    return seedWinners.map((winner) => ({
      ...winner,
      group: seedGroups.find((group) => group.id === winner.groupId),
    }));
  }

  const [groups, winners] = await Promise.all([
    readCollection(collections.groups),
    readCollection(collections.winners),
  ]);

  return winners.map((winner) => ({
    ...winner,
    group: groups.find((group) => group.id === winner.groupId),
  }));
}

export async function loadGroupById(groupId) {
  if (!isFirebaseConfigured || !db) {
    return seedGroups.find((group) => group.id === groupId) || null;
  }

  const groupDoc = await getDoc(doc(db, collections.groups, groupId));
  return groupDoc.exists() ? { id: groupDoc.id, ...groupDoc.data() } : null;
}

export async function loadGroupMembers(groupId) {
  if (!isFirebaseConfigured || !db) {
    return seedMembers.filter((member) => member.groupIds?.includes(groupId));
  }

  const memberSnapshot = await getDocs(query(collection(db, collections.members), where('groupIds', 'array-contains', groupId)));
  return memberSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function getWinnerAmountForMonth(group, monthNumber) {
  const schedule = Array.isArray(group.winnerAmountSchedule) ? group.winnerAmountSchedule : [];
  const entry = schedule.find((item) => Number(item.month) === Number(monthNumber));
  return Number(entry?.amount || group.monthlyAmount || 0);
}

export async function loadGroupWinners(groupId) {
  const group = await loadGroupById(groupId);
  if (!group) {
    return { group: null, winners: [] };
  }

  const winners = !isFirebaseConfigured || !db ? seedWinners : await readCollection(collections.winners);
  const groupWinners = winners
    .filter((winner) => winner.groupId === groupId && winner.winnerName)
    .sort((a, b) => Number(a.month || 0) - Number(b.month || 0))
    .map((winner) => ({
      ...winner,
      monthNumber: Number(winner.month) || 0,
      monthLabel: buildMonthlySchedule(group)[Number(winner.month) - 1]?.label || '',
      winningAmount: Number(winner.winningAmount || getWinnerAmountForMonth(group, winner.month)),
    }));

  return { group, winners: groupWinners };
}

export async function getCurrentBCMonth(group) {
  const startDate = dayjs(group.startDate);
  const now = dayjs();
  const monthsElapsed = now.diff(startDate, 'month');
  const currentMonthIndex = Math.min(Math.max(monthsElapsed, 0), group.durationMonths - 1);
  const schedule = buildMonthlySchedule(group);
  return {
    monthIndex: currentMonthIndex,
    monthNumber: currentMonthIndex + 1,
    monthLabel: schedule[currentMonthIndex]?.label || '',
    totalMonths: group.durationMonths,
  };
}

export async function loadCurrentMonthWinner(groupId) {
  const group = await loadGroupById(groupId);
  if (!group) {
    return { group: null, currentMonth: null, winner: null };
  }

  const currentMonth = await getCurrentBCMonth(group);
  const winners = !isFirebaseConfigured || !db ? seedWinners : await readCollection(collections.winners);
  const currentWinner = winners.find(
    (w) => w.groupId === groupId && w.month === currentMonth.monthLabel,
  ) || null;

  return {
    group,
    currentMonth,
    winner: currentWinner ? { ...currentWinner, winningAmount: group.monthlyAmount || 0 } : null,
  };
}

export async function loadUndefeatedMembers(groupId) {
  const group = await loadGroupById(groupId);
  if (!group) {
    return [];
  }

  const groupMembers = await loadGroupMembers(groupId);
  const winners = !isFirebaseConfigured || !db ? seedWinners : await readCollection(collections.winners);
  const defeatedIds = new Set(
    winners
      .filter((w) => w.groupId === groupId && w.memberId)
      .map((w) => w.memberId),
  );

  return groupMembers.filter((member) => !defeatedIds.has(member.id));
}

export async function loadWinnerHistory() {
  const groups = !isFirebaseConfigured || !db ? seedGroups : await readCollection(collections.groups);
  const winners = !isFirebaseConfigured || !db ? seedWinners : await readCollection(collections.winners);

  return groups.map((group) => {
    const groupWinners = winners.filter((winner) => winner.groupId === group.id);
    const schedule = buildMonthlySchedule(group);

    return {
      ...group,
      monthlyHistory: schedule.map((month, index) => {
        const winner = groupWinners.find((item) => Number(item.month) === index + 1) || null;
        return {
          monthNumber: index + 1,
          monthLabel: month.label,
          monthDate: month.date,
          winner: winner
            ? {
                ...winner,
                winningAmount: getWinnerAmountForMonth(group, index + 1),
              }
            : null,
          status: winner ? 'Winner Selected' : 'Not Selected',
        };
      }),
    };
  });
}

export async function loadEligibleWinnerMembers(groupId, monthNumber, currentWinnerId, currentWinnerName) {
  const group = await loadGroupById(groupId);
  const groupMembers = await loadGroupMembers(groupId);
  const winners = !isFirebaseConfigured || !db ? seedWinners : await readCollection(collections.winners);

  const selectedMonth = Number(monthNumber);
  const ineligibleIds = new Set();

  winners
    .filter((item) => item.groupId === groupId)
    .forEach((winner) => {
      const winnerMonth = Number(winner.month);
      if (winnerMonth && winnerMonth < selectedMonth) {
        ineligibleIds.add(winner.memberId);
      }
    });

  if (currentWinnerId) {
    ineligibleIds.add(currentWinnerId);
  }

  return groupMembers.filter((member) => !ineligibleIds.has(member.id));
}

export async function saveWinnerForMonth({
  groupId,
  month,
  memberId,
  memberName,
  winningAmount,
  currentWinnerId,
  currentWinnerName,
  reason,
}) {
  const numericMonth = Number(month);
  let resolvedAmount = Number(winningAmount || 0);
  if (!resolvedAmount) {
    const group = await loadGroupById(groupId);
    resolvedAmount = group ? getWinnerAmountForMonth(group, numericMonth) : 0;
  }

  if (currentWinnerId) {
    return replaceWinner({
      winnerId: currentWinnerId,
      groupId,
      month: numericMonth,
      previousWinnerId: currentWinnerId,
      previousWinnerName: currentWinnerName,
      newWinnerId: memberId,
      newWinnerName: memberName,
      winningAmount: resolvedAmount,
      reason: reason || 'Wrong winner selected',
    });
  }

  return saveWinnerEntry({
    groupId,
    memberId,
    winnerId: memberId,
    winnerName: memberName,
    month: numericMonth,
    winningAmount: resolvedAmount,
    winnerDate: dayjs().format('YYYY-MM-DD'),
    paymentStatus: 'Pending',
    remarks: 'Winner selected',
  });
}

export async function saveWinnerEntry(winner) {
  const sanitizedWinner = {
    groupId: winner.groupId,
    memberId: winner.memberId || '',
    winnerId: winner.winnerId || winner.memberId || '',
    winnerName: winner.winnerName,
    month: Number(winner.month),
    winningAmount: Number(winner.winningAmount || 0),
    winnerDate: winner.winnerDate,
    paymentStatus: winner.paymentStatus || 'Pending',
    remarks: winner.remarks || '',
    changed: Boolean(winner.changed),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!isFirebaseConfigured || !db) {
    const id = `local-winner-${Date.now()}`;
    seedWinners.push({ id, ...sanitizedWinner });
    return { saved: true, id };
  }

  const docRef = await addDoc(collection(db, collections.winners), sanitizedWinner);
  return { saved: true, id: docRef.id };
}

export async function deleteWinnerEntry(winnerId) {
  if (!isFirebaseConfigured || !db) {
    const index = seedWinners.findIndex((winner) => winner.id === winnerId);
    if (index === -1) {
      return { deleted: false, reason: 'Winner not found' };
    }
    seedWinners.splice(index, 1);
    return { deleted: true };
  }

  await deleteDoc(doc(db, collections.winners, winnerId));
  return { deleted: true };
}

export async function saveWinnerChangeHistory(change) {
  const historyRecord = {
    groupId: change.groupId,
    previousWinnerId: change.previousWinnerId || '',
    previousWinnerName: change.previousWinnerName || '',
    newWinnerId: change.newWinnerId || '',
    newWinnerName: change.newWinnerName || '',
    month: change.month,
    changedDate: dayjs().format('YYYY-MM-DD'),
    reason: change.reason || 'Wrong winner selected',
    createdAt: serverTimestamp(),
  };

  if (!isFirebaseConfigured || !db) {
    seedWinnerChanges.push(historyRecord);
    return { saved: true };
  }

  await addDoc(collection(db, collections.winnerChanges), historyRecord);
  return { saved: true };
}

export async function replaceWinner({ winnerId, groupId, month, previousWinnerId, previousWinnerName, newWinnerId, newWinnerName, winningAmount, reason }) {
  const deleteResult = await deleteWinnerEntry(winnerId);
  if (!deleteResult.deleted) {
    return { saved: false, reason: 'Unable to remove current winner' };
  }

  const newWinner = {
    groupId,
    memberId: newWinnerId,
    winnerId: newWinnerId,
    winnerName: newWinnerName,
    month: Number(month),
    winningAmount: Number(winningAmount || 0),
    winnerDate: dayjs().format('YYYY-MM-DD'),
    paymentStatus: 'Pending',
    remarks: 'Changed winner',
    changed: true,
  };

  const saveResult = await saveWinnerEntry(newWinner);
  if (!saveResult.saved) {
    return { saved: false, reason: 'Unable to save new winner' };
  }

  await saveWinnerChangeHistory({
    groupId,
    previousWinnerId,
    previousWinnerName,
    newWinnerId,
    newWinnerName,
    month,
    reason: reason || 'Wrong winner selected',
  });

  return { saved: true, id: saveResult.id };
}

export async function addGroup(group) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  const sanitizedGroup = {
    name: group.name,
    monthlyAmount: Number(group.monthlyAmount || 0),
    totalMembers: Number(group.totalMembers || 0),
    durationMonths: Number(group.durationMonths || 0),
    startDate: group.startDate,
    collectionDay: Number(group.collectionDay || 1),
    winnerDay: Number(group.winnerDay || 1),
    status: group.status || 'Running',
    winnerAmountSchedule: Array.isArray(group.winnerAmountSchedule)
      ? group.winnerAmountSchedule.map((entry) => ({ month: Number(entry.month), amount: Number(entry.amount) }))
      : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const documentRef = await addDoc(collection(db, collections.groups), sanitizedGroup);
  return { saved: true, id: documentRef.id };
}

export async function updateGroup(groupId, updates) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  const sanitizedUpdates = {
    ...updates,
    durationMonths: updates.durationMonths !== undefined ? Number(updates.durationMonths) : undefined,
    monthlyAmount: updates.monthlyAmount !== undefined ? Number(updates.monthlyAmount) : undefined,
    totalMembers: updates.totalMembers !== undefined ? Number(updates.totalMembers) : undefined,
    collectionDay: updates.collectionDay !== undefined ? Number(updates.collectionDay) : undefined,
    winnerDay: updates.winnerDay !== undefined ? Number(updates.winnerDay) : undefined,
    winnerAmountSchedule: updates.winnerAmountSchedule
      ? updates.winnerAmountSchedule.map((entry) => ({ month: Number(entry.month), amount: Number(entry.amount) }))
      : undefined,
    updatedAt: serverTimestamp(),
  };

  const merged = Object.keys(sanitizedUpdates).reduce((acc, key) => {
    if (sanitizedUpdates[key] !== undefined) {
      acc[key] = sanitizedUpdates[key];
    }
    return acc;
  }, {});

  await setDoc(doc(db, collections.groups, groupId), merged, { merge: true });
  return { saved: true };
}

export async function addMember(groupId, member) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  const sanitized = {
    name: member.name,
    phone: member.phone,
    address: member.address,
    nomineeName: member.nomineeName || '',
    groupIds: [groupId],
    joiningDate: dayjs().format('YYYY-MM-DD'),
    pendingAmount: 0,
    status: member.status || 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, collections.members), sanitized);
  return { saved: true, id: docRef.id };
}

export async function updateMember(memberId, updates) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  await setDoc(
    doc(db, collections.members, memberId),
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { saved: true };
}

export async function deleteMember(memberId) {
  if (!isFirebaseConfigured || !db) {
    return { deleted: false, reason: 'Firebase is not configured' };
  }

  await deleteDoc(doc(db, collections.members, memberId));
  return { deleted: true };
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
      index,
      label: date.format('MMMM YYYY'),
      date: date.format('YYYY-MM-DD'),
    };
  });
}

export async function renameGroup(groupId, newName) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  await setDoc(
    doc(db, collections.groups, groupId),
    {
      name: newName,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { saved: true };
}
export async function deleteGroup(groupId) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  await deleteDoc(doc(db, collections.groups, groupId));
  return { saved: true };
}

export async function updateGroupOrder(groupIds) {
  if (!isFirebaseConfigured || !db) {
    return { saved: false, reason: 'Firebase is not configured' };
  }

  // Save order as a single document in a dedicated collection
  const orderDocId = 'groupOrder';
  await setDoc(
    doc(db, 'groupOrders', orderDocId),
    {
      groupIds,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { saved: true };
}
