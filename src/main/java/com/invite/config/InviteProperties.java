package com.invite.config;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Everything shown on the invitation lives under the "invite" prefix in
 * application.yml. Change the YAML, restart, and the page updates.
 */
@ConfigurationProperties(prefix = "invite")
public record InviteProperties(
        @JsonIgnore String adminKey,     // never sent to the browser
        @JsonIgnore String uploadsDir,   // server-side folder for your own photos
        Couple groom,
        Couple bride,
        String tagline,
        String introLine,
        String quote,
        String weddingDateTime,   // ISO local date-time, e.g. 2027-02-14T10:30:00
        String timezoneOffset,    // e.g. +05:30
        String weddingDateLabel,  // text shown to guests
        String closingLine,
        List<Family> families,
        List<StoryChapter> story,
        List<Event> events,
        Venue venue,
        Music music,
        Creator creator,
        Rsvp rsvp
) {
    public record Couple(String name, String fullName, String photo, String about) {}

    public record Family(String title, String text) {}

    public record StoryChapter(String title, String date, String text, String photo) {}

    public record Event(String name, String time, String place, String note) {}

    public record Venue(String name, String address, String mapEmbedUrl, String mapLink) {}

    public record Music(String file, String credit) {}

    public record Creator(String name, String link) {}

    public record Rsvp(boolean enabled, String heading, String deadline) {}
}
