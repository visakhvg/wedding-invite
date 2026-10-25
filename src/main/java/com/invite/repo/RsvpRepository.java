package com.invite.repo;

import com.invite.model.RsvpEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RsvpRepository extends JpaRepository<RsvpEntry, Long> {

    List<RsvpEntry> findAllByOrderByCreatedAtDesc();
}
