import React, { useMemo, useState } from "react";

export type CalendarRange = { start: Date | null; end: Date | null };

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const inRange = (d: Date, start: Date | null, end: Date | null) => {
  if (!start || !end) return false;
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const s = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  ).getTime();
  const e = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  ).getTime();
  return x >= s && x <= e;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  start: Date | null;
  end: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

const CalendarMonthRange: React.FC<Props> = ({ start, end, onChange }) => {
  const today = new Date();
  const [view, setView] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const { cells, title } = useMemo(() => {
    const monthStart = startOfMonth(view);
    const monthEnd = endOfMonth(view);
    const firstWeekday = monthStart.getDay(); // 0..6
    const daysInMonth = monthEnd.getDate();

    const blanks = Array.from({ length: firstWeekday }, (_, i) => ({
      key: `b-${i}`,
      blank: true,
    }));
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(view.getFullYear(), view.getMonth(), i + 1);
      return { key: toKey(date), date, blank: false };
    });

    const cells = [...blanks, ...days];
    const title = monthStart.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
    return { cells, title };
  }, [view]);

  const clickDay = (d: Date) => {
    if (!start || (start && end)) {
      onChange(d, null);
    } else if (start && !end) {
      if (
        d.getTime() <
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        ).getTime()
      ) {
        onChange(d, start);
      } else {
        onChange(start, d);
      }
    }
  };

  return (
    <div
      className="calendar"
      role="group"
      aria-label="Calendar month range selector"
    >
      <div className="calendar-header">
        <div className="calendar-nav">
          <button
            className="calendar-btn"
            onClick={() =>
              setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
            }
            aria-label="Previous month"
          >
            ◀
          </button>
          <button
            className="calendar-btn"
            onClick={() => setView(new Date())}
            aria-label="Jump to current month"
          >
            ●
          </button>
          <button
            className="calendar-btn"
            onClick={() =>
              setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
            }
            aria-label="Next month"
          >
            ▶
          </button>
        </div>
        <h4>{title}</h4>
        <div style={{ width: 88 }} />
      </div>
      <div className="calendar-week">
        {weekdays.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((c) => {
          if ((c as any).blank)
            return <div key={c.key} className="calendar-cell blank" />;
          const date = (c as any).date as Date;
          const isToday = isSameDay(date, today);
          const isStart = !!start && isSameDay(date, start);
          const isEnd = !!end && isSameDay(date, end);
          const selected = isStart || isEnd;
          const inSelRange = inRange(date, start, end);
          const classNames = [
            "calendar-cell",
            isToday ? "today" : "",
            selected ? "selected" : "",
            inSelRange ? "in-range" : "",
            isStart ? "range-start" : "",
            isEnd ? "range-end" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={c.key}
              className={classNames}
              onClick={() => clickDay(date)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthRange;
