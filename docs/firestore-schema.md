# Firestore Schema

Suggested collections for the production version.

## users

- displayName
- email
- role: owner, admin, viewer
- status
- createdAt

## groups

- name
- monthlyAmount
- totalMembers
- totalChitValue
- startDate
- endDate
- collectionDay
- winnerDay
- durationMonths
- status
- notes
- createdAt
- updatedAt

## members

- photoUrl
- name
- phone
- address
- aadhaar
- nomineeName
- joiningDate
- groupIds
- pendingAmount
- notes
- status
- createdAt
- updatedAt

## payments

- memberId
- groupId
- month
- amount
- paymentDate
- paymentMode
- collectedBy
- remarks
- status
- createdAt
- updatedAt

## winners

- groupId
- month
- winnerName
- winningAmount
- winnerDate
- paymentStatus
- remarks
- createdAt
- updatedAt

## events

- title
- date
- type
- groupId
- memberId
- notes
- createdAt
