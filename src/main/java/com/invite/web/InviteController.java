package com.invite.web;

import com.invite.config.InviteProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InviteController {

    private final InviteProperties props;

    public InviteController(InviteProperties props) {
        this.props = props;
    }

    /** The page reads all of its text, photos and event details from here. */
    @GetMapping("/invite")
    public InviteProperties invite() {
        return props;
    }
}
