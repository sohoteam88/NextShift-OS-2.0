import type { BusinessId } from "@nextshift/shared";
import type {
  ContentCalendar,
  ContentCalendarId,
  ScheduledContentSnapshot,
} from "./calendar";

export interface ContentCalendarRepository {
  save(calendar: ContentCalendar): Promise<void>;
  findById(calendarId: ContentCalendarId): Promise<ContentCalendar | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentCalendar[]>;
  listEntries(
    calendarId: ContentCalendarId
  ): Promise<readonly ScheduledContentSnapshot[]>;
  exists(calendarId: ContentCalendarId): Promise<boolean>;
}
