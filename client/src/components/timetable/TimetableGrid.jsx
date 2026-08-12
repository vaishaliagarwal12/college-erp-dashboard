import { MdPerson, MdLocationOn, MdSchedule } from "react-icons/md";
import { getSlotPalette } from "./courseColors";

const GRID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAY_START_MINUTES = 8 * 60;
const ROW_HEIGHT = 80; // px per hour row

function toMinutes(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function TimetableSlot({ entry, onView }) {
  const startMin = toMinutes(entry.startTime);
  const endMin = toMinutes(entry.endTime);
  if (startMin == null || endMin == null || endMin <= startMin) return null;

  // grid rows: 1 = header, rows 2..11 = hours 08:00..17:00
  const startRow = (startMin - DAY_START_MINUTES) / 60 + 2;
  const span = (endMin - startMin) / 60;
  const gridRow = `${startRow} / span ${span}`;

  const dayIndex = GRID_DAYS.indexOf(entry.day);
  if (dayIndex === -1) return null;
  const gridColumn = dayIndex + 2;

  const palette = getSlotPalette(entry.courseCode);

  return (
    <button
      type="button"
      onClick={() => onView(entry)}
      title={`${entry.courseCode}: ${entry.courseName}`}
      className={`relative z-10 mx-1 my-0.5 flex cursor-pointer flex-col gap-0.5 rounded-md border-l-[3px] p-1.5 text-left shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] ${palette.container}`}
      style={{ gridRow, gridColumn }}
    >
      <span
        className={`truncate font-label-md font-bold leading-tight ${palette.title}`}
      >
        {entry.courseCode}: {entry.courseName}
      </span>
      <span
        className={`mt-auto flex items-center gap-1 truncate text-[11px] leading-tight ${palette.sub}`}
      >
        <MdPerson className="shrink-0 text-[13px]" />
        {entry.facultyName || entry.faculty || "Unassigned"}
      </span>
      <span
        className={`flex items-center gap-1 truncate text-[11px] leading-tight ${palette.sub}`}
      >
        <MdLocationOn className="shrink-0 text-[13px]" />
        {entry.room}
      </span>
    </button>
  );
}

function TimetableGrid({ entries, onView }) {
  const cellBg =
    "bg-surface-container-lowest dark:bg-primary";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] overflow-x-auto dark:bg-primary dark:border-primary-container">
      <div className="min-w-[860px] p-4">
        <div
          className="grid rounded-lg border border-outline-variant overflow-hidden dark:border-primary-container"
          style={{
            gridTemplateColumns: "80px repeat(5, 1fr)",
            gridTemplateRows: `40px repeat(${HOURS.length}, ${ROW_HEIGHT}px)`,
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-center bg-surface-container-low dark:bg-primary-container">
            <MdSchedule className="text-[20px] text-on-surface-variant dark:text-on-primary-container" />
          </div>
          {GRID_DAYS.map((day) => (
            <div
              key={day}
              className="flex items-center justify-center bg-surface-container-low py-3 font-label-md uppercase tracking-wider text-on-surface dark:bg-primary-container dark:text-on-primary"
            >
              {day}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className={`flex items-start justify-center pt-2 font-data-mono text-data-mono text-on-surface-variant dark:text-on-primary-container ${cellBg}`}>
                {formatHour(hour)}
              </div>
              {GRID_DAYS.map((day) => (
                <div key={day} className={`border-t border-outline-variant/40 dark:border-primary-container ${cellBg}`} />
              ))}
            </div>
          ))}

          {/* Course slots (positioned over the day columns) */}
          {entries.map((entry) => (
            <TimetableSlot key={entry._id || entry.id} entry={entry} onView={onView} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimetableGrid;
