package com.traveldiary.itinerary;

import com.traveldiary.exception.BadRequestException;

/** Single trip is hardcoded to 15 days (4.–18. 7. 2026, US trip). FE holds the rich itinerary. */
public final class ItineraryDays {

    public static final int COUNT = 15;

    private ItineraryDays() {}

    public static int validate(int dayNumber) {
        if (dayNumber < 1 || dayNumber > COUNT) {
            throw new BadRequestException("dayNumber musí být v rozsahu 1.." + COUNT);
        }
        return dayNumber;
    }
}
