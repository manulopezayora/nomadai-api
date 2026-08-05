import { NotFoundException } from './not-found.exception';

export class TripNotFoundException extends NotFoundException {
  constructor(tripId: string) {
    super('Trip', tripId);
  }
}
