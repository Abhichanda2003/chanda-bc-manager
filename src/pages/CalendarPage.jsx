import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import Card from '../components/Card.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { getCalendarEvents } from '../services/bcRepository.js';
import { formatDate } from '../utils/formatters.js';

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const events = getCalendarEvents();
  const selectedEvents = useMemo(
    () => events.filter((event) => dayjs(event.date).isSame(dayjs(date), 'day')),
    [date, events],
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Collection dates, winner announcements, pending payments, and upcoming events in one place."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={({ date: tileDate, view }) =>
            view === 'month' && events.some((event) => dayjs(event.date).isSame(dayjs(tileDate), 'day')) ? (
              <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-leaf" />
            ) : null
          }
        />
        <Card className="p-5">
          <h3 className="text-lg font-bold">{formatDate(dayjs(date).format('YYYY-MM-DD'))}</h3>
          <div className="mt-4 space-y-3">
            {selectedEvents.length ? (
              selectedEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-slate-500">{event.type}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No events for this date.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
