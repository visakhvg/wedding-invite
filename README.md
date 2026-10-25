# Wedding invitation (Spring Boot)

A single-page wedding invitation served by a Java backend.
The page reads all of its text, photos and event details from `/api/invite`,
which is built from `src/main/resources/application.yml`.

## Run it

Requires Java 17 and Maven.

```bash
mvn spring-boot:run
# open http://localhost:8080
```

## Change the content

Open `src/main/resources/application.yml` and edit everything under `invite:`
(names, date, families, story chapters, events, venue, map, RSVP text).
Restart the app. No HTML or JavaScript changes are needed.

## Change the pictures

Option 1, simplest: copy your photos into `src/main/resources/static/assets/`
and point to them in `application.yml`, for example `photo: /assets/groom.jpg`.
Use JPG or WebP, around 1200 px wide, under 400 KB each.

Option 2, no rebuild: set `INVITE_UPLOADS_DIR=./uploads`, drop photos in that folder,
and use `photo: /uploads/groom.jpg`.

## Add music

Add a licensed `music.mp3` to `static/assets/`. The Sound button only appears when
the file exists. Don't commit songs you don't have rights to.

## Guest replies (RSVP)

Guests submit the form on the page. Replies are saved in a local H2 file database (`./data`).

To read them, set an admin key and open `/admin.html`:

```bash
INVITE_ADMIN_KEY=choose-a-long-secret mvn spring-boot:run
```

If `INVITE_ADMIN_KEY` is empty, the admin endpoint stays disabled.

## Deploy on Render

1. Push this folder to GitHub.
2. In Render, create a new Web Service from the repo and choose the Docker runtime.
3. Add the environment variable `INVITE_ADMIN_KEY`.

Render's free plan wipes local files on every deploy and restart, so RSVP replies stored
in H2 will be lost. For a real event, attach a Render Postgres database: replace the H2
dependency with `org.postgresql:postgresql` in `pom.xml` and set
`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`.

## Project layout

```
src/main/java/com/invite/
  InviteApplication.java      entry point
  config/InviteProperties.java   shape of the content in application.yml
  config/WebConfig.java          serves /uploads
  model/RsvpEntry.java           RSVP table
  repo/RsvpRepository.java
  web/InviteController.java      GET  /api/invite
  web/RsvpController.java        POST /api/rsvp, GET /api/admin/rsvps
src/main/resources/
  application.yml             all your content
  static/                     index.html, css, js, assets, admin.html
```
