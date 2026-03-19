export interface ExecutiveKpiSnapshot {
  generatedAt: string;
  totals: {
    meetings: number;
    agendas: number;
    reports: number;
    minutes: number;
  };
  approvals: {
    directorPending: number;
    caoPending: number;
    totalPending: number;
  };
  publicationCoverage: {
    agendasPublishedPct: number;
    reportsPublishedPct: number;
    minutesPublishedPct: number;
  };
  cycleTimeHours: {
    agendaMedian: number;
    reportMedian: number;
    minutesMedian: number;
  };
  reportWorkflow: {
    approvedOrPublishedRate: number;
    rejectedRate: number;
  };
  digest: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    latestDigestEventAt?: string;
  };
  monthlyPublications: Array<{
    month: string;
    agendas: number;
    reports: number;
    minutes: number;
  }>;
}
