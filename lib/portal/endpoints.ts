export const PORTAL_ENDPOINTS = {
  dashboard: '/',
  feeStatement: '/finance/FeeStatement',
  feePayment: '/finance/feepayment',
  semesterRegistration: '/academic/semesterRegistration',
  unitRegistration: '/academic/unitRegistration',
  transcript: '/academic/transcript',
  generateTranscript: '/Academic/GenerateTranscript',
  examCard: '/academic/GenerateExamCard',
  timetable: '/academic/timetable',
  hostel: '/Hostel',
  hostelAvailableSpaces: '/Hostel/AvailableSpaces',
  hostelRoomCosts: '/Hostel/GetHostelRoomCosts',
  profileDetails: '/Home/UpdateContactDetails',
} as const;

export type PortalEndpoint = keyof typeof PORTAL_ENDPOINTS;
