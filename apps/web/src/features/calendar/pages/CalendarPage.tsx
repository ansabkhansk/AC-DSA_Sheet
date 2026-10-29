import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';

// FullCalendar v6 injects base styles; theme tokens are applied via `.dsa-calendar` CSS.
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { GeneratePlansDialog } from '../components/GeneratePlansDialog';
import { PlanDialog } from '../components/PlanDialog';
import { addDays, monthQueryRange, toDateKeyLocal } from '../dateUtils';
import { usePlans, type StudyPlan } from '../hooks';

type CalendarView = 'dayGridMonth' | 'timeGridWeek';

const statusClass: Record<string, string> = {
  planned: 'fc-event-planned',
  done: 'fc-event-done',
  missed: 'fc-event-missed',
};

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>('dayGridMonth');
  const [range, setRange] = useState(() => monthQueryRange(new Date()));
  const [generateOpen, setGenerateOpen] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    date: string;
    plan: StudyPlan | null;
  }>({ open: false, date: toDateKeyLocal(new Date()), plan: null });

  const plansQuery = usePlans(range.from, range.to);

  const events = useMemo(
    () =>
      (plansQuery.data ?? []).map((plan) => ({
        id: plan.id,
        title: `${plan.title} (${plan.status})`,
        start: plan.date,
        allDay: true,
        classNames: [statusClass[plan.status] ?? 'fc-event-planned'],
        extendedProps: { plan },
      })),
    [plansQuery.data],
  );

  function handleDatesSet(info: DatesSetArg) {
    // FullCalendar's end is exclusive.
    const from = toDateKeyLocal(info.start);
    const to = toDateKeyLocal(addDays(info.end, -1));
    setRange((current) => (current.from === from && current.to === to ? current : { from, to }));
  }

  function handleDateClick(arg: DateClickArg) {
    setDialog({ open: true, date: arg.dateStr, plan: null });
  }

  function handleEventClick(arg: EventClickArg) {
    const plan = arg.event.extendedProps.plan as StudyPlan | undefined;
    if (plan) {
      setDialog({ open: true, date: plan.date, plan });
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-text">Study calendar</h1>
          <p className="text-muted">
            Plan study sessions, schedule revisits, and watch your activity over time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={view === 'dayGridMonth' ? 'primary' : 'secondary'}
            onClick={() => setView('dayGridMonth')}
          >
            Month
          </Button>
          <Button
            type="button"
            variant={view === 'timeGridWeek' ? 'primary' : 'secondary'}
            onClick={() => setView('timeGridWeek')}
          >
            Week
          </Button>
          <Button type="button" variant="secondary" onClick={() => setGenerateOpen(true)}>
            Auto-generate
          </Button>
        </div>
      </header>

      <ActivityHeatmap />

      {plansQuery.isLoading ? <Spinner label="Loading plans…" /> : null}

      {plansQuery.isError ? (
        <div className="rounded-lg border border-border bg-surface p-6" role="alert">
          <p className="text-text">We could not load your study plans.</p>
          <Button
            className="mt-4"
            onClick={() => void plansQuery.refetch()}
            disabled={plansQuery.isFetching}
          >
            {plansQuery.isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      ) : (
        <div className="dsa-calendar overflow-hidden rounded-lg border border-border bg-surface p-2 sm:p-4">
          {!plansQuery.isLoading && (plansQuery.data?.length ?? 0) === 0 ? (
            <p className="mb-3 px-2 text-sm text-muted">
              No plans in this range yet. Click a day to create one, or auto-generate a schedule.
            </p>
          ) : null}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            key={view}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            height="auto"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
          />
        </div>
      )}

      {dialog.open ? (
        <PlanDialog
          key={`${dialog.date}-${dialog.plan?.id ?? 'new'}`}
          open={dialog.open}
          date={dialog.date}
          plan={dialog.plan}
          onClose={() => setDialog((current) => ({ ...current, open: false }))}
        />
      ) : null}

      <GeneratePlansDialog open={generateOpen} onClose={() => setGenerateOpen(false)} />
    </section>
  );
}
