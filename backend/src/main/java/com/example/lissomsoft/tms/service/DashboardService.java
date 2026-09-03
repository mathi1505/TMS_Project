package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.dto.DashboardCountItem;
import com.example.lissomsoft.tms.dto.DashboardSummaryResponse;
import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.entity.StudentDet;
import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.repository.ConfigDetRepository;
import com.example.lissomsoft.tms.repository.StudentDetRepository;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final StudentMasterRepository studentMasterRepository;
    private final StudentDetRepository studentDetRepository;
    private final ConfigDetRepository configDetRepository;

    public DashboardSummaryResponse summary() {

        List<StudentMaster> activeStudents =
                studentMasterRepository.findAll().stream()
                        .filter(s -> "A".equalsIgnoreCase(s.getDelFlag()))
                        .collect(Collectors.toList());

        List<StudentDet> activeActivity =
                studentDetRepository.findAll().stream()
                        .filter(d -> "A".equalsIgnoreCase(d.getDelFlag()))
                        .collect(Collectors.toList());

        List<DashboardCountItem> activityTiles = studentActivityCounts(activeActivity);

        return new DashboardSummaryResponse(
                activeStudents.size(),
                studentMasterCounts(activeStudents),
                sumOfTileCounts(activityTiles),
                activityTiles
        );
    }


    private List<DashboardCountItem> studentMasterCounts(
            List<StudentMaster> activeStudents) {

        Map<String, Long> counts = activeStudents.stream()
                .map(s -> typeCodeOf(s.getStudentId()))
                .filter(type -> type != null && !type.isEmpty())
                .collect(Collectors.groupingBy(
                        type -> type,
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        return counts.entrySet().stream()
                .map(entry -> new DashboardCountItem(
                        entry.getKey(),
                        entry.getKey(),
                        entry.getValue()
                ))
                .collect(Collectors.toList());
    }


    private String typeCodeOf(String studentId) {
        if (studentId == null || !studentId.toUpperCase().startsWith("LS")) return "";
        String rest = studentId.substring(2);
        int dashIdx = rest.indexOf('-');
        return dashIdx > 0 ? rest.substring(0, dashIdx) : rest;
    }

    private List<DashboardCountItem> studentActivityCounts(List<StudentDet> activeActivity) {

        Map<String, Set<String>> studentsByParticular = new LinkedHashMap<>();

        for (StudentDet d : activeActivity) {
            if (d.getTranParticular() == null) continue;
            String particular = d.getTranParticular().trim();
            if (particular.isEmpty()) continue;

            String key = d.getStudentId() + "::" + d.getStudentNumber();
            studentsByParticular
                    .computeIfAbsent(particular, p -> new LinkedHashSet<>())
                    .add(key);
        }

        Map<String, Long> countByParticular = studentsByParticular.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> (long) e.getValue().size(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        List<ConfigDet> tranConfig = configDetRepository.findByConfigMaster("TRAN").stream()
                .filter(c -> "A".equalsIgnoreCase(c.getDelFlag()))
                .filter(c -> c.getConfigName() != null && !c.getConfigName().trim().isEmpty())
                .sorted(Comparator.comparing(ConfigDet::getConfigId, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<DashboardCountItem> tiles = tranConfig.stream()
                .map(c -> {
                    String particular = c.getConfigName().trim();
                    long count = countByParticular.getOrDefault(particular, 0L);
                    return new DashboardCountItem(particular, particular, count);
                })
                .collect(Collectors.toList());


        Set<String> configured = tranConfig.stream()
                .map(c -> c.getConfigName().trim())
                .collect(Collectors.toSet());

        countByParticular.forEach((particular, count) -> {
            if (!configured.contains(particular)) {
                tiles.add(new DashboardCountItem(particular, particular, count));
            }
        });

        return tiles;
    }


    private long sumOfTileCounts(List<DashboardCountItem> activityTiles) {
        return activityTiles.stream()
                .mapToLong(DashboardCountItem::getCount)
                .sum();
    }
}
