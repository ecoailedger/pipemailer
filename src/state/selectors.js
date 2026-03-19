function includesQuery(value, normalizedQuery) {
  return String(value ?? '')
    .toLowerCase()
    .includes(normalizedQuery);
}

export function buildReturnCaseLookupByEmailId(returnCases = []) {
  return Object.fromEntries(returnCases.map((item) => [item.emailId, item]));
}

export function matchesEmailSearch(email, normalizedQuery, returnCase) {
  if (!normalizedQuery) return true;

  const emailFields = [email.from, email.subject, email.snippet, email.to, email.cc];
  const returnFields = [
    returnCase?.rmaNumber,
    returnCase?.orderNumber,
    returnCase?.sku,
    returnCase?.inspectionOutcome,
    returnCase?.refundMethod,
    returnCase?.creditNoteId,
    returnCase?.goodsReceivedDate,
    returnCase?.refundPostedAt
  ];

  return [...emailFields, ...returnFields].some((field) => includesQuery(field, normalizedQuery));
}

export function matchesDealSearch(deal, normalizedQuery) {
  if (!normalizedQuery) return true;

  const returnCase = deal.returnCase ?? null;
  return [
    deal.title,
    deal.contact,
    deal.stage,
    returnCase?.rmaNumber,
    returnCase?.orderNumber,
    returnCase?.sku,
    returnCase?.inspectionOutcome,
    returnCase?.refundMethod,
    returnCase?.creditNoteId,
    returnCase?.goodsReceivedDate,
    returnCase?.refundPostedAt
  ].some((field) => includesQuery(field, normalizedQuery));
}
