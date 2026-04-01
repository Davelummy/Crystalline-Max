export interface PromotionCampaign {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
}

const PROMOTION_CAMPAIGNS: PromotionCampaign[] = [
  {
    id: 'spring-2026-loyalty',
    label: 'Spring Loyalty Offer',
    startsOn: '2026-03-15',
    endsOn: '2026-06-30',
  },
];

export function getActivePromotion(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  return PROMOTION_CAMPAIGNS.find((campaign) => campaign.startsOn <= today && today <= campaign.endsOn) || null;
}
