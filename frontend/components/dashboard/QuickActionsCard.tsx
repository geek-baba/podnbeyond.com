import Card from '../ui/Card';
import Button from '../ui/Button';
import Link from 'next/link';

export default function QuickActionsCard() {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/bookings/new">
            <Button variant="primary" className="w-full">
              New Booking
            </Button>
          </Link>
          <Link href="/admin/bookings/calendar">
            <Button variant="secondary" className="w-full">
              Calendar View
            </Button>
          </Link>
          <Link href="/admin/communication-hub">
            <Button variant="secondary" className="w-full">
              Messages
            </Button>
          </Link>
          <Link href="/admin/loyalty">
            <Button variant="secondary" className="w-full">
              Loyalty
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

