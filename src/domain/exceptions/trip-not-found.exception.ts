import { NotFoundException } from '@nestjs/common';

export class TripNotFoundException extends NotFoundException {
  constructor(tripId: string) {
    super(`Trip with ID "${tripId}" not found`);
  }
}
