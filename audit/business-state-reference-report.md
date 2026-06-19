# Business State Reference Report

Status: P2-006 reference report
Authority: Business State

## Business State Service References

Approved runtime references:

| File | Reference |
| --- | --- |
| `src/app/api/v1/funnel/funnels/[id]/health/route.ts` | `businessStateService.getBusinessState(user.id)` |
| `src/app/api/v1/social-setup/route.ts` | `businessStateService.getBusinessState(user.id)` in GET |
| `src/app/api/v1/traffic-engine/route.ts` | `businessStateService.getBusinessState(user.id)` |

Internal Business State references:

| File | Reference |
| --- | --- |
| `src/modules/business-state/services/BusinessStateService.ts` | `businessStateService.getBusinessState(userId)` |
| `src/modules/business-state/adapters/BusinessStateAssembler.ts` | Assembles Business State from adapters |
| `src/modules/business-state/view-models/FunnelHealthViewModelAdapter.ts` | Maps Business State to funnel health route shape |
| `src/modules/business-state/view-models/SocialReadinessViewModelAdapter.ts` | Maps Business State to social readiness route shape |
| `src/modules/business-state/view-models/TrafficReadinessViewModelAdapter.ts` | Maps Business State to traffic route shape |

Test references:

| File | Reference |
| --- | --- |
| `src/__tests__/api/funnel-api.test.ts` | Mocks `businessStateService.getBusinessState` for funnel health route smoke test |

## Blocked Zone Reference Check

No Business State service references were found in:

- `src/modules/dashboard`
- `src/app/(auth)/journey`
- `src/modules/journey`
- `src/modules/activation`
- `src/modules/ai`
- `src/modules/business-intelligence`
- `src/app/api/v1/ai`
- `src/app/api/v1/traffic-engine/generate`
- `src/app/api/v1/social-setup/generate`
- `src/app/api/v1/funnel-os`
- `src/app/api/mission`

## Source Service References In Approved Route Files

| File | Direct old readiness source status |
| --- | --- |
| `src/app/api/v1/funnel/funnels/[id]/health/route.ts` | No `funnelHealthService.calculate` call remains. |
| `src/app/api/v1/social-setup/route.ts` | GET no longer calls `socialSetupService.getReadiness`; PUT still does, as required for write path compatibility. |
| `src/app/api/v1/traffic-engine/route.ts` | No `trafficEngineService.get` call remains. |

## ViewModel References

| Adapter | Consumer |
| --- | --- |
| `toFunnelHealthViewModel` | `GET /api/v1/funnel/funnels/[id]/health` |
| `toSocialReadinessViewModel` | `GET /api/v1/social-setup` |
| `toTrafficReadinessViewModel` | `GET /api/v1/traffic-engine` |

## Reference Conclusion

Business State references are bounded to the approved cutover routes, internal module implementation, and related tests. No blocked consumer has been wired to Business State.
