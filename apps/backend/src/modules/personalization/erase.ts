import PersonalizationModuleService from "./service"

// Delete derived recommendation data after revocation. Commerce records remain Medusa-owned.
export async function erasePersonalizationData(service: PersonalizationModuleService, customerId: string) {
  for (;;) {
    const events = await service.listRecommendationEvents({ customer_id: customerId }, { take: 100 })
    if (!events.length) break
    await service.deleteRecommendationEvents(events.map((event) => event.id))
  }
  const profiles = await service.listRecommendationProfiles({ customer_id: customerId })
  if (profiles.length) await service.deleteRecommendationProfiles(profiles.map((profile) => profile.id))
}
