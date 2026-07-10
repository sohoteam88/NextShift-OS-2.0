# Business State Read Reduction Report

Status: P2-005 bounded cutover implementation
Authority: Business State

## Scope

Only these read-only GET routes were cut over:

- `GET /api/v1/funnel/funnels/[id]/health`
- `GET /api/v1/social-setup`
- `GET /api/v1/traffic-engine`

## Before

| Route | Direct readiness source |
| --- | --- |
| `GET /api/v1/funnel/funnels/[id]/health` | `funnelHealthService.calculate(funnelId, user)` |
| `GET /api/v1/social-setup` | `socialSetupService.getReadiness(user.id)` |
| `GET /api/v1/traffic-engine` | `trafficEngineService.get(user.id)` |

Direct source reads before: 3 route-level readiness reads.

## After

| Route | Business State read | View model adapter |
| --- | --- | --- |
| `GET /api/v1/funnel/funnels/[id]/health` | `businessStateService.getBusinessState(user.id)` | `toFunnelHealthViewModel` |
| `GET /api/v1/social-setup` | `businessStateService.getBusinessState(user.id)` | `toSocialReadinessViewModel` |
| `GET /api/v1/traffic-engine` | `businessStateService.getBusinessState(user.id)` | `toTrafficReadinessViewModel` |

Direct route-level readiness source reads after: 0.
Business State route-level reads after: 3.

## Preserved Boundaries

- Dashboard consumers were not modified.
- Journey consumers were not modified.
- Activation consumers were not modified.
- AI / CEO Advisor consumers were not modified.
- Growth Loop consumers were not modified.
- Generation routes were not modified.
- Write paths were not modified.
- Source services were not retired.

## Compatibility Notes

- Funnel health keeps the `data.overall`, `data.breakdown`, `data.status`, and `data.next_best_action` response shape.
- Social setup GET keeps `data` and `readiness` top-level response keys. PUT remains on the previous write path.
- Traffic engine GET keeps the `data` top-level response key and returns `null` when Business State reports `traffic_package_missing`.
