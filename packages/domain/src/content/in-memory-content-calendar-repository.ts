import type { BusinessId } from "@nextshift/shared";
import { ContentCalendar } from "./calendar";
import type {
  ContentCalendarId,
  ContentCalendarSnapshot,
  ScheduledContentSnapshot,
} from "./calendar";
import type { ContentCalendarRepository } from "./content-calendar-repository";

export class InMemoryContentCalendarRepository
  implements ContentCalendarRepository
{
  private readonly calendars = new Map<
    ContentCalendarId,
    ContentCalendarSnapshot
  >();

  async save(calendar: ContentCalendar): Promise<void> {
    const snapshot = calendar.toSnapshot();
    this.calendars.set(snapshot.calendarId, cloneSnapshot(snapshot));
  }

  async findById(
    calendarId: ContentCalendarId
  ): Promise<ContentCalendar | null> {
    const snapshot = this.calendars.get(calendarId);
    return snapshot ? ContentCalendar.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentCalendar[]> {
    return [...this.calendars.values()]
      .filter((calendar) => calendar.businessId === businessId)
      .sort(compareCalendars)
      .map((calendar) => ContentCalendar.rehydrate(calendar));
  }

  async listEntries(
    calendarId: ContentCalendarId
  ): Promise<readonly ScheduledContentSnapshot[]> {
    return cloneEntries(this.calendars.get(calendarId)?.entries ?? []);
  }

  async exists(calendarId: ContentCalendarId): Promise<boolean> {
    return this.calendars.has(calendarId);
  }
}

function compareCalendars(
  left: ContentCalendarSnapshot,
  right: ContentCalendarSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: ContentCalendarSnapshot
): ContentCalendarSnapshot {
  return {
    ...snapshot,
    entries: cloneEntries(snapshot.entries),
  };
}

function cloneEntries(
  entries: readonly ScheduledContentSnapshot[]
): readonly ScheduledContentSnapshot[] {
  return Object.freeze(entries.map((entry) => ({ ...entry })));
}
