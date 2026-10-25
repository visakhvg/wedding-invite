package com.invite.web;

import com.invite.config.InviteProperties;
import com.invite.model.RsvpEntry;
import com.invite.repo.RsvpRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class RsvpController {

    public record RsvpRequest(
            @NotBlank @Size(max = 120) String name,
            boolean attending,
            @Min(0) @Max(10) int guests,
            @Size(max = 500) String message) {}

    private final RsvpRepository repo;
    private final InviteProperties props;

    public RsvpController(RsvpRepository repo, InviteProperties props) {
        this.repo = repo;
        this.props = props;
    }

    @PostMapping("/rsvp")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> submit(@Valid @RequestBody RsvpRequest req) {
        if (props.rsvp() == null || !props.rsvp().enabled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "RSVP is closed");
        }
        RsvpEntry e = new RsvpEntry();
        e.setName(req.name().trim());
        e.setAttending(req.attending());
        e.setGuests(req.attending() ? Math.max(req.guests(), 1) : 0);
        e.setMessage(req.message() == null ? null : req.message().trim());
        repo.save(e);
        return Map.of("status", "ok");
    }

    /** Only you can read the replies: send the admin key in the X-Admin-Key header. */
    @GetMapping("/admin/rsvps")
    public List<RsvpEntry> list(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        String expected = props.adminKey();
        boolean ok = expected != null && !expected.isBlank() && key != null
                && MessageDigest.isEqual(
                        expected.getBytes(StandardCharsets.UTF_8),
                        key.getBytes(StandardCharsets.UTF_8));
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong admin key");
        }
        return repo.findAllByOrderByCreatedAtDesc();
    }
}
