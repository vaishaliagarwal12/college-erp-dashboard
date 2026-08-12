import { MdPerson, MdLocationOn } from "react-icons/md";
import { formatTime } from "../../data/timetableData";
import { getSlotPalette } from "./courseColors";

function TimetableCell({ entry, onClick }) {
  const palette = getSlotPalette(entry.courseCode);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block h-full w-full rounded-lg border-l-[3px] p-2.5 text-left transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] ${palette.container}`}
    >
      <p className={`text-xs font-bold ${palette.title}`}>
        {entry.courseCode}
      </p>

      <p className={`mt-0.5 truncate text-[11px] leading-snug ${palette.sub}`}>
        {entry.courseName}
      </p>

      <p className={`mt-1 flex items-center gap-1 truncate text-[11px] ${palette.sub}`}>
        <MdPerson className="shrink-0 text-[12px]" />
        {entry.facultyName || entry.faculty || "Unassigned"}
      </p>

      <p className={`flex items-center gap-1 truncate text-[11px] ${palette.sub}`}>
        <MdLocationOn className="shrink-0 text-[12px]" />
        {entry.room} · Sec {entry.section}
      </p>

      <p className={`mt-1 text-[10px] font-medium ${palette.sub}`}>
        {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
      </p>
    </button>
  );
}

export default TimetableCell;
